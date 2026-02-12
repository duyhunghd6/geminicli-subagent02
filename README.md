# 🤖 GeminiCLI SubAgent — Example & Starter Kit

> **Create powerful SubAgents for GeminiCLI and AI Agent ecosystems.**
> This repository provides working examples, patterns, and best practices for building GeminiCLI SubAgents — the building blocks of Agentic Software Engineering.

---

## 🎯 What Is This?

This project demonstrates how to create **GeminiCLI SubAgents** — autonomous, composable units of work that GeminiCLI can orchestrate to solve complex software engineering tasks.

A **SubAgent** is a scoped AI agent that:

- Receives a **clear task description** with all necessary context
- Has access to a **defined set of tools** (browser, terminal, file system, etc.)
- Executes autonomously and **reports results** back to the parent agent
- Can be **composed** with other SubAgents for multi-step workflows

## 🏗️ Repository Structure

```
geminicli-subagent02/
├── README.md                # You are here
├── .gemini/
│   ├── settings.json        # GeminiCLI configuration
│   └── GEMINI.md            # Project context for GeminiCLI
├── subagents/
│   ├── browser-agent/       # Example: Browser automation SubAgent
│   │   ├── SKILL.md         # SubAgent skill definition
│   │   └── examples/        # Usage examples
│   ├── code-reviewer/       # Example: Code review SubAgent
│   │   ├── SKILL.md
│   │   └── examples/
│   └── test-runner/         # Example: Test execution SubAgent
│       ├── SKILL.md
│       └── examples/
├── orchestrator/
│   └── workflow.md          # Multi-agent orchestration patterns
└── docs/
    ├── ARCHITECTURE.md      # SubAgent architecture deep dive
    └── PATTERNS.md          # Common SubAgent design patterns
```

## 🧠 Core Concepts

### 1. SubAgent Anatomy

Every SubAgent follows the **Task → Tools → Report** pattern:

```
┌─────────────────────────────────────────────┐
│              PARENT AGENT                   │
│                                             │
│  ┌─────────┐   ┌─────────┐   ┌──────────┐  │
│  │ Task    │──▶│SubAgent │──▶│ Report   │  │
│  │ Prompt  │   │ Execution│   │ Results  │  │
│  └─────────┘   └────┬────┘   └──────────┘  │
│                     │                       │
│              ┌──────┴──────┐                │
│              │   Tools     │                │
│              │ • Browser   │                │
│              │ • Terminal  │                │
│              │ • File I/O  │                │
│              │ • MCP       │                │
│              └─────────────┘                │
└─────────────────────────────────────────────┘
```

### 2. Key Design Principles

| Principle                 | Description                                                                                    |
| :------------------------ | :--------------------------------------------------------------------------------------------- |
| **Single Responsibility** | Each SubAgent should do one thing well                                                         |
| **Context Completeness**  | Pass ALL necessary context in the task prompt — SubAgents have no memory of prior interactions |
| **Clear Return Contract** | Define exactly what information the SubAgent should return                                     |
| **Tool Minimization**     | Give SubAgents only the tools they need                                                        |
| **Idempotency**           | SubAgents should be safe to retry on failure                                                   |

### 3. SubAgent Types

| Type              | Purpose                                           | Tools               |
| :---------------- | :------------------------------------------------ | :------------------ |
| **Browser Agent** | Web automation, UI testing, data extraction       | Browser tools       |
| **Code Reviewer** | Static analysis, pattern matching, quality checks | File I/O, grep      |
| **Test Runner**   | Execute and validate test suites                  | Terminal, file I/O  |
| **Deployer**      | Build, package, and deploy applications           | Terminal, browser   |
| **Researcher**    | Search web, read docs, gather context             | Browser, web search |

## 🚀 Quick Start

### Creating Your First SubAgent

1. **Define the skill** in a `SKILL.md`:

```yaml
---
name: my-first-subagent
description: A SubAgent that does X when given Y
---
```

2. **Write the task prompt** — be specific and complete:

```
Task: Review the pull request at {url} and check for:
1. Security vulnerabilities in authentication code
2. Missing error handling in API endpoints
3. Hardcoded credentials or secrets

Return a JSON report with:
- severity: critical | warning | info
- file: affected file path
- line: line number
- description: what was found
- suggestion: how to fix it
```

3. **Configure return conditions** — tell the SubAgent when to stop:

```
Stop when:
- All files in the PR have been reviewed, OR
- A critical security issue is found (report immediately)
```

## 🔮 Roadmap: Toward AgenticSE

This project is the **foundation** for a larger vision — **Agentic Software Engineering (AgenticSE)**, where AI agents collaborate as autonomous micro-teams to deliver software.

```
Phase 1: SubAgents (You Are Here) ◀──────────────────┐
  └── Individual task automation                      │
  └── Single-agent patterns                           │
  └── Tool composition                                │
                                                      │
Phase 2: Multi-Agent Orchestration                    │
  └── Agent-to-Agent communication                    │
  └── Workflow DAGs                                   │
  └── Shared context & memory                         │
                                                      │
Phase 3: AgenticSE Micro-Teams                        │
  └── PM Agent → DEV Agent → QA Agent pipeline        │
  └── Autonomous sprint execution                     │
  └── Self-healing CI/CD                              │
  └── Agent Flywheel ecosystem                        │
```

### 🏁 Next Phase: AgenticSE

The next evolution of this project will implement:

- **🧑‍💼 PM Agent** — Breaks down requirements into actionable tasks
- **👨‍💻 DEV Agent** — Implements features using SubAgent patterns from this repo
- **🧪 QA Agent** — Validates code quality, runs tests, reviews architecture
- **🔄 Orchestrator** — Coordinates the micro-team with DAG-based workflows
- **📊 Feedback Loop** — Agents learn from each iteration to improve quality

> **The goal**: A team of AI agents that can autonomously deliver a complete feature — from requirement to production — with human oversight at key decision points.

## 📚 References

- [GeminiCLI Documentation](https://github.com/anthropics/claude-code) — Official GeminiCLI docs
- [Agent Flywheel](https://github.com/anthropics/courses) — Multi-agent orchestration patterns
- [MCP Specification](https://modelcontextprotocol.io/) — Model Context Protocol for tool integration

## 📄 License

MIT License — See [LICENSE](./LICENSE) for details.

---

<p align="center">
  <b>Built with 🤖 GeminiCLI + Antigravity</b><br>
  <i>From SubAgents to AgenticSE — One agent at a time.</i>
</p>
