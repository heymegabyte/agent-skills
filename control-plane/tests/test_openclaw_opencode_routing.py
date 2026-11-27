"""Verify Python OpenCode command routing without launching providers."""

import importlib.util
from pathlib import Path
import unittest
from unittest.mock import patch

FLEET = Path(__file__).resolve().parents[1] / "openclaw-fleet"
SPEC = importlib.util.spec_from_file_location("openclaw_fleet_cli", FLEET / "cli.py")
CLI = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(CLI)


class OpenCodeRouting(unittest.TestCase):
    def build(self, alias, env):
        return CLI.build_command(alias, FLEET, FLEET, None, env)

    def test_configured_gateway_preserves_named_tiers(self):
        aliases = {
            "deepseek-flash": "litellm/deepseek-flash",
            "deepseek-v4-pro": "litellm/deepseek-v4-pro",
            "deepseek": "litellm/deepseek-v4-pro",
            "opencode": "litellm/deepseek-v4-pro",
        }
        for alias, model in aliases.items():
            with self.subTest(alias=alias):
                env = {"LITELLM_API_KEY": "fixture-gateway", "DEEPSEEK_API_KEY": "fixture-direct"}
                command, uses_prompt_flag, run_env = self.build(alias, env)
                self.assertEqual(command[1:], ["run", "--format", "json", "-m", model])
                self.assertFalse(uses_prompt_flag)
                self.assertEqual(run_env, env)
                self.assertIsNot(run_env, env)

    def test_broker_gateway_key_is_passed_to_wrapper(self):
        env = {"DEEPSEEK_API_KEY": "fixture-direct"}
        with patch.object(CLI, "resolve_secret", return_value="fixture-broker") as resolve:
            command, _, run_env = self.build("deepseek-flash", env)
        resolve.assert_called_once_with("LITELLM_API_KEY", run_env)
        self.assertEqual(command[-1], "litellm/deepseek-flash")
        self.assertEqual(run_env["LITELLM_API_KEY"], "fixture-broker")
        self.assertEqual(run_env["DEEPSEEK_API_KEY"], "fixture-direct")
        self.assertNotIn("LITELLM_API_KEY", env)

    def test_no_gateway_key_preserves_direct_route_without_key_substitution(self):
        env = {"DEEPSEEK_API_KEY": "fixture-direct"}
        for alias in ("deepseek-flash", "deepseek-v4-pro", "deepseek", "opencode"):
            with self.subTest(alias=alias):
                with patch.object(CLI, "resolve_secret", return_value=""):
                    command, _, run_env = self.build(alias, env)
                self.assertEqual(command[-1], "deepseek/deepseek-chat")
                self.assertEqual(run_env, env)
                self.assertNotIn("LITELLM_API_KEY", run_env)

    def test_hybrid_model_keeps_existing_gateway_route(self):
        with patch.object(CLI, "resolve_secret") as resolve:
            command, _, _ = self.build("hybrid-coder", {})
        resolve.assert_not_called()
        self.assertEqual(command[-1], "litellm/hybrid-coder")
