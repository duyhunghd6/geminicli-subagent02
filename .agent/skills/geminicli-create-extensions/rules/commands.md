# Custom Command Creation Rules

## File Format

TOML (`.toml`) with `prompt` field (required) and `description` field (optional).

## Placement

| Scope            | Location                            | Precedence |
| :--------------- | :---------------------------------- | :--------- |
| Project (shared) | `<project>/.gemini/commands/*.toml` | Highest    |
| User (global)    | `~/.gemini/commands/*.toml`         | Lower      |
| Extension        | `<extension>/commands/*.toml`       | Lowest     |

Project commands override user commands with the same name.

## Namespacing

Subdirectories create namespaced commands via colon separator:

| File Path                     | Command Name     |
| :---------------------------- | :--------------- |
| `commands/test.toml`          | `/test`          |
| `commands/git/commit.toml`    | `/git:commit`    |
| `commands/refactor/pure.toml` | `/refactor:pure` |

## Required Fields

```toml
prompt = "Your prompt text here"
```

## Optional Fields

```toml
description = "Brief one-line description shown in /help"
```

## Argument Handling

### 1. `{{args}}` Placeholder (Context-aware)

When `{{args}}` is present in the prompt, it is replaced with user input.

**Outside shell blocks** — raw injection:

```toml
prompt = "Fix the issue: {{args}}"
# /fix "Button broken" → "Fix the issue: Button broken"
```

**Inside `!{...}` blocks** — auto shell-escaped:

```toml
prompt = """
Results for `{{args}}`:
!{grep -r {{args}} .}
"""
# {{args}} inside !{} is auto-escaped for security
```

### 2. Default Handling (No `{{args}}`)

If `{{args}}` is absent:

- With args: CLI appends full command text after two newlines
- Without args: prompt sent as-is

### 3. Shell Injection `!{...}`

Execute shell commands and inject output into the prompt:

````toml
prompt = """
Generate a commit message for:
```diff
!{git diff --staged}
````

"""

````

**Rules:**
- Braces inside `!{...}` must be balanced
- CLI prompts for confirmation before executing
- Failed commands inject stderr + exit code into prompt

### 4. File Content Injection `@{...}`

Embed file or directory contents:

```toml
prompt = """
Review {{args}} using these guidelines:
@{docs/best-practices.md}
"""
````

**Rules:**

- Supports multimodal (images, PDFs, audio, video)
- Directory paths traverse all files (respects `.gitignore`)
- Processed BEFORE `!{...}` and `{{args}}`
- Paths are workspace-aware

## Templates

### Simple Prompt Command

```toml
description = "Explains the current code."
prompt = "Explain the code I've provided in the current context."
```

### Command with Shell Injection

````toml
description = "Generates a Git commit message from staged changes."
prompt = """
Generate a Conventional Commit message for:
```diff
!{git diff --staged}
```
"""
````

### Command with Args + File Injection

```toml
description = "Reviews code using project best practices."
prompt = """
You are an expert code reviewer.
Review {{args}} using these best practices:
@{docs/best-practices.md}
"""
```

### Command with Complex Default Args

```toml
description = "Adds an entry to CHANGELOG.md."
prompt = """
# Task: Update Changelog
Parse <version>, <type>, and <message> from the user's command.
Format: /changelog <version> <type> <message>
Types: "added", "changed", "fixed", "removed"
Adhere to "Keep a Changelog" format.
"""
```

## When NOT to Use Commands

- **Model-initiated actions** — Use a SubAgent or skill
- **Lifecycle interception** — Use hooks
- **Distributable tooling** — Use an extension with MCP server
