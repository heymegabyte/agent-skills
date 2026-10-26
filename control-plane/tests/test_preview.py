"""Unit tests for the Worker version-preview helper (idea #4). Fixture = REAL `wrangler versions
upload` output captured live on megabyte-os-mcp-server (fire-17)."""
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import preview

REAL_OUTPUT = """Total Upload: 8.60 KiB / gzip: 3.49 KiB
Uploaded megabyte-os-mcp-server (1.53 sec)
Worker Version ID: 2bc5c85e-43c7-47e6-81fa-4ae32d46c63c
Version Preview URL: https://2bc5c85e-megabyte-os-mcp-server.manhattan.workers.dev
Version Preview Alias URL: https://fire17-megabyte-os-mcp-server.manhattan.workers.dev
"""


class PreviewParse(unittest.TestCase):
    def test_parses_real_wrangler_output(self):
        parsed = preview.parse_stdout(REAL_OUTPUT)
        self.assertEqual(parsed['versionId'], '2bc5c85e-43c7-47e6-81fa-4ae32d46c63c')
        self.assertEqual(parsed['previewUrl'], 'https://2bc5c85e-megabyte-os-mcp-server.manhattan.workers.dev')
        self.assertEqual(parsed['aliasUrl'], 'https://fire17-megabyte-os-mcp-server.manhattan.workers.dev')

    def test_no_preview_urls_is_safe(self):
        parsed = preview.parse_stdout('Worker Version ID: abc-123\n')
        self.assertEqual(parsed['versionId'], 'abc-123')
        self.assertIsNone(parsed['previewUrl'])
        self.assertIsNone(parsed['aliasUrl'])

    def test_empty_output_is_safe(self):
        parsed = preview.parse_stdout('')
        self.assertIsNone(parsed['versionId'])
        self.assertIsNone(parsed['previewUrl'])
        self.assertIsNone(parsed['aliasUrl'])


if __name__ == '__main__':
    unittest.main()
