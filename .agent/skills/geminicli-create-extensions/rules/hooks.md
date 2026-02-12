# Hook Creation Rules

## Overview

Hooks are scripts that Gemini CLI runs at specific lifecycle points. They run **synchronously** — the CLI waits for all matching hooks to complete.

## The Golden Rule

> **stdout = JSON ONLY. stderr = logs/debugging.**

Even a single `echo` or `print` to stdout before the JSON will break parsing. Use `>&2` for all debug output.

## Exit Codes

| Exit Code | Label        | Impact                                                               |
| :-------- | :----------- | :------------------------------------------------------------------- |
| **0**     | Success      | stdout parsed as JSON. **Preferred for ALL logic** including denials |
| **2**     | System Block | Critical block. stderr used as rejection reason                      |
| **Other** | Warning      | Non-fatal. CLI continues with warning                                |

## 11 Lifecycle Events

| Event                 | When                                  | Impact                 | Common Use                    |
| :-------------------- | :------------------------------------ | :--------------------- | :---------------------------- |
| `SessionStart`        | Session begins (startup/resume/clear) | Inject Context         | Initialize, load context      |
| `SessionEnd`          | Session ends (exit/clear)             | Advisory               | Clean up, save state          |
| `BeforeAgent`         | After user prompt, before planning    | Block Turn / Context   | Add context, validate prompts |
| `AfterAgent`          | Agent loop ends                       | Retry / Halt           | Validate response quality     |
| `BeforeModel`         | Before LLM request                    | Block Turn / Mock      | Modify prompts, swap models   |
| `AfterModel`          | After LLM response chunk              | Block / Redact         | Filter/redact, PII removal    |
| `BeforeToolSelection` | Before tool selection                 | Filter Tools           | Reduce available tools        |
| `BeforeTool`          | Before tool executes                  | Block Tool / Rewrite   | Validate args, security       |
| `AfterTool`           | After tool executes                   | Block Result / Context | Process results, hide output  |
| `PreCompress`         | Before context compression            | Advisory               | Save state                    |
| `Notification`        | System alert                          | Advisory               | Forward alerts, logging       |

## Configuration (settings.json)

```json
{
  "hooks": {
    "<EventName>": [
      {
        "matcher": "<regex-for-tools|exact-for-lifecycle|*>",
        "sequential": false,
        "hooks": [
          {
            "name": "my-hook",
            "type": "command",
            "command": "$GEMINI_PROJECT_DIR/.gemini/hooks/my-hook.sh",
            "timeout": 5000,
            "description": "What this hook does"
          }
        ]
      }
    ]
  }
}
```

### Matcher Rules

- **Tool events** (`BeforeTool`, `AfterTool`): Regex patterns (e.g., `"write_file|replace"`)
- **Lifecycle events**: Exact strings (e.g., `"startup"`, `"exit"`)
- **Wildcard**: `"*"` or `""` matches everything

## Base Input (stdin JSON)

Every hook receives:

```json
{
  "session_id": "string",
  "transcript_path": "string",
  "cwd": "string",
  "hook_event_name": "string",
  "timestamp": "ISO 8601"
}
```

Plus event-specific fields (see below).

## Common Output Fields (stdout JSON)

| Field            | Type    | Description                             |
| :--------------- | :------ | :-------------------------------------- |
| `systemMessage`  | string  | Displayed to user in terminal           |
| `decision`       | string  | `"allow"` or `"deny"` (alias `"block"`) |
| `reason`         | string  | Feedback when decision is deny          |
| `continue`       | boolean | `false` = kill entire agent loop        |
| `stopReason`     | string  | Message when continue is false          |
| `suppressOutput` | boolean | Hide from logs/telemetry                |

## Event-Specific Details

### BeforeTool

**Additional input:** `tool_name`, `tool_input`, `mcp_context`
**Key outputs:**

- `decision: "deny"` + `reason` → blocks tool, reason sent to agent as error
- `hookSpecificOutput.tool_input` → merges with/overrides model args

### AfterTool

**Additional input:** `tool_name`, `tool_input`, `tool_response`
**Key outputs:**

- `decision: "deny"` + `reason` → hides real output, reason replaces it
- `hookSpecificOutput.additionalContext` → appended to tool result

### BeforeAgent

**Additional input:** `prompt`
**Key outputs:**

- `hookSpecificOutput.additionalContext` → appended to prompt for this turn
- `decision: "deny"` → blocks turn, discards message

### AfterAgent

**Additional input:** `prompt`, `prompt_response`, `stop_hook_active`
**Key outputs:**

- `decision: "deny"` + `reason` → rejects response, forces retry with reason as new prompt
- `hookSpecificOutput.clearContext` → clears LLM memory

### BeforeModel

**Additional input:** `llm_request` (model, messages, config)
**Key outputs:**

- `hookSpecificOutput.llm_request` → overrides request (model, temperature, etc.)
- `hookSpecificOutput.llm_response` → synthetic response, skips LLM call entirely

### BeforeToolSelection

**Additional input:** `llm_request`
**Key outputs:**

- `hookSpecificOutput.toolConfig.mode` → `"AUTO"`, `"ANY"`, `"NONE"`
- `hookSpecificOutput.toolConfig.allowedFunctionNames` → whitelist
- Multiple hooks' whitelists are **combined** (union strategy)

### AfterModel

**Additional input:** `llm_request`, `llm_response`

- Fires for **every chunk** during streaming
- `hookSpecificOutput.llm_response` → replaces current chunk

## Environment Variables

| Variable             | Description                   |
| :------------------- | :---------------------------- |
| `GEMINI_PROJECT_DIR` | Absolute path to project root |
| `GEMINI_SESSION_ID`  | Current session ID            |
| `GEMINI_CWD`         | Current working directory     |

## Templates

### Bash: Block Secrets (BeforeTool)

```bash
#!/usr/bin/env bash
input=$(cat)
content=$(echo "$input" | jq -r '.tool_input.content // .tool_input.new_string // ""')

if echo "$content" | grep -qE 'api[_-]?key|password|secret'; then
  echo "Blocked potential secret" >&2
  cat <<EOF
{
  "decision": "deny",
  "reason": "Security Policy: Potential secret detected in content.",
  "systemMessage": "🔒 Security scanner blocked this operation"
}
EOF
  exit 0
fi

echo '{"decision": "allow"}'
exit 0
```

### Bash: Inject Git Context (BeforeAgent)

```bash
#!/usr/bin/env bash
context=$(git log -5 --oneline 2>/dev/null || echo "No git history")
cat <<EOF
{
  "hookSpecificOutput": {
    "hookEventName": "BeforeAgent",
    "additionalContext": "Recent commits:\n$context"
  }
}
EOF
```

### Node.js: Tool Filtering (BeforeToolSelection)

```javascript
#!/usr/bin/env node
const fs = require("fs");
const input = JSON.parse(fs.readFileSync(0, "utf-8"));
const messages = input.llm_request?.messages || [];
const lastUser = messages
  .slice()
  .reverse()
  .find((m) => m.role === "user");

if (!lastUser) {
  console.log("{}");
  process.exit(0);
}

const text = lastUser.content;
const allowed = ["write_todos"];
if (text.includes("read")) allowed.push("read_file", "list_directory");
if (text.includes("test")) allowed.push("run_shell_command");

if (allowed.length > 1) {
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "BeforeToolSelection",
        toolConfig: { mode: "AUTO", allowedFunctionNames: allowed },
      },
    }),
  );
} else {
  console.log("{}");
}
```

## Best Practices

1. **Keep hooks fast** — they run synchronously, slow hooks delay everything
2. **Cache expensive ops** — use `.gemini/hook-cache.json` for repeated computations
3. **Use specific matchers** — `"write_file|replace"` not `"*"` to avoid spawning for irrelevant events
4. **Validate inputs** — never trust data without checking JSON structure
5. **Make scripts executable** — `chmod +x .gemini/hooks/*.sh`
6. **Test independently** — `cat test-input.json | .gemini/hooks/my-hook.sh`
7. **Use `/hooks panel`** — check execution status and debug in the CLI
8. **Log to files** — write debug info to `.gemini/hooks/debug.log`

## Packaging as Extension

Place hooks in `<extension>/hooks/hooks.json` (NOT in `gemini-extension.json`):

```json
{
  "BeforeTool": [
    {
      "matcher": "write_file",
      "hooks": [
        {
          "name": "security",
          "type": "command",
          "command": "${extensionPath}/hooks/security.sh"
        }
      ]
    }
  ]
}
```
