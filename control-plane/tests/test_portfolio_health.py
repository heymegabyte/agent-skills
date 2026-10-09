import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location('portfolio_health', Path(__file__).resolve().parents[1] / 'portfolio-health.py')
health = importlib.util.module_from_spec(spec)
spec.loader.exec_module(health)


class PortfolioHealthTests(unittest.TestCase):
    def test_mixed_malformed_receipts_and_failure_streak(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            samples = [
                {'project': 'org/a', 'runId': 'first', 'status': 'success', 'startedAt': '2026-01-01T01:00:00Z', 'token': 'never-output'},
                {'project': 'org/a', 'runId': 'second', 'status': 'failure', 'startedAt': '2026-01-02T01:00:00Z', 'objective': 'never-output'},
                {'project': 'org/b', 'runId': 'third', 'status': 'success', 'startedAt': '2026-01-03T01:00:00Z'},
                {'project': 'org/a', 'runId': 'fourth', 'status': 'failure', 'startedAt': 'invalid'},
            ]
            for i, sample in enumerate(samples):
                (root / str(i)).mkdir()
                (root / str(i) / 'run.json').write_text(json.dumps(sample))
            (root / 'bad').mkdir()
            (root / 'bad/run.json').write_text('{bad')
            with patch.object(health, 'command', side_effect=AssertionError('network forbidden')):
                report = health.project_health({'repository': 'org/a', 'enabled': True}, root, True)
            self.assertEqual(report['failureStreak'], 1)
            self.assertEqual(len(report['recentRuns']), 2)
            self.assertTrue(report['lastSuccess'].startswith('2026-01-01'))
            self.assertNotIn('never-output', json.dumps(report))

    def test_github_whitelist_and_dedup(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / 'run').mkdir()
            (root / 'run/run.json').write_text(json.dumps({'project': 'org/a', 'runId': 'org--a-42-1', 'status': 'failure', 'startedAt': '2026-01-01T01:00:00Z'}))
            response = [{'databaseId': 42, 'conclusion': 'success', 'status': 'completed', 'createdAt': '2026-01-01T01:00:00Z', 'url': 'https://github.com/org/a/actions/runs/42', 'secret': 'never-output'}]
            with patch.object(health, 'command', return_value=json.dumps(response)) as execute:
                runs = health.run_history('org/a', root)
            self.assertEqual(len(runs), 1)
            self.assertEqual(runs[0]['status'], 'success')
            self.assertNotIn('never-output', json.dumps(runs))
            self.assertIn('--limit', execute.call_args.args[0])

    def test_failed_github_does_not_invent_runs(self):
        with tempfile.TemporaryDirectory() as directory:
            with patch.object(health, 'command', return_value=None):
                report = health.project_health({'repository': 'org/a'}, Path(directory))
            self.assertEqual(report['recentRuns'], [])
            self.assertIsNone(report['lastSuccess'])
            self.assertEqual(report['scheduleObservation'], 'not-observed')

    def test_collect_drops_untrusted_health_details(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest = root / 'fleet.json'
            manifest.write_text(json.dumps({'machine': 'primary', 'runnerInstances': 1, 'projects': []}))
            def execute(argv):
                if argv[0] == 'get-secret':
                    self.assertEqual(argv, ['get-secret', '--exists', 'DEEPSEEK_API_KEY'])
                    return ''
                if argv[0] == 'openclaw':
                    return json.dumps({'ok': True, 'token': 'never-output'})
                if argv[0] == 'systemctl':
                    return 'active'
                return 'a' * 40
            with patch.object(health, 'command', side_effect=execute):
                report = health.collect(manifest, root, True)
            self.assertEqual(report['gateway'], 'healthy')
            self.assertTrue(report['deepseekSecretAvailable'])
            self.assertNotIn('never-output', json.dumps(report))


if __name__ == '__main__':
    unittest.main()
