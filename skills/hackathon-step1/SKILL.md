---
name: hackathon-step1
description: Transform messy voice transcripts, brainstorm notes, or raw text into a heavily detailed, structured app specification with user flows, screens, data model, and success criteria.
---

# /hackathon:step1 — Transcript to App Spec

## Input

The user will provide one of:
- Raw voice transcript (messy, unstructured)
- Brainstorm notes (bullet points, fragments)
- A file path to read
- A conversation summary

Read whatever they provide. If they paste text directly, use that. If they provide a file path, read the file.

## Process

### 1. Parse and Extract

Go through the raw input line by line. Extract every:
- Feature mention (even implied ones)
- User type or persona reference
- Technical requirement
- Business constraint
- Success metric
- Integration need
- Screen or view description
- Data entity

Be aggressive about extraction. If something is vaguely mentioned, capture it. Better to over-extract and trim later than miss something.

### 2. Ask Clarifying Questions

After first pass, identify gaps. Ask the user about:
- Ambiguous features ("You mentioned 'social features' — do you mean comments, likes, sharing, or all three?")
- Missing flows ("You described the dashboard but not how users get there — is there onboarding?")
- Priority conflicts ("Both real-time sync and offline mode were mentioned — which is MVP?")
- Technical unknowns ("Will this need to handle file uploads? What size/types?")

Ask at most 5-8 targeted questions. Don't over-question — fill in reasonable defaults for minor gaps and note assumptions.

### 3. Structure into App Spec

Create a comprehensive specification with these sections:

#### Problem Statement
What problem does this app solve? Who feels this pain? Why do current solutions fail?

#### Target Users
- Primary persona (name, role, goals, pain points)
- Secondary persona(s) if any
- What they care about most

#### Core Value Proposition
One sentence: "[App name] helps [users] [achieve goal] by [mechanism], unlike [alternatives] which [limitation]."

#### Feature List

Categorize every feature into:

**MVP (Must ship)**
- Feature name: description, acceptance criteria

**Nice-to-have (Ship if time allows)**
- Feature name: description

**Future (Post-hackathon)**
- Feature name: description

#### User Flows

For each key user journey, document:

```
Flow: [Name]
Trigger: [What starts this flow]
Preconditions: [What must be true]
Steps:
  1. User [action] -> System [response]
  2. User [action] -> System [response]
  ...
Success outcome: [What the user achieves]
Error states: [What can go wrong and how to handle]
```

Minimum flows to document:
- User registration / first-time experience
- Core loop (the main thing users do repeatedly)
- Key secondary flow (most important non-core feature)

#### Screens / Views

For each screen:

```
Screen: [Name]
URL/Route: [path]
Purpose: [why this screen exists]
Shows: [what data/content is displayed]
Actions: [what the user can do here]
Navigation: [where can user go from here]
State variations: [empty state, loading, error, populated]
```

#### Data Model

For each entity:

```
Entity: [Name]
Fields:
  - field_name: type (constraints) — description
Relationships:
  - has_many: [other entities]
  - belongs_to: [other entities]
```

#### Integrations

List every external service:
- Service name, what it's used for, which features depend on it
- Auth provider
- Payment provider (if any)
- Third-party APIs

#### Success Criteria

What does "done" look like at the hackathon demo?
- [ ] Criterion 1
- [ ] Criterion 2
- ...

#### Out of Scope

Explicitly list what we are NOT building:
- Feature X (reason)
- Feature Y (reason)

#### Assumptions

List any assumptions made when the transcript was ambiguous:
- "Assumed single-tenant because multi-tenant wasn't mentioned"
- "Assumed email auth only since no SSO was discussed"

### 4. Write Output

Write TWO files:

**`.hackathon/app-spec.json`** — Machine-readable JSON with all sections above as structured data. This is what other skills and MCP tools read.

```json
{
  "problem": "...",
  "target_users": [{ "name": "...", "role": "...", "goals": ["..."], "pain_points": ["..."] }],
  "value_proposition": "...",
  "features": {
    "mvp": [{ "name": "...", "description": "...", "acceptance_criteria": ["..."] }],
    "nice_to_have": [{ "name": "...", "description": "..." }],
    "future": [{ "name": "...", "description": "..." }]
  },
  "user_flows": [{ "name": "...", "trigger": "...", "steps": ["..."], "success": "...", "errors": ["..."] }],
  "screens": [{ "name": "...", "route": "...", "purpose": "...", "shows": ["..."], "actions": ["..."], "navigation": ["..."] }],
  "data_model": [{ "entity": "...", "fields": [{ "name": "...", "type": "...", "description": "..." }], "relationships": {} }],
  "integrations": [{ "service": "...", "purpose": "...", "features": ["..."] }],
  "success_criteria": ["..."],
  "out_of_scope": ["..."],
  "assumptions": ["..."]
}
```

**`APP-SPEC.md`** — Human-readable markdown at repo root. Nicely formatted, easy to scan, includes all sections above with proper headings and formatting.

### 5. Update State

Update `.hackathon/state.json`: set `current_phase` to `"spec_complete"`.

### 6. Commit and Push

```bash
git add -A
git commit -m "feat: app specification from transcript"
git push
```

### 7. Output

Tell the user:
```
App spec created!

- APP-SPEC.md — human-readable spec (read this to review)
- .hackathon/app-spec.json — machine-readable (used by other skills)

Features extracted: X MVP, Y nice-to-have, Z future
User flows documented: N
Screens identified: M

Next: Run /hackathon:step2 to decompose into modules and research tech stack
```
