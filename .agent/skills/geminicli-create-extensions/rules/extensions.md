# Full Extension Creation Rules

## What is an Extension?

A packaged bundle that can contain **all** extension types: MCP servers, custom commands, hooks, agent skills, sub-agents, and context files. Extensions are installable, shareable, and version-controlled.

## Directory Structure

```
my-extension/
├── gemini-extension.json   (Required) Manifest
├── package.json            (Required for Node.js MCP servers)
├── GEMINI.md               (Optional) Persistent context for model
├── src/                    (Optional) TypeScript source
│   └── index.ts
├── dist/                   (Optional) Built output
├── commands/               (Optional) Custom commands
│   └── deploy.toml
├── hooks/                  (Optional) Hooks
│   └── hooks.json          ← NOT in gemini-extension.json!
├── skills/                 (Optional) Agent skills
│   └── security-audit/
│       └── SKILL.md
└── agents/                 (Optional) Sub-agents
    └── security-auditor.md
```

## gemini-extension.json (Manifest)

```json
{
  "name": "my-extension",
  "version": "1.0.0",
  "description": "Short description for the gallery",
  "contextFileName": "GEMINI.md",
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["${extensionPath}${/}dist${/}server.js"],
      "cwd": "${extensionPath}"
    }
  },
  "excludeTools": ["run_shell_command(rm -rf)"],
  "settings": [
    {
      "name": "API Key",
      "description": "Your API key for the service.",
      "envVar": "MY_API_KEY",
      "sensitive": true
    }
  ]
}
```

### Manifest Fields

| Field             | Type   | Required | Description                                                                   |
| :---------------- | :----- | :------- | :---------------------------------------------------------------------------- |
| `name`            | string | **Yes**  | Unique ID. Lowercase, numbers, dashes only. Must match directory name         |
| `version`         | string | **Yes**  | Semantic version                                                              |
| `description`     | string | No       | Shown in extension gallery                                                    |
| `mcpServers`      | object | No       | Map of server name → server config                                            |
| `contextFileName` | string | No       | Context file to load. Defaults to `GEMINI.md` if present                      |
| `excludeTools`    | array  | No       | Tool names to block. Supports command-specific: `"run_shell_command(rm -rf)"` |
| `settings`        | array  | No       | User-configurable settings (stored in `.env` or keychain)                     |

### Variables

| Variable                     | Description                                  |
| :--------------------------- | :------------------------------------------- |
| `${extensionPath}`           | Absolute path to extension install directory |
| `${workspacePath}`           | Absolute path to current workspace           |
| `${/}` or `${pathSeparator}` | OS-specific path separator                   |

## MCP Server Template

```javascript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const server = new McpServer({
  name: "my-server",
  version: "1.0.0",
});

server.registerTool(
  "my_tool",
  {
    description: "What this tool does.",
    inputSchema: z.object({
      query: z.string().describe("The search query"),
    }).shape,
  },
  async ({ query }) => {
    const result = await doSomething(query);
    return {
      content: [{ type: "text", text: JSON.stringify(result) }],
    };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

## Hooks in Extensions

Hooks are defined in `hooks/hooks.json` (NOT in `gemini-extension.json`):

```json
{
  "BeforeTool": [
    {
      "matcher": "write_file",
      "hooks": [
        {
          "name": "validate",
          "type": "command",
          "command": "${extensionPath}${/}hooks${/}validate.sh"
        }
      ]
    }
  ]
}
```

## Commands in Extensions

Place TOML files in `commands/` subdirectory (same format as standalone commands):

```
commands/
├── deploy.toml        → /deploy (or /ext-name.deploy if conflict)
└── gcs/
    └── sync.toml      → /gcs:sync
```

**Conflict resolution:** Extension commands have lowest precedence:

1. No conflict → natural name (`/deploy`)
2. With conflict → prefixed name (`/my-ext.deploy`)

## Development Workflow

```bash
# 1. Create from template
gemini extensions new my-extension mcp-server

# 2. Install dependencies
cd my-extension && npm install

# 3. Link for live development
gemini extensions link .

# 4. Test (restart CLI after changes)
# 5. Unlink when done: gemini extensions uninstall my-extension
```

## Releasing

### Via Git Repository (Simple)

```bash
# Users install with:
gemini extensions install https://github.com/user/my-extension
# Or specific ref:
gemini extensions install https://github.com/user/my-extension --ref stable
```

### Via GitHub Releases (Efficient)

Archive naming: `{platform}.{arch}.{name}.{ext}`

- `darwin.arm64.my-ext.tar.gz`
- `linux.x64.my-ext.tar.gz`
- `win32.my-ext.zip`

Archive must contain `gemini-extension.json` at root.

## Best Practices

1. **Use TypeScript** — for type safety and better tooling
2. **Separate src/ and dist/** — keep source separate from build
3. **Bundle dependencies** — use esbuild/webpack for fewer install issues
4. **Validate all inputs** — MCP servers run on user's machine
5. **Use `sensitive: true`** — for API keys (stored in keychain)
6. **Follow semver** — Major (breaking), Minor (features), Patch (fixes)
7. **Keep GEMINI.md focused** — goals + tool usage, not full docs
8. **Never hardcode paths** — always use `${extensionPath}`

## Management Commands

```bash
gemini extensions list              # List installed
gemini extensions install <source>  # Install from URL or path
gemini extensions update <name>     # Update specific extension
gemini extensions update --all      # Update all
gemini extensions disable <name>    # Disable
gemini extensions enable <name>     # Enable
gemini extensions uninstall <name>  # Remove
gemini extensions link <path>       # Symlink for dev
gemini extensions config <name>     # Update settings
```
