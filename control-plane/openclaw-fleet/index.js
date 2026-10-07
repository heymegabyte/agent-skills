import { fileURLToPath } from "node:url";

export default {
  id: "fleet-cli",
  name: "Megabyte Fleet CLI",
  register(api) {
    api.registerCliBackend({
      id: "fleet-cli",
      config: {
        command: "python3",
        args: [fileURLToPath(new URL("./cli.py", import.meta.url))],
        input: "stdin",
        output: "json",
        modelArg: "--provider-model",
        sessionMode: "none",
        serialize: false,
        clearEnv: ["ANTHROPIC_API_KEY", "ANTHROPIC_AUTH_TOKEN", "OPENAI_API_KEY", "OPENAI_BASE_URL", "ANTHROPIC_BASE_URL", "CLAUDE_CODE_OAUTH_TOKEN"],
      },
    });
  },
};
