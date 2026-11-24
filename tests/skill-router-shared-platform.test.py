import json
import tempfile
import unittest
from pathlib import Path
import importlib.util


SPEC = importlib.util.spec_from_file_location("skill_router", Path(__file__).parents[1] / "bin" / "skill-router.py")
router = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(router)


class SharedPlatformFingerprintTest(unittest.TestCase):
    def test_emits_platform_concerns_from_dependencies(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            root.joinpath("package.json").write_text(json.dumps({"dependencies": {
                "@ag-ui/core": "1.0.0",
                "better-auth": "1.0.0",
                "@remotion/player": "4.0.0",
                "@theme.tools/ui": "1.0.0",
            }}))
            concerns = set(router.cmd_fingerprint(directory)["concerns"])
            self.assertTrue({"agent-ui", "identity-knowledge-integrations", "content-media", "shared-platform"} <= concerns)
            self.assertTrue(router.path_match(["concern:agent-ui"], {"concerns": list(concerns)}))
            self.assertTrue(router.path_match(["concern:shared-platform"], {"concerns": list(concerns)}))
            self.assertTrue(router.path_match(["concern:identity-knowledge-integrations"], {"concerns": list(concerns)}))
            self.assertTrue(router.path_match(["concern:content-media"], {"concerns": list(concerns)}))


if __name__ == "__main__":
    unittest.main()
