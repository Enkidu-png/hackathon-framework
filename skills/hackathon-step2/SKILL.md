---
name: hackathon-step2
description: Decompose app spec into modules via architect agent, then spawn parallel research agents (one per module) using context7 and agent-browser to research tech stack and patterns.
---

# /hackathon:step2 — Architecture + Parallel Module Research

## Prerequisites

- `.hackathon/app-spec.json` must exist (created by `/hackathon:step1`)
- If it doesn't exist, tell the user to run `/hackathon:step1` first

## Phase A: Architecture Decomposition (Sequential)

### 1. Spawn App Architect Agent

Launch ONE `app-architect` agent with this context:

```
Read the app spec from .hackathon/app-spec.json.

Decompose this application into distinct modules. Each module should:
- Have a clear, single responsibility
- Map to a feature group or technical boundary
- Be independently buildable by one vibe coder

For each module, define:
1. Name (short, lowercase, e.g., "auth", "dashboard", "api")
2. Description — what this module is responsible for
3. Directory — where it lives in the codebase (e.g., "src/features/auth")
4. Interfaces it PROVIDES — functions, API endpoints, components other modules can use
5. Interfaces it CONSUMES — what it needs from other modules
6. Key features from app-spec that belong to this module
7. Data entities this module owns

Also define:
- Shared types that multiple modules need (put in "shared/types/")
- API contracts between modules
- The recommended order to build modules (dependency graph)

Write these files:
- .hackathon/architecture.json — full architecture with module list and interfaces
- .hackathon/modules/<name>.json — one file per module with full spec
- ARCHITECTURE.md — human-readable architecture overview at repo root

The number of modules should be driven by app complexity, NOT by the number of vibe coders.
Typical range: 3-7 modules.
```

### 2. Wait for Architect to Complete

Read the output. Verify:
- `.hackathon/architecture.json` exists and has modules
- Each module has a `.hackathon/modules/<name>.json` file
- `ARCHITECTURE.md` exists

Present the module list to the user for approval:
```
Architecture decomposition complete!

Modules:
1. auth — User authentication and authorization
2. dashboard — Main user interface and data display
3. api — Backend API and data processing
4. integrations — Third-party service connections

Approve this decomposition? (You can suggest changes)
```

If user wants changes, adjust the files accordingly.

## Phase B: Parallel Module Research

### 3. Read Module List

```javascript
// Read architecture.json to get module names
const arch = JSON.parse(read(".hackathon/architecture.json"));
const modules = arch.modules.map(m => m.name);
```

### 4. Spawn N Research Agents in Parallel

**CRITICAL: Launch ALL research agents in a SINGLE message with multiple Agent tool calls.**

For each module in the architecture, spawn one `module-researcher` agent. In a single response, emit N Agent tool calls:

```
// For each module, create one Agent call:
Agent(subagent_type="module-researcher", prompt="
  You are researching the '<MODULE_NAME>' module for a hackathon project.

  ## App Context
  <paste relevant sections from app-spec.json>

  ## Module Spec
  <paste content from .hackathon/modules/<MODULE_NAME>.json>

  ## Architecture Context
  <paste interfaces this module provides and consumes from architecture.json>

  ## Your Task
  Research the best approach to build this module. Use context7 MCP to look up library docs
  and agent-browser for web research. DO NOT use WebSearch or WebFetch directly.

  Research and document:
  1. **Recommended libraries/frameworks** — for each, explain why it fits this module
  2. **Existing implementations** — search GitHub for starter templates, boilerplates, or reference implementations
  3. **API docs** — for any integrations this module needs (auth providers, payment APIs, etc.)
  4. **Common patterns** — how similar modules are typically structured
  5. **Pitfalls** — common mistakes or gotchas to avoid
  6. **Estimated complexity** — simple/medium/complex with reasoning
  7. **Recommended file structure** — directory layout for this module

  Write your findings to: .hackathon/research/<MODULE_NAME>.md

  Format as clear markdown with sections for each of the 7 points above.
  Include code examples where helpful.
  Be specific — name exact package versions, link to docs, show config snippets.
")
```

**All agents run simultaneously.** Each writes to its own file so there are no conflicts.

### 5. Synthesize Results

After ALL research agents complete, read all `.hackathon/research/*.md` files.

Synthesize into a unified tech stack:

1. **Identify shared dependencies** — if multiple modules recommend the same library, confirm it
2. **Resolve conflicts** — if module A recommends Prisma and module B recommends Drizzle, pick one and explain why
3. **Determine overall tech stack**:
   - Frontend framework
   - Backend/API approach
   - Database + ORM
   - Auth solution
   - Hosting/deployment
   - Key shared libraries
   - Testing framework

Write:

**`.hackathon/techstack.json`**:
```json
{
  "frontend": { "framework": "...", "styling": "...", "ui_library": "..." },
  "backend": { "platform": "...", "api_style": "..." },
  "database": { "provider": "...", "orm": "..." },
  "auth": { "provider": "..." },
  "hosting": { "provider": "..." },
  "testing": { "framework": "..." },
  "shared_libraries": ["..."],
  "rationale": "..."
}
```

**Update `CLAUDE.md`** — add Tech Stack section with the decisions.

**Update each `.hackathon/modules/<name>.json`** — add the recommended libraries from research.

### 6. Scaffold Project

Based on tech stack decisions, scaffold the project:

```bash
# Example for Next.js + Supabase
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir
# Install shared dependencies
npm install <shared-libraries>
```

Create the module directory structure:
```bash
mkdir -p src/features/auth src/features/dashboard src/features/api ...
mkdir -p shared/types
```

Create placeholder files for shared types based on architecture contracts.

### 7. Commit and Push

```bash
git add -A
git commit -m "feat: architecture, tech stack, and project scaffold"
git push
```

### 8. Update State

Set `.hackathon/state.json` `current_phase` to `"architecture_complete"`.

### 9. Output

```
Architecture + Research Complete!

Modules: <count>
Tech Stack: <framework> + <backend> + <database>

Research reports: .hackathon/research/
Architecture: ARCHITECTURE.md
Tech stack: .hackathon/techstack.json

Each module has been researched independently with:
- Recommended libraries and versions
- Reference implementations found
- Common patterns and pitfalls documented

Project scaffolded with <framework>.
Module directories created.
Shared types stubbed.

Next: Divide modules among your <N> vibe coders and start building!
```
