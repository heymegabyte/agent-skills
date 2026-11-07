import { tool } from "@opencode-ai/plugin"
import { $ } from "bun"

export default tool({
  description: "Route a task to the smallest relevant agent-skills set. Call before substantial work; then read selected skills in full and only directly relevant references.",
  args: {
    task: tool.schema.string().min(3).describe("The requested outcome, not the entire conversation"),
    cwd: tool.schema.string().optional().describe("Project directory; defaults to the active directory"),
    active_tool: tool.schema.string().optional().describe("Tool family about to be used, when known"),
  },
  async execute(args, context) {
    const root = process.env.AGENT_SKILLS_ROOT || `${process.env.HOME}/.agentskills`
    const cwd = args.cwd || context.directory
    const command = ["python3", `${root}/bin/skill-router.py`, "route", args.task, "--cwd", cwd]
    if (args.active_tool) command.push("--tool", args.active_tool)
    const result = await $`${command}`.quiet().nothrow()
    if (result.exitCode !== 0) throw new Error(`skill router failed: ${result.stderr.toString().slice(0, 500)}`)
    return result.stdout.toString()
  },
})
