# SCRUM-SUBAGENTS: Mô hình Đội ngũ Agentic SE (3 Man-Month)

Tài liệu này định nghĩa cấu trúc, vai trò và quy trình phối hợp cho một đội ngũ SubAgents phát triển phần mềm theo Agile/Scrum.

---

## 1. Cấu trúc Team

Mô hình **Human-in-the-Loop (HITL)**: User là Orchestrator/SM điều phối, Agents là chuyên gia thực thi.

```mermaid
graph TD
    User((USER / ORCHESTRATOR\nScrum Master))

    subgraph "Core Agent Team"
        direction TB
        PO["PO Agent<br>(Product Owner)"]:::management
        SA["SA Agent<br>(Solutions Architect)"]:::technical
        Dev["Dev Agent<br>(Developer)"]:::execution
        QA["QA Agent<br>(Quality Assurance)"]:::quality
    end

    User <-->|"Phase 1: Kickoff"| PO
    User <-->|"Phase 2: Analyze"| SA
    User <-->|"Phase 3: Implement"| Dev
    User <-->|"Phase 3: Implement"| QA

    PO -->|User Stories + AC| SA
    SA -->|Tech Specs| Dev
    Dev -->|Code| QA
    QA -->|Bug Reports| Dev

    classDef management fill:#ff9999,stroke:#333,stroke-width:2px;
    classDef technical fill:#99ccff,stroke:#333,stroke-width:2px;
    classDef execution fill:#99ff99,stroke:#333,stroke-width:2px;
    classDef quality fill:#ffff99,stroke:#333,stroke-width:2px;
    style User fill:#ffffff,stroke:#333,stroke-width:4px,stroke-dasharray: 5 5;
```

### Vai trò

| Agent    | Vai trò            | Nhiệm vụ chính                                                  |
| :------- | :----------------- | :-------------------------------------------------------------- |
| **User** | Orchestrator / SM  | Ra quyết định, điều phối, review, merge, tạo Issues từ Handoff  |
| **PO**   | Product Owner      | Phân tích ý tưởng → User Stories + AC, quản lý Backlog          |
| **SA**   | Solution Architect | Thiết kế kiến trúc, tech stack, API/DB, tạo Implementation Plan |
| **Dev**  | Developer          | Viết code + unit tests, fix bugs, refactor                      |
| **QA**   | Quality Assurance  | Viết test cases, chạy tests, báo cáo bugs                       |

---

## 2. Quy trình Phát triển — 3 Phase

```mermaid
flowchart LR
    subgraph P1["Phase 1: KICKOFF"]
        K["PO phân tích ý tưởng<br>→ VISION.md<br>→ PRODUCT_BACKLOG.md"]
    end

    subgraph P2["Phase 2: ANALYZE"]
        A["SA thiết kế<br>→ ARCHITECTURE.md<br>→ IMPLEMENTATION_PLAN.md"]
    end

    subgraph P3["Phase 3: IMPLEMENT"]
        direction TB
        S1["Sprint Planning"]
        S2["Dev: Code + Tests"]
        S3["QA: Test + Bugs"]
        S4["Dev: Fix Bugs"]
        S1 --> S2 --> S3 --> S4
        S4 -.->|"Sprint tiếp"| S1
    end

    P1 -->|"User approve"| P2
    P2 -->|"User approve"| P3

    style P1 fill:#ffe6e6,stroke:#cc0000
    style P2 fill:#e6f0ff,stroke:#0066cc
    style P3 fill:#e6ffe6,stroke:#009900
```

| Phase        | Command                   | Agent    | Output                                       |
| :----------- | :------------------------ | :------- | :------------------------------------------- |
| 1. Kickoff   | `/team:kickoff <ý tưởng>` | PO       | `VISION.md` + `PRODUCT_BACKLOG.md`           |
| 2. Analyze   | `/team:analyze`           | SA       | `ARCHITECTURE.md` + `IMPLEMENTATION_PLAN.md` |
| 3. Implement | `/team:implement <task>`  | Dev + QA | Code + Tests + `HANDOFF.md`                  |

---

## 3. Handoff Protocol

Mọi agent có **max 15 turns**. Khi kết thúc phiên (dù xong hay chưa), agent **BẮT BUỘC** viết `docs/HANDOFF.md`:

```markdown
# Handoff Report — [Ngày]

## ✅ Đã hoàn thành

## 🔄 Đang dở (chưa xong)

## 📋 Issues cần tạo (cho Sprint sau)

## 🎯 Đề xuất bước tiếp

## 📝 Bài học rút ra (Retrospective)
```

### Orchestrator xử lý Handoff:

1. Đọc `docs/HANDOFF.md`
2. Mục "🔄 Đang dở" + "📋 Issues" → **Tạo Issue, bỏ vào `PRODUCT_BACKLOG.md`**
3. Gọi `/team:implement` tiếp với task cụ thể từ Issues

> Handoff thay thế Daily Standup — agents tự ghi lại kinh nghiệm và trạng thái, Orchestrator đọc và quyết định.

---

## 4. Quy trình Phối hợp

```mermaid
sequenceDiagram
    autonumber
    participant O as Orchestrator (User)
    participant PO as PO Agent
    participant SA as SA Agent
    participant Dev as Dev Agent
    participant QA as QA Agent

    Note over O, QA: Phase 1 — KICKOFF
    O->>PO: /team:kickoff <ý tưởng>
    PO->>PO: Phân tích → Stories + AC
    PO->>O: VISION.md + BACKLOG.md + HANDOFF.md
    O->>O: Review & Approve

    Note over O, QA: Phase 2 — ANALYZE
    O->>SA: /team:analyze
    SA->>SA: Thiết kế Architecture + Plan
    SA->>O: ARCHITECTURE.md + PLAN.md + HANDOFF.md
    O->>O: Review & Approve

    Note over O, QA: Phase 3 — IMPLEMENT (lặp)
    loop Mỗi Sprint
        O->>Dev: /team:implement <task>
        Dev->>Dev: Sprint Planning + Code + Tests
        Dev->>QA: Handoff code
        QA->>QA: Test + Bug reports
        alt Có bugs
            QA->>Dev: Bug Report
            Dev->>Dev: Fix
        end
        Dev->>O: HANDOFF.md
        O->>O: Đọc Handoff → Tạo Issues → Backlog
    end
```

### Quy tắc:

1. **Phase Gate**: Không nhảy phase. Phải User approve mới sang phase tiếp.
2. **Single Source of Truth**: Mọi thông tin phải ghi vào `docs/`.
3. **Mandatory Handoff**: Agent kết thúc mà không viết Handoff = vi phạm quy trình.
4. **Issues from Handoff**: Orchestrator tạo Issues từ mục "Đang dở" của Handoff, bỏ vào Backlog.

---

_Docs version: 5.0 (Simplified 3-Command Workflow) - Generated by Antigravity_
