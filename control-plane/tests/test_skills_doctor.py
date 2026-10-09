import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location('skills_doctor', Path(__file__).resolve().parents[1] / 'skills-doctor.py')
doctor = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(doctor)


class SkillsDoctorTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.home = Path(self.tmp.name) / 'home'
        self.root = Path(self.tmp.name) / 'skills'
        self.home.mkdir()
        self.root.mkdir()

    def skill(self, path, name='sample', description='Use for examples.'):
        path.mkdir(parents=True, exist_ok=True)
        (path / 'SKILL.md').write_text(f'---\nname: {json.dumps(name)}\ndescription: {json.dumps(description)}\n---\nBody is not prompt metadata.\n')

    def test_links_provenance_and_safe_router_fields(self):
        self.skill(self.root / 'sample')
        for relative in ('.codex/skills', '.claude/skills', '.config/opencode/skills', '.claw-router/accounts/three/skills'):
            target = self.home / relative
            target.mkdir(parents=True)
            (target / 'sample').symlink_to(self.root / 'sample', target_is_directory=True)
        registry = self.home / '.claw-router/config.json'
        registry.write_text(json.dumps({'accounts': [{'name': 'three', 'provider': 'claude', 'configDir': str(self.home / '.claw-router/accounts/three'), 'secret': 'NEVER-EMIT'}]}))
        result = doctor.diagnose(self.root, self.home)
        self.assertTrue(result['ok'])
        self.assertEqual(result['runtimes']['claude-profile:three']['canonicalCount'], 1)
        self.assertEqual(result['descriptionBudget']['utf8Bytes'], len('Use for examples.'))
        self.assertNotIn('NEVER-EMIT', json.dumps(result))

    def test_dangling_links_and_cycles_fail(self):
        self.skill(self.root / 'sample')
        skills = self.home / '.codex/skills'
        skills.mkdir(parents=True)
        (skills / 'broken').symlink_to(self.home / 'missing')
        (skills / 'cycle').symlink_to(skills, target_is_directory=True)
        result = doctor.diagnose(self.root, self.home)
        self.assertFalse(result['ok'])
        self.assertEqual({'dangling-link', 'symlink-cycle'}, {i['code'] for i in result['issues'] if i['severity'] == 'error'})

    def test_openclaw_managed_overrides_extra_source(self):
        self.skill(self.root / 'sample', description='Canonical.')
        self.skill(self.home / '.openclaw/skills/sample', description='Managed.')
        self.skill(self.home / '.agents/skills/sample', description='Personal.')
        result = doctor.diagnose(self.root, self.home)
        known = result['openclawKnownGlobalPrecedence']
        self.assertEqual(known['skills'][0]['description'], 'Personal.')
        self.assertEqual(len(known['overrides']), 2)

    def test_invalid_metadata_does_not_hide_valid_sibling(self):
        self.skill(self.root / 'sample')
        self.skill(self.root / 'bad', name='BAD', description='')
        result = doctor.diagnose(self.root, self.home)
        self.assertFalse(result['ok'])
        self.assertEqual(result['descriptionBudget']['skillCount'], 1)
        self.assertTrue(any(i['code'] == 'invalid-metadata' for i in result['issues']))

    def test_block_scalar_and_portability_warning(self):
        directory = self.root / '01-sample'
        directory.mkdir()
        (directory / 'SKILL.md').write_text('---\nname: sample\ndescription: >-\n  First line\n  second line\nmetadata:\n  version: 1\n---\n')
        result = doctor.diagnose(self.root, self.home)
        self.assertTrue(result['ok'])
        self.assertEqual(result['canonical']['skills'][0]['description'], 'First line second line')
        self.assertTrue(any(i['code'] == 'portable-directory-name-mismatch' for i in result['issues']))

    def test_duplicate_metadata_rejected(self):
        directory = self.root / 'sample'
        directory.mkdir()
        (directory / 'SKILL.md').write_text('---\nname: sample\nname: other\ndescription: Example\n---\n')
        self.assertFalse(doctor.diagnose(self.root, self.home)['ok'])


if __name__ == '__main__':
    unittest.main()
