"""Unit tests for the fleet cost + activity rollup (idea #2). Fixtures model the real run.json schema."""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import cost


def write_run(logs, name, **fields):
    directory = logs / name
    directory.mkdir(parents=True)
    (directory / 'run.json').write_text(json.dumps(fields))


class CostRollup(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.logs = Path(self.tmp.name)
        write_run(self.logs, 'r1', project='heymegabyte/a', status='success', durationSeconds=100,
                  compute=[{'runtime': 'claude', 'events': [{'usage': {'tokens': 1200, 'cost': 0.5}}]}])
        write_run(self.logs, 'r2', project='heymegabyte/a', status='failure', failureCategory='no-op',
                  durationSeconds=40, compute=[])
        write_run(self.logs, 'r3', project='heymegabyte/a', status='failure', durationSeconds=60,
                  compute=[{'runtime': 'deepseek', 'events': [{'usage': {'tokens': 800}}]}])
        write_run(self.logs, 'r4', project='heymegabyte/b', status='success', durationSeconds=200,
                  compute=[{'runtime': 'claude', 'events': [{'usage': {'tokens': 2000, 'cost': 1.0}},
                                                            {'usage': {'tokens': 500}}]}])

    def tearDown(self):
        self.tmp.cleanup()

    def test_rollup_aggregates_per_project(self):
        report = cost.build(self.logs)
        self.assertEqual(report['meta']['records'], 4)
        a = report['byProject']['heymegabyte/a']
        self.assertEqual(a['runs'], 3)
        self.assertEqual(a['success'], 1)
        self.assertEqual(a['noop'], 1)
        self.assertEqual(a['failure'], 2)              # the no-op + the plain failure
        self.assertEqual(a['successRate'], round(1 / 3, 3))
        self.assertEqual(a['usage']['tokens'], 2000)    # 1200 + 800, shape-agnostic sum
        self.assertEqual(a['usage']['cost'], 0.5)
        self.assertEqual(a['runtimes'], {'claude': 1, 'deepseek': 1})
        self.assertEqual(a['avgDurationSeconds'], round(200 / 3, 1))
        b = report['byProject']['heymegabyte/b']
        self.assertEqual(b['usage']['tokens'], 2500)    # 2000 + 500 across two events
        self.assertEqual(b['usage']['cost'], 1.0)
        self.assertEqual(b['successRate'], 1.0)

    def test_empty_logs_is_safe(self):
        with tempfile.TemporaryDirectory() as empty:
            report = cost.build(empty)
            self.assertEqual(report['meta']['records'], 0)
            self.assertEqual(report['byProject'], {})
            self.assertIn('No run records', cost.render(report))

    def test_malformed_run_json_is_skipped_not_fatal(self):
        bad = self.logs / 'bad'
        bad.mkdir()
        (bad / 'run.json').write_text('{ not json')
        report = cost.build(self.logs)
        self.assertEqual(report['meta']['records'], 4)  # the malformed one is skipped


if __name__ == '__main__':
    unittest.main()
