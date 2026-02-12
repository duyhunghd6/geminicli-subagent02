# Agent Skill Creation Rules

## What is a Skill?

On-demand expertise loaded only when needed. Unlike `GEMINI.md` (always loaded), skills are activated by the model when it identifies a matching task — saving context tokens.

## File Format

A directory containing `SKILL.md` with YAML frontmatter + markdown body.

## Required Structure

```
my-skill/
├── SKILL.md        (Required) Instructions and metadata
├── scripts/        (Optional) Executable scripts
├── references/     (Optional) Static documentation
└── assets/         (Optional) Templates and other resources
```

## SKILL.md Format

```markdown
---
name: my-skill
description: >
  Clear description of what this skill does and when to use it.
  Include trigger phrases like "audit security" or "create PR".
---

# Skill Title

Instructions that guide the agent when this skill is active.

## Workflow

### 1. Step One

- Details...

### 2. Step Two

- Details...
```

### Frontmatter Fields

| Field         | Type   | Required | Description                               |
| :------------ | :----- | :------- | :---------------------------------------- |
| `name`        | string | **Yes**  | Unique ID. Should match directory name    |
| `description` | string | **Yes**  | When to activate. Include trigger phrases |

## Placement (Discovery Tiers)

| Tier      | Location                                   | Precedence |
| :-------- | :----------------------------------------- | :--------- |
| Workspace | `.gemini/skills/<skill-name>/SKILL.md`     | Highest    |
| User      | `~/.gemini/skills/<skill-name>/SKILL.md`   | Middle     |
| Extension | `<extension>/skills/<skill-name>/SKILL.md` | Lowest     |

Same-name skills: higher precedence overrides lower.

## How It Works

1. **Discovery** — CLI scans all tiers at session start, injects name+description into system prompt
2. **Activation** — Model calls `activate_skill` when task matches description
3. **Consent** — User sees confirmation prompt with skill name and purpose
4. **Injection** — SKILL.md body + folder structure added to conversation
5. **Execution** — Model follows skill instructions with access to bundled assets

## Management Commands

### Interactive Session

```
/skills list                        # Show all skills
/skills link <path>                 # Link from local dir
/skills disable <name>              # Prevent usage
/skills enable <name>               # Re-enable
/skills reload                      # Refresh discovery
```

### Terminal

```bash
gemini skills list                  # List all
gemini skills link <path>           # Link via symlink
gemini skills install <source>      # From git, local, or .skill file
gemini skills install <repo> --path skills/my-skill  # Subdirectory
gemini skills uninstall <name>      # Remove
gemini skills enable <name>         # Enable
gemini skills disable <name>        # Disable
```

## Template

```markdown
---
name: code-reviewer
description: >
  Use this skill to review code. It supports both local changes
  and remote Pull Requests. Activate when user asks to "review",
  "audit code", or "check my changes".
---

# Code Reviewer

This skill guides thorough code reviews.

## Workflow

### 1. Determine Review Target

- **Remote PR**: If user provides PR number/URL, target remote PR
- **Local Changes**: If changes are local, use git diff

### 2. Analyze Changes

- Check for bugs, security issues, and style violations
- Reference project standards in `references/` if available

### 3. Report

- Summarize findings with severity levels
- Suggest specific improvements with code examples
```

## Built-in Skill

- `skill-creator` — Creates new skills. Invoke with "create a new skill called ..."

## Best Practices

1. **Write clear descriptions** — include trigger phrases the model will match
2. **Keep SKILL.md instructions procedural** — numbered workflows work best
3. **Bundle supporting files** — scripts, templates, reference docs in subdirectories
4. **Name matches directory** — `name` in frontmatter should match directory name
5. **Progressive disclosure** — only metadata loaded initially, full content on activation

## When NOT to Use Skills

- **Persistent context** — Use `GEMINI.md` (always loaded)
- **User-invoked shortcuts** — Use custom commands
- **Lifecycle interception** — Use hooks
- **Distributable packages** — Use extensions
