import importlib.util
import hashlib
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


class SkillRouterTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        root = Path(self.temp.name)
        self.skills = root / "skills"
        self.data = root / "data"
        self.projects = root / "projects"
        (self.skills / "rules").mkdir(parents=True)
        (self.skills / "_packs").mkdir()
        router.PLUGIN_DIR = self.skills
        router.PACKS_DIR = self.skills / "_packs"
        router.DATA_DIR = self.data
        router.PROJECTS_DIR = self.projects
        router.DB_PATH = self.data / "skills.db"
        self.original_disable_embeddings = router.os.environ.get("AGENT_SKILLS_DISABLE_EMBEDDINGS")
        router.os.environ["AGENT_SKILLS_DISABLE_EMBEDDINGS"] = "1"

    def tearDown(self):
        if self.original_disable_embeddings is None:
            router.os.environ.pop("AGENT_SKILLS_DISABLE_EMBEDDINGS", None)
        else:
            router.os.environ["AGENT_SKILLS_DISABLE_EMBEDDINGS"] = self.original_disable_embeddings
        self.temp.cleanup()

    def write_rule(self, name="sample", trigger="optimize {domain}", depends_on=None):
        dependencies = ""
        if depends_on:
            dependencies = "dependsOn:\n" + "".join(f"  - \"{item}\"\n" for item in depends_on)
        (self.skills / "rules" / f"{name}.md").write_text(
            f'---\nname: "{name}"\npriority: 2\npack: "core"\ntriggers:\n  - "{trigger}"\npaths:\n  - "*.example"\n{dependencies}---\n\n# {name}\n'
        )

    def write_evidence(self, **overrides):
        artifact = {
            "schemaVersion": "1.0.0",
            "artifactId": "artifact:test",
            "tenantId": "tenant:test",
            "environmentId": "environment:test",
            "generatedAt": "2026-11-22T00:00:00Z",
            "expiresAt": "2099-01-01T00:00:00Z",
            "readiness": "locally_tested",
            "evidence": [{
                "id": "evidence:billing",
                "skillIds": ["rules/billing-guide"],
                "routingTags": ["billing-guide"],
                "sourceVersion": "docs@abc123",
                "researchDate": "2026-11-22",
                "citationIds": ["citation:one"],
                "confidence": 0.9,
                "contradictionIds": [],
            }],
            "contradictions": [],
            "unresolvedQuestions": [],
            "budgetStatus": "within_budget",
        }
        artifact.update(overrides)
        canonical = json.dumps(artifact, sort_keys=True, separators=(",", ":"))
        artifact["integrityDigest"] = hashlib.sha256(canonical.encode()).hexdigest()
        path = Path(self.temp.name) / "evidence.json"
        path.write_text(json.dumps(artifact))
        return path

    def test_source_root_defaults_to_router_checkout(self):
        self.assertEqual(router.SOURCE_ROOT, ROUTER_PATH.parents[1])

    def test_routable_evidence_schema_requires_environment_and_nested_citations(self):
        schema_path = ROUTER_PATH.parents[1] / "schemas" / "routable-research-evidence.schema.json"
        schema = json.loads(schema_path.read_text())
        self.assertIn("environmentId", schema["required"])
        self.assertEqual(schema["properties"]["schemaVersion"]["const"], "1.0.0")
        self.assertIn("citationIds", schema["$defs"]["evidenceItem"]["required"])

    def test_route_cli_passes_tenant_and_environment_scope(self):
        with patch.object(router, "cmd_route", return_value={"selected": []}) as routed:
            self.assertEqual(router.main([
                "skill-router.py", "route", "investigate", "--evidence", "/tmp/evidence.json",
                "--pass", "post-research", "--tenant", "tenant:test",
                "--environment", "environment:test", "--offline",
            ]), 0)
        self.assertEqual(routed.call_args.kwargs["expected_tenant"], "tenant:test")
        self.assertEqual(routed.call_args.kwargs["expected_environment"], "environment:test")

    def test_playwright_tool_routes_to_consolidated_e2e_contract(self):
        for tool_prefix in ("mcp__playwright__", "mcp__plugin_playwright_"):
            selected = router.TOOL_TO_SKILLS[tool_prefix]
            self.assertIn("rules/e2e-testing", selected)
            self.assertNotIn("rules/e2e-tdd-organization", selected)
            self.assertNotIn("rules/e2e-visual-inspection", selected)

    def test_wildcard_trigger_matches_one_token_and_respects_boundaries(self):
        self.write_rule()
        router.cmd_sync_metadata(quiet=True)
        conn = router.db_open()
        self.assertEqual(router.match_triggers("optimize acme.dev", conn), ["rules/sample"])
        self.assertEqual(router.match_triggers("reoptimize acme.dev", conn), [])
        conn.close()

    def test_inline_frontmatter_lists_participate_in_routing(self):
        path = self.skills / "rules" / "inline.md"
        path.write_text('---\nname: "inline"\npriority: 3\npack: "core"\ntriggers: ["exact phrase", "second"]\npaths: ["concern:inline"]\ndependsOn: ["rules/base"]\n---\n# Inline\n')
        self.write_rule(name="base", trigger="base")
        discovered = {item["id"]: item for item in router.discover_skills()}
        self.assertEqual(discovered["rules/inline"]["triggers"], ["exact phrase", "second"])
        self.assertEqual(discovered["rules/inline"]["paths"], ["concern:inline"])
        self.assertEqual(discovered["rules/inline"]["depends_on"], ["rules/base"])
        router.cmd_sync_metadata(quiet=True)
        conn = router.db_open()
        self.assertIn("rules/inline", router.match_triggers("use exact phrase now", conn))
        conn.close()

    def test_path_matching_uses_globs_not_substrings(self):
        self.assertTrue(router.path_match(["*.example"], {"cwd": "/tmp/shop.example"}))
        self.assertFalse(router.path_match(["*.example"], {"cwd": "/tmp/shop.example.backup"}))

    def test_metadata_sync_prunes_deleted_rules(self):
        self.write_rule()
        router.cmd_sync_metadata(quiet=True)
        (self.skills / "rules" / "sample.md").unlink()
        router.cmd_sync_metadata(quiet=True)
        conn = router.db_open()
        self.assertEqual(conn.execute("SELECT COUNT(*) FROM skills").fetchone()[0], 0)
        conn.close()

    def test_frontmatter_change_updates_source_digest(self):
        self.write_rule(trigger="first phrase")
        router.cmd_sync_metadata(quiet=True)
        conn = router.db_open()
        before = conn.execute("SELECT value FROM meta WHERE key='source_digest'").fetchone()[0]
        conn.close()
        self.write_rule(trigger="second phrase")
        router.cmd_sync_metadata(quiet=True)
        conn = router.db_open()
        after = conn.execute("SELECT value FROM meta WHERE key='source_digest'").fetchone()[0]
        conn.close()
        self.assertNotEqual(before, after)

    def test_dependency_change_updates_source_digest(self):
        self.write_rule(name="base", trigger="base")
        self.write_rule(name="feature", trigger="feature")
        before = router.source_digest(router.discover_skills())
        self.write_rule(name="feature", trigger="feature", depends_on=["rules/base"])
        after = router.source_digest(router.discover_skills())
        self.assertNotEqual(before, after)

    def test_missing_description_is_derived_for_routing(self):
        self.write_rule(name="derived", trigger="unrelated")
        path = self.skills / "rules" / "derived.md"
        path.write_text(path.read_text().replace("# derived", "# Durable invoice reconciliation"))
        discovered = {item["id"]: item for item in router.discover_skills()}
        self.assertEqual(discovered["rules/derived"]["description"], "Durable invoice reconciliation")

    def test_session_cache_uses_session_identity_and_ttl_metadata(self):
        original = router.os.environ.get("AGENT_SKILLS_SESSION_ID")
        router.os.environ["AGENT_SKILLS_SESSION_ID"] = "test-session"
        try:
            router.cmd_track("rules/sample", "/tmp/project")
            path = router.session_cache_path("/tmp/project")
            self.assertIn("test-session", path.name)
            data = json.loads(path.read_text())
            self.assertIn("updated_at", data)
        finally:
            if original is None:
                router.os.environ.pop("AGENT_SKILLS_SESSION_ID", None)
            else:
                router.os.environ["AGENT_SKILLS_SESSION_ID"] = original

    def test_cache_identity_cannot_escape_projects_directory(self):
        original = router.os.environ.get("AGENT_SKILLS_SESSION_ID")
        router.os.environ["AGENT_SKILLS_SESSION_ID"] = "../../outside"
        try:
            path = router.session_cache_path("../../project")
            path.resolve().relative_to(router.PROJECTS_DIR.resolve())
            self.assertNotIn("..", path.name)
        finally:
            if original is None:
                router.os.environ.pop("AGENT_SKILLS_SESSION_ID", None)
            else:
                router.os.environ["AGENT_SKILLS_SESSION_ID"] = original

    def test_keyless_lexical_fallback_finds_relevant_rule(self):
        self.write_rule(name="billing-guide", trigger="subscription invoice")
        self.write_rule(name="generic-guide", trigger="fix account")
        router.cmd_sync_metadata(quiet=True)
        conn = router.db_open()
        results = router.lexical_topk("fix subscription invoice", conn)
        conn.close()
        self.assertEqual(results[0][0], "rules/billing-guide")
        self.assertGreater(results[0][1], results[1][1])

    def test_bm25_ambiguity_is_deterministic(self):
        self.write_rule(name="alpha", trigger="shared ambiguous phrase")
        self.write_rule(name="beta", trigger="shared ambiguous phrase")
        router.cmd_sync_metadata(quiet=True)
        conn = router.db_open()
        first = router.lexical_topk("shared ambiguous phrase", conn)
        second = router.lexical_topk("shared ambiguous phrase", conn)
        conn.close()
        self.assertEqual(first, second)
        self.assertEqual([item[0] for item in first[:2]], ["rules/alpha", "rules/beta"])

    def test_embedding_uses_scoped_token_without_hardcoded_account_identity(self):
        original_secret = router.get_secret
        router.get_secret = lambda key: {"CLOUDFLARE_ACCOUNT_ID": "account-id"}.get(key)

        class Response:
            def __enter__(self): return self
            def __exit__(self, *_args): return False
            def read(self): return b'{"result":{"data":[[0.1,0.2]]}}'

        try:
            with patch.object(router, "urlopen", return_value=Response()) as opened:
                self.assertEqual(router.embed_text("hello", "scoped-token"), [0.1, 0.2])
            request = opened.call_args.args[0]
            self.assertEqual(request.headers["Authorization"], "Bearer scoped-token")
            self.assertNotIn("X-auth-email", request.headers)
            self.assertIn("/accounts/account-id/", request.full_url)
        finally:
            router.get_secret = original_secret

    def test_fingerprint_detects_better_auth_nx_bun_and_monorepo(self):
        project = Path(self.temp.name) / "project"
        project.mkdir()
        (project / "package.json").write_text(json.dumps({"workspaces": ["apps/*"], "dependencies": {"better-auth": "1", "nx": "1"}}))
        (project / "tsconfig.json").write_text("{}")
        (project / "bun.lock").write_text("")
        result = router.cmd_fingerprint(str(project))
        self.assertTrue(result["has_auth"])
        self.assertTrue({"nx-workspace", "monorepo", "bun", "software-project", "typescript"}.issubset(result["concerns"]))

    def test_route_expands_declared_dependencies(self):
        self.write_rule(name="base", trigger="base only")
        self.write_rule(name="feature", trigger="build feature", depends_on=["rules/base"])
        result = router.cmd_route("build feature", cwd=self.temp.name)
        selected = {item["id"]: item for item in result["selected"]}
        self.assertIn("rules/base", selected)
        self.assertEqual(selected["rules/base"]["reason"], "dependency:rules/feature")
        self.assertEqual(result["dependency_errors"], [])

    def test_route_reports_missing_dependencies(self):
        self.write_rule(name="feature", trigger="build feature", depends_on=["rules/missing"])
        result = router.cmd_route("build feature", cwd=self.temp.name)
        self.assertEqual(result["dependency_errors"][0]["code"], "missing-dependency")

    def test_post_research_route_selects_skill_and_attaches_only_relevant_evidence(self):
        self.write_rule(name="billing-guide", trigger="unrelated trigger")
        self.write_rule(name="other", trigger="other unrelated")
        result = router.cmd_route(
            "investigate the account",
            cwd=self.temp.name,
            evidence_path=str(self.write_evidence()),
            route_pass="post-research",
            expected_tenant="tenant:test",
            expected_environment="environment:test",
            offline=True,
        )
        selected = {item["id"]: item for item in result["selected"]}
        self.assertIn("rules/billing-guide", selected)
        self.assertEqual(selected["rules/billing-guide"]["evidence_ids"], ["evidence:billing"])
        self.assertEqual(selected.get("rules/other", {}).get("evidence_ids", []), [])
        self.assertEqual(result["route_pass"], "post-research")
        self.assertEqual(result["evidence_artifact_id"], "artifact:test")

    def test_post_research_route_rejects_tampered_cross_tenant_and_stale_artifacts(self):
        self.write_rule(name="billing-guide", trigger="unrelated trigger")
        path = self.write_evidence()
        artifact = json.loads(path.read_text())
        artifact["evidence"][0]["confidence"] = 0.1
        path.write_text(json.dumps(artifact))
        with self.assertRaisesRegex(ValueError, "integrity mismatch"):
            router.cmd_route("investigate", cwd=self.temp.name, evidence_path=str(path), route_pass="post-research", expected_tenant="tenant:test", expected_environment="environment:test", offline=True)

        scoped = self.write_evidence()
        with self.assertRaisesRegex(ValueError, "tenant scope mismatch"):
            router.cmd_route("investigate", cwd=self.temp.name, evidence_path=str(scoped), route_pass="post-research", expected_tenant="tenant:other", expected_environment="environment:test", offline=True)

        stale = self.write_evidence(expiresAt="2020-01-01T00:00:00Z")
        with self.assertRaisesRegex(ValueError, "stale"):
            router.cmd_route("investigate", cwd=self.temp.name, evidence_path=str(stale), route_pass="post-research", expected_tenant="tenant:test", expected_environment="environment:test", offline=True)

    def test_post_research_route_rejects_cross_environment_and_future_artifacts(self):
        self.write_rule(name="billing-guide", trigger="unrelated trigger")
        scoped = self.write_evidence()
        with self.assertRaisesRegex(ValueError, "environment scope mismatch"):
            router.cmd_route("investigate", cwd=self.temp.name, evidence_path=str(scoped), route_pass="post-research", expected_tenant="tenant:test", expected_environment="environment:prod", offline=True)
        future = self.write_evidence(generatedAt="2098-01-01T00:00:00Z")
        with self.assertRaisesRegex(ValueError, "generatedAt is in the future"):
            router.cmd_route("investigate", cwd=self.temp.name, evidence_path=str(future), route_pass="post-research", expected_tenant="tenant:test", expected_environment="environment:test", offline=True)

    def test_post_research_route_rejects_invalid_nested_evidence(self):
        self.write_rule(name="billing-guide", trigger="unrelated trigger")
        invalid_cases = [
            ({"citationIds": []}, "citationIds"),
            ({"sourceVersion": ""}, "sourceVersion"),
            ({"researchDate": "2026-02-30"}, "researchDate"),
            ({"confidence": 1.1}, "confidence"),
            ({"contradictionIds": ["contradiction:missing"]}, "unknown contradiction"),
        ]
        for item_override, expected_error in invalid_cases:
            artifact_path = self.write_evidence()
            artifact = json.loads(artifact_path.read_text())
            artifact["evidence"][0].update(item_override)
            canonical = {key: value for key, value in artifact.items() if key != "integrityDigest"}
            artifact["integrityDigest"] = hashlib.sha256(json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
            artifact_path.write_text(json.dumps(artifact))
            with self.assertRaisesRegex(ValueError, expected_error):
                router.cmd_route("investigate", cwd=self.temp.name, evidence_path=str(artifact_path), route_pass="post-research", expected_tenant="tenant:test", expected_environment="environment:test", offline=True)

    def test_post_research_route_rejects_duplicate_ids_and_invalid_budget_state(self):
        self.write_rule(name="billing-guide", trigger="unrelated trigger")
        duplicate = self.write_evidence()
        artifact = json.loads(duplicate.read_text())
        artifact["evidence"].append(dict(artifact["evidence"][0]))
        canonical = {key: value for key, value in artifact.items() if key != "integrityDigest"}
        artifact["integrityDigest"] = hashlib.sha256(json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        duplicate.write_text(json.dumps(artifact))
        with self.assertRaisesRegex(ValueError, "ids contain duplicates"):
            router.cmd_route("investigate", cwd=self.temp.name, evidence_path=str(duplicate), route_pass="post-research", expected_tenant="tenant:test", expected_environment="environment:test", offline=True)
        invalid_budget = self.write_evidence(budgetStatus="unbounded")
        with self.assertRaisesRegex(ValueError, "budgetStatus is invalid"):
            router.cmd_route("investigate", cwd=self.temp.name, evidence_path=str(invalid_budget), route_pass="post-research", expected_tenant="tenant:test", expected_environment="environment:test", offline=True)

    def test_post_research_route_selects_by_routing_tag_without_explicit_skill_id(self):
        self.write_rule(name="billing-guide", trigger="unrelated trigger")
        path = self.write_evidence()
        artifact = json.loads(path.read_text())
        artifact["evidence"][0]["skillIds"] = []
        artifact["evidence"][0]["routingTags"] = ["billing-guide"]
        canonical = {key: value for key, value in artifact.items() if key != "integrityDigest"}
        artifact["integrityDigest"] = hashlib.sha256(json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        path.write_text(json.dumps(artifact))
        result = router.cmd_route("investigate", cwd=self.temp.name, evidence_path=str(path), route_pass="post-research", expected_tenant="tenant:test", expected_environment="environment:test", offline=True)
        selected = {item["id"]: item for item in result["selected"]}
        self.assertEqual(selected["rules/billing-guide"]["evidence_ids"], ["evidence:billing"])

    def test_initial_route_rejects_post_research_pass_without_artifact(self):
        self.write_rule(name="sample", trigger="sample")
        with self.assertRaisesRegex(ValueError, "requires a validated evidence artifact"):
            router.cmd_route("sample", cwd=self.temp.name, route_pass="post-research", offline=True)

    def test_route_reports_deterministic_budget_truncation(self):
        self.write_rule(name="alpha", trigger="shared budget request")
        self.write_rule(name="beta", trigger="shared budget request")
        original_budget = router.DEFAULT_BUDGET_TOKENS
        try:
            router.DEFAULT_BUDGET_TOKENS = 1
            result = router.cmd_route("shared budget request", cwd=self.temp.name, offline=True)
        finally:
            router.DEFAULT_BUDGET_TOKENS = original_budget
        self.assertEqual(result["selected"], [])
        self.assertEqual(sorted(result["dropped_for_budget"]), ["rules/alpha", "rules/beta"])
        self.assertEqual(result["budget"], 1)

    def test_clone_saas_trigger_routes_hydration_without_capturing_bug_fix(self):
        self.write_rule(name="greenfield-saas", trigger="clone Notion")
        clone = router.cmd_route("clone Notion", cwd=self.temp.name)
        fix = router.cmd_route("fix the mega menu title changing on hover", cwd=self.temp.name)
        self.assertIn("rules/greenfield-saas", {item["id"] for item in clone["selected"]})
        self.assertNotIn("rules/greenfield-saas", {item["id"] for item in fix["selected"]})

    def test_telemetry_is_prompt_redacted(self):
        self.write_rule(name="feature", trigger="secret prompt")
        telemetry = Path(self.temp.name) / "telemetry.jsonl"
        original = router.os.environ.get("AGENT_SKILLS_TELEMETRY_PATH")
        router.os.environ["AGENT_SKILLS_TELEMETRY_PATH"] = str(telemetry)
        try:
            router.cmd_route("secret prompt", cwd=self.temp.name)
            payload = telemetry.read_text()
            self.assertNotIn("secret prompt", payload)
            self.assertIn("prompt_hash", payload)
        finally:
            if original is None:
                router.os.environ.pop("AGENT_SKILLS_TELEMETRY_PATH", None)
            else:
                router.os.environ["AGENT_SKILLS_TELEMETRY_PATH"] = original

    def test_rebuild_index_is_atomic_when_any_embedding_fails(self):
        self.write_rule(name="first", trigger="first")
        self.write_rule(name="second", trigger="second")
        router.cmd_sync_metadata(quiet=True)
        original_secret, original_embed = router.get_secret, router.embed_text
        router.get_secret = lambda _key: "test-key"

        def failing_embed(text, _api_key=None):
            if "second" in text:
                raise RuntimeError("controlled failure")
            return [0.1, 0.2]

        router.embed_text = failing_embed
        try:
            with self.assertRaises(SystemExit):
                router.cmd_rebuild_index()
            conn = router.db_open()
            rows = conn.execute("SELECT body_hash, embedding FROM skills ORDER BY id").fetchall()
            last_rebuild = conn.execute("SELECT value FROM meta WHERE key='last_rebuild'").fetchone()
            conn.close()
            self.assertEqual(rows, [("", None), ("", None)])
            self.assertIsNone(last_rebuild)
        finally:
            router.get_secret, router.embed_text = original_secret, original_embed

    def test_rebuild_index_promotes_complete_embedding_set(self):
        self.write_rule(name="first", trigger="first")
        router.cmd_sync_metadata(quiet=True)
        original_secret, original_embed = router.get_secret, router.embed_text
        router.get_secret = lambda _key: "test-key"
        router.embed_text = lambda _text, _api_key=None: [0.1, 0.2]
        try:
            router.cmd_rebuild_index()
            conn = router.db_open()
            row = conn.execute("SELECT body_hash, embedding FROM skills WHERE id='rules/first'").fetchone()
            last_rebuild = conn.execute("SELECT value FROM meta WHERE key='last_rebuild'").fetchone()
            conn.close()
            self.assertTrue(row[0])
            self.assertEqual(json.loads(row[1]), [0.1, 0.2])
            self.assertIsNotNone(last_rebuild)
        finally:
            router.get_secret, router.embed_text = original_secret, original_embed


if __name__ == "__main__":
    unittest.main()
