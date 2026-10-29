#!/usr/bin/env python3
"""Offline regression tests for skill-router correctness and state isolation."""

import importlib.util
import json
import sqlite3
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch


ROUTER_PATH = Path(__file__).resolve().parents[1] / "skill-router.py"
SPEC = importlib.util.spec_from_file_location("skill_router", ROUTER_PATH)
router = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(router)


class RouterTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        root = Path(self.tmp.name)
        router.PLUGIN_DIR = root / "repo"
        router.PACKS_DIR = router.PLUGIN_DIR / "_packs"
        router.DATA_DIR = root / "data"
        router.DB_PATH = router.DATA_DIR / "skills.db"
        router.PROJECTS_DIR = root / "projects"
        router.PLUGIN_DIR.mkdir()
        (router.PLUGIN_DIR / "rules").mkdir()

    def tearDown(self):
        self.tmp.cleanup()

    def write_skill(self, name="Original", description="old", body="Body", triggers=None):
        directory = router.PLUGIN_DIR / "01-demo"
        directory.mkdir(exist_ok=True)
        trigger_yaml = json.dumps(triggers or ["optimize {domain}"])
        (directory / "SKILL.md").write_text(
            f"---\nname: {name}\ndescription: {description}\npriority: 2\n"
            f"triggers: {trigger_yaml}\npaths: []\n---\n{body}\n"
        )
        return directory

    def test_yaml_inline_block_multiline_and_duplicate_keys(self):
        fm, _ = router.parse_frontmatter(
            '---\ntriggers: ["alpha", "beta"]\npaths:\n  - stack:python\n'
            'description: >\n  hello\n  world\n---\nbody\n'
        )
        self.assertEqual(fm["triggers"], ["alpha", "beta"])
        self.assertEqual(fm["paths"], ["stack:python"])
        self.assertEqual(fm["description"], "hello world")
        with self.assertRaises(ValueError):
            router.parse_frontmatter("---\nname: one\nname: two\n---\nbody")
        with self.assertRaises(ValueError):
            router.parse_frontmatter("---\ntriggers: nope\n---\nbody")

    def test_sync_reconciles_metadata_and_deletions(self):
        directory = self.write_skill()
        router.cmd_sync_metadata()
        self.write_skill(name="Renamed", description="new")
        router.cmd_sync_metadata()
        conn = router.db_open()
        self.assertEqual(
            conn.execute("SELECT name,description FROM skills WHERE id='01-demo'").fetchone(),
            ("Renamed", "new"),
        )
        conn.close()
        (directory / "SKILL.md").unlink()
        router.cmd_sync_metadata()
        conn = router.db_open()
        self.assertEqual(conn.execute("SELECT count(*) FROM skills").fetchone()[0], 0)
        conn.close()

    def test_rebuild_repairs_missing_embedding_after_metadata_sync(self):
        self.write_skill()
        router.cmd_sync_metadata()
        calls = []
        vector = [0.1] * router.EMBED_DIM
        with patch.object(router, "get_secret", return_value="fake"), patch.object(
            router, "embed_text", side_effect=lambda text, key: calls.append(text) or vector
        ):
            router.cmd_rebuild_index()
        self.assertEqual(len(calls), 1)
        conn = router.db_open()
        row = conn.execute(
            "SELECT embedding,embedding_model,embedding_dimensions FROM skills WHERE id='01-demo'"
        ).fetchone()
        self.assertIsNotNone(row[0])
        self.assertEqual(row[1:], (router.CF_EMBED_MODEL, router.EMBED_DIM))
        conn.close()

    def test_placeholder_trigger_matches_one_token(self):
        self.write_skill()
        router.cmd_sync_metadata()
        conn = router.db_open()
        self.assertEqual(router.match_triggers("optimize example.com", conn), ["01-demo"])
        self.assertEqual(router.match_triggers("optimize", conn), [])
        conn.close()

    def test_required_budget_reports_unsatisfied(self):
        conn = router.db_open()
        now = 1
        for sid, pri, tokens in (("required", 1, 11), ("optional", 2, 1)):
            conn.execute(
                """INSERT INTO skills
                (id,type,path,name,description,priority,triggers,paths,pack,body_hash,tokens,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
                (sid, "rule", sid, sid, "", pri, "[]", "[]", "", sid, tokens, now),
            )
        result = router.apply_budget(
            [("required", "tier-1 always"), ("optional", "trigger-match")], conn, 10
        )
        self.assertEqual(result["unsatisfied_required"], ["required"])
        self.assertNotIn("optional", result["selected"])
        conn.close()

    def test_project_and_session_cache_keys_do_not_collide(self):
        self.assertNotEqual(router.project_identity("/a-b/c"), router.project_identity("/a/b-c"))
        self.assertNotEqual(
            router.session_cache_path("/a-b/c", "one"),
            router.session_cache_path("/a/b-c", "one"),
        )
        self.assertNotEqual(
            router.session_cache_path("/a/b", "one"),
            router.session_cache_path("/a/b", "two"),
        )
        with self.assertRaises(ValueError):
            router.session_cache_path("/a/b", "")


class RouterBehaviorScenarioTest(unittest.TestCase):
    """§4: routing BEHAVIOR against the REAL rule set — the right rules load, the wrong ones don't.

    Not filename checks: these sync the live repo's rules into an isolated offline DB (keyless,
    triggers only) and assert the trigger-router's selection for representative task prompts.
    """

    @classmethod
    def setUpClass(cls):
        cls._tmp = tempfile.TemporaryDirectory()
        data = Path(cls._tmp.name)
        cls._saved = (router.PLUGIN_DIR, router.PACKS_DIR, router.DATA_DIR, router.DB_PATH)
        router.PLUGIN_DIR = ROUTER_PATH.parents[1]  # the real agent-skills repo root
        router.PACKS_DIR = router.PLUGIN_DIR / "_packs"
        router.DATA_DIR = data
        router.DB_PATH = data / "skills.db"
        router.cmd_sync_metadata()  # offline + keyless (trigger metadata only, no embeddings)
        cls._conn = router.db_open()

    @classmethod
    def tearDownClass(cls):
        cls._conn.close()
        router.PLUGIN_DIR, router.PACKS_DIR, router.DATA_DIR, router.DB_PATH = cls._saved
        cls._tmp.cleanup()

    def _match(self, prompt):
        return set(router.match_triggers(prompt, self._conn))

    def test_neon_migration_loads_neon_guidance(self):
        # A Neon/Postgres migration task pulls in the Neon rule.
        self.assertIn(
            "rules/neon-database-conservation",
            self._match("migrate the neon postgres database schema"),
        )

    def test_upstash_does_not_load_unrelated_neon(self):
        # An unrelated Upstash Redis task does NOT pull in the Neon rule.
        self.assertNotIn(
            "rules/neon-database-conservation",
            self._match("add an upstash redis rate limiter"),
        )

    def test_ui_task_invokes_figma_gate(self):
        # A UI/design task invokes the Figma design-approval gate.
        self.assertIn(
            "rules/figma-design-approval-gate",
            self._match("redesign the dashboard ui and build a prototype"),
        )

    def test_backend_repair_skips_design_gate(self):
        # A backend-only repair does NOT pull in the design-approval gate.
        self.assertNotIn(
            "rules/figma-design-approval-gate",
            self._match("fix the hono api handler returning a 500 error"),
        )


if __name__ == "__main__":
    unittest.main()
