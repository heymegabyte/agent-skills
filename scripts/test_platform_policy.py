"""Regression tests for policy wiring checks, not application integration tests."""
from __future__ import annotations
import importlib.util
import json
from pathlib import Path
import shutil
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('platform_policy', ROOT / 'scripts/check-platform-policy.py')
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class PolicyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        manifest = json.loads((ROOT / 'reference/platform-stack.json').read_text())
        paths = [
            *MODULE.RULES, *MODULE.PACKS.values(), *manifest['distributionFiles'],
            *MODULE.ENTRYPOINTS, 'package.json', 'scripts/check-platform-policy.py',
        ]
        for path in paths:
            target = self.root / path
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / path, target)

    def patch_json(self, name, transform):
        path = self.root / name
        data = json.loads(path.read_text())
        transform(data)
        path.write_text(json.dumps(data))

    def test_valid_wiring(self):
        self.assertEqual(MODULE.validate(self.root), [])

    def test_all_mandatory_choices_reject_drift(self):
        for key in MODULE.EXPECTED:
            with self.subTest(choice=key):
                path = self.root / 'reference/platform-stack.json'
                original = path.read_text()
                self.patch_json('reference/platform-stack.json', lambda d: d['choices'].update({key: 'wrong'}))
                self.assertIn(f'Mandatory choice drift: {key}', MODULE.validate(self.root))
                path.write_text(original)

    def test_missing_scope(self):
        self.patch_json('reference/platform-stack.json', lambda d: d['scope'].remove('pdf.kitchen'))
        self.assertIn('Product scope drift', MODULE.validate(self.root))

    def test_unsupported_schema(self):
        for unsupported in [1, 3, 2.0, '2']:
            with self.subTest(schema=unsupported):
                self.patch_json('reference/platform-stack.json', lambda d: d.update(schemaVersion=unsupported))
                self.assertIn('Unsupported policy schemaVersion', MODULE.validate(self.root))

    def test_retired_scope_cannot_return(self):
        self.patch_json('reference/platform-stack.json', lambda d: d['scope'].append('linkbl.ink'))
        self.assertIn('Product scope drift', MODULE.validate(self.root))

    def test_duplicate_scope_is_invalid(self):
        self.patch_json('reference/platform-stack.json', lambda d: d['scope'].append('status.charity'))
        self.assertIn('Product scope drift', MODULE.validate(self.root))

    def test_missing_migration_source(self):
        self.patch_json('reference/platform-stack.json', lambda d: d.update(migrationSources=[]))
        self.assertIn('Migration source drift', MODULE.validate(self.root))

    def test_wrong_module_order(self):
        self.patch_json('reference/platform-stack.json', lambda d: d['rules'].reverse())
        self.assertIn('Required policy modules drift', MODULE.validate(self.root))

    def test_wrong_platform_pack_path(self):
        self.patch_json('reference/platform-stack.json', lambda d: d.update(pack='_packs/core.yml'))
        self.assertIn('Platform pack path drift', MODULE.validate(self.root))

    def test_missing_cross_pack_members(self):
        for rule, pack in [('theme-tools-canonical-components', 'design'), ('total-convergence-and-openspec-handoff', 'core')]:
            with self.subTest(pack=pack):
                path = self.root / f'_packs/{pack}.yml'
                path.write_text(path.read_text().replace(f'  - rules/{rule}\n', ''))
                self.assertIn(f'rules/{rule}.md: absent from {pack} pack', MODULE.validate(self.root))

    def test_manifest_distribution_omission(self):
        self.patch_json('reference/platform-stack.json', lambda d: d['distributionFiles'].remove(d['prompt']))
        self.assertIn('Policy distributionFiles omits prompts/platform-convergence.md', MODULE.validate(self.root))

    def test_missing_pack_member(self):
        path = self.root / '_packs/platform.yml'
        path.write_text(path.read_text().replace('  - rules/platform-agent-ui\n', ''))
        self.assertTrue(any('absent from platform pack' in e for e in MODULE.validate(self.root)))

    def test_wrong_frontmatter_pack(self):
        path = self.root / MODULE.RULES[0]
        path.write_text(path.read_text().replace('pack: "platform"', 'pack: "wrong"'))
        self.assertTrue(any('wrong or missing pack' in e for e in MODULE.validate(self.root)))

    def test_distribution_omission(self):
        self.patch_json('package.json', lambda d: d['files'].remove('prompts/platform-convergence.md'))
        self.assertIn('Distribution excludes prompts/platform-convergence.md', MODULE.validate(self.root))

    def test_missing_entrypoint(self):
        for entrypoint in MODULE.ENTRYPOINTS:
            with self.subTest(entrypoint=entrypoint):
                (self.root / entrypoint).write_text('No policy route here.\n')
                self.assertIn(f'{entrypoint}: missing scoped policy entrypoint', MODULE.validate(self.root))

    def test_missing_source(self):
        (self.root / 'reference/platform-research-2026-10-31.md').unlink()
        self.assertTrue(MODULE.validate(self.root))

    def test_invalid_json(self):
        (self.root / 'reference/remotion-upstream.json').write_text('{broken')
        self.assertTrue(any('invalid JSON object' in e for e in MODULE.validate(self.root)))

    def test_mutable_upstream_pin(self):
        self.patch_json('reference/remotion-upstream.json', lambda d: d.update(commit='main'))
        self.assertTrue(any('full immutable SHA' in e for e in MODULE.validate(self.root)))

    def test_unreviewed_vendoring(self):
        self.patch_json('reference/remotion-upstream.json', lambda d: d.update(vendored=True))
        self.assertIn('Upstream reuse mode requires explicit review', MODULE.validate(self.root))

    def test_escaping_reference(self):
        self.patch_json('reference/platform-stack.json', lambda d: d.update(research='../../outside.md'))
        self.assertTrue(any('Path escapes repository' in e for e in MODULE.validate(self.root)))


if __name__ == '__main__':
    unittest.main()
