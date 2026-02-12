---
name: gemini-create-extensions
description: >
  Expert skill for creating Gemini CLI extensions. Use when the user asks to
  create, scaffold, or build any of: SubAgents, custom commands, hooks,
  agent skills, or full extensions (packaged bundles with MCP servers).
  Also use when the user asks "how do I extend Gemini CLI?" or wants to
  automate workflows, add tools, or customize CLI behavior.
---

# Gemini CLI Extension Creator

You are an expert at creating Gemini CLI extensions. This skill covers all 5 extension types.

## Decision Matrix: When to Use What

| Type               | What It Is                                                  | When to Use                                                        | Invoked By |
| :----------------- | :---------------------------------------------------------- | :----------------------------------------------------------------- | :--------- |
| **SubAgent**       | Specialist agent with own context & tools                   | Complex tasks needing focused expertise (security audit, git ops)  | Model      |
| **Custom Command** | Slash-command shortcut (`/my-cmd`)                          | Repetitive prompts, automation, shell+prompt combos                | User       |
| **Hook**           | Script at lifecycle event (before/after tool, model, agent) | Validate actions, inject context, enforce policies, log activity   | CLI        |
| **Agent Skill**    | On-demand instructions + resources                          | Occasional complex workflows (PR review, deployment)               | Model      |
| **Extension**      | Packaged bundle of all above + MCP server                   | Distributable packages with tools, commands, hooks, skills, agents | All        |

## Workflow

When the user asks to create an extension, follow this workflow:

### 1. Clarify

- Which extension type(s) does the user need?
- Project-level (`.gemini/`) or user-level (`~/.gemini/`)?
- What specific behavior/automation is needed?

### 2. Scaffold

- Create the directory structure
- Use the correct file format for the type

### 3. Write

- Follow the rules in `rules/*.md` for the chosen type
- Use templates as starting points, customize for the user's needs

### 4. Verify

- Validate file formats (YAML frontmatter, TOML syntax, JSON schemas)
- Check file permissions for hook scripts (`chmod +x`)
- Ensure `settings.json` is updated if hooks are involved

### 5. Activate

- For commands/hooks/agents: restart Gemini CLI session
- For extensions: `gemini extensions link .` (dev) or `gemini extensions install` (release)
- For skills: `/skills reload` or restart session

## Rules Reference

Read the appropriate rule file before creating each type:

| Type           | Rule File             | Key File Format                               |
| :------------- | :-------------------- | :-------------------------------------------- |
| SubAgent       | `rules/subagents.md`  | `.md` with YAML frontmatter                   |
| Custom Command | `rules/commands.md`   | `.toml` with `prompt` field                   |
| Hook           | `rules/hooks.md`      | Script (`.sh`/`.js`) + `settings.json` config |
| Agent Skill    | `rules/skills.md`     | `SKILL.md` with YAML frontmatter              |
| Extension      | `rules/extensions.md` | `gemini-extension.json` manifest              |

## Examples

Ready-to-use examples are in the `examples/` directory. Copy and modify them.

## Critical Rules

1. **Never guess file formats** — always read the specific rule file first
2. **Hooks: stdout = JSON ONLY** — use stderr for all logging/debugging
3. **SubAgents run in YOLO mode** — they execute tools without confirmation, be careful with tool restrictions
4. **Commands support shell injection** — `{{args}}` inside `!{...}` is auto-escaped for security
5. **Extensions use `${extensionPath}`** — never hardcode absolute paths in `gemini-extension.json`
