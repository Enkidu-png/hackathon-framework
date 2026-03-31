---
name: hackathon-step3
description: Distribute modules among vibe coders. Asks who takes what, creates assignment tracking doc, and sets up each coder's context so Claude knows exactly what they need to build.
---

# /hackathon:step3 — Distribute Work

## Prerequisites

- `.hackathon/architecture.json` must exist (created by `/hackathon:step2`)
- If it doesn't exist, tell the user to run `/hackathon:step2` first

## Process

### 1. Load Context

Read from hackathon-brain MCP:
- `get_architecture` — get all modules
- `get_progress` — get team members
- Read `.hackathon/state.json` for vibe coder count and team list

### 2. Present Modules

Show the user all modules with their complexity and dependencies:

```
Modules to assign:

1. auth (complex) — Authentication, authorization, user management
   Dependencies: none

2. dashboard (medium) — Main UI, data display, navigation
   Dependencies: auth, api

3. api (medium) — Backend endpoints, data processing
   Dependencies: auth

4. integrations (simple) — Third-party service connections
   Dependencies: api

Team: Jan, Mikolaj (2 vibe coders)
```

### 3. Ask for Assignments

Ask the user to assign modules to coders. One coder can take multiple modules.

Use AskUserQuestion or direct conversation:
- "Who takes the auth module?"
- "Who takes the dashboard?"
- etc.

If there are more modules than coders, suggest groupings based on dependencies (modules that depend on each other are easier for one person to handle).

### 4. Create Assignment Tracking Doc

Write `ASSIGNMENTS.md` at repo root — this is THE reference doc for who does what:

```markdown
# Work Assignments

## Team
| Coder | Modules | Status |
|-------|---------|--------|
| Jan | auth, api | Not started |
| Mikolaj | dashboard, integrations | Not started |

## Module Details

### auth (Jan)
- **What to build:** <from architecture.json>
- **Key files:** <directory from module spec>
- **Interfaces to implement:** <provides from module spec>
- **Dependencies:** <consumes from module spec>
- **Acceptance criteria:**
  - [ ] <derived from app-spec features>
  - [ ] <derived from app-spec features>
  - [ ] Shared interfaces match contract

### dashboard (Mikolaj)
- **What to build:** <from architecture.json>
- **Key files:** <directory>
- **Interfaces to implement:** <provides>
- **Dependencies:** <consumes>
- **Acceptance criteria:**
  - [ ] ...
  - [ ] ...

... (repeat for each module)

## Shared Contracts
- Shared types: `shared/types/`
- Do NOT modify shared types without both coders agreeing
- If you need a new shared type, add it and notify the other coder

## How to Start
1. `git checkout -b module/<your-first-module>` (create your branch)
2. Read your module spec: `.hackathon/modules/<name>.json`
3. Read research: `.hackathon/research/<name>.md`
4. Build against the interfaces defined in architecture
5. Say "commit" when you want to save approved work
```

### 5. Update Module State Files

For each module, update `.hackathon/modules/<name>.json` to add the owner:

```json
{
  "owner": "<coder-name>",
  "status": "assigned",
  ...existing fields...
}
```

### 6. Update Architecture State

Update `.hackathon/architecture.json` — add owner to each module entry.

### 7. Update State

Update `.hackathon/state.json`:
- Set `current_phase` to `"build"`
- Set `assignments` field:
```json
{
  "assignments": {
    "Jan": ["auth", "api"],
    "Mikolaj": ["dashboard", "integrations"]
  }
}
```

### 8. Create Per-Coder Context Files

For each coder, create `.hackathon/coder/<name>.md` — a focused brief that Claude reads when that coder starts working:

```markdown
# <Name>'s Build Brief

## Your Modules
- **auth** — Authentication and authorization
- **api** — Backend endpoints

## What You Need to Build

### auth
<full module spec, interfaces, acceptance criteria>

### api
<full module spec, interfaces, acceptance criteria>

## What Your Teammate Is Building
- Mikolaj: dashboard, integrations
- Their modules depend on your auth module's interfaces
- Prioritize implementing the interfaces they need first

## Key Interfaces You Must Implement
<list of provides from your modules that other modules consume>

## Key Interfaces You Depend On
<list of consumes from your modules — these may not exist yet, use mocks>

## Getting Started
1. git checkout -b module/auth
2. Build auth first (dashboard and api depend on it)
3. Implement shared interfaces early so Mikolaj isn't blocked
4. Say "commit" to save approved work
```

### 9. Commit and Push

```bash
git add -A
git commit -m "feat: work distributed — assignments and coder briefs created"
git push
```

### 10. Output

```
Work distributed!

Assignments:
- Jan: auth, api
- Mikolaj: dashboard, integrations

Created:
- ASSIGNMENTS.md — master tracking doc (check this for who does what)
- .hackathon/coder/Jan.md — Jan's build brief
- .hackathon/coder/Mikolaj.md — Mikolaj's build brief

Each coder: read your brief at .hackathon/coder/<your-name>.md
Then: git checkout -b module/<your-first-module> and start building!
```
