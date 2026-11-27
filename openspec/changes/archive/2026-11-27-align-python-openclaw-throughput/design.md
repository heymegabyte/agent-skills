## Approach

The repository owner assigned the Codex routing agent as Architect. Limit the change to constructing Python OpenCode commands. The shared wrapper already supports separate LiteLLM and direct DeepSeek credentials. Match the JavaScript entrypoint for explicit Pro and Flash aliases. Use Pro for the generic OpenCode aliases, as documented for routine OpenCode dispatch. Leave the existing hybrid route and unrelated providers alone. Test command construction using synthetic credentials and without launching tools or making provider requests.

Four focused Python 3.12 tests passed. The credential-stripped adapter integration baseline had the same four failures before and after this change. Scoped OpenSpec validation passed; the pre-existing full validation failures in unrelated changes remain outside this scope.
