---
name: update-hackathon
description: Update any part of the hackathon state — module assignments, tech stack, architecture, app spec, or team rules. Claude figures out what to change based on user input.
---

# /update-hackathon

The user wants to change something about the hackathon. Ask what, then update the right files and push.

## Step 1: Ask What Changed

Ask the user: **"What do you want to update?"**

Let them describe it in natural language. Examples:
- "Jan is taking over the dashboard module from Mikolaj"
- "We're switching from Drizzle to Prisma"
- "Add a new module for notifications"
- "Remove the integrations module, merge it into api"
- "Change the auth approach to Clerk instead of Supabase Auth"
- "Add a new feature: export to PDF"
- "Mikolaj is blocked, reassign his modules"

## Step 2: Read Current State

Call hackathon-brain MCP to get the current state of whatever needs updating:
- Module changes → `get_architecture`, `get_module_context`
- Tech stack changes → `get_techstack`
- Assignment changes → `get_progress`, read `ASSIGNMENTS.md` and `.hackathon/state.json`
- Feature changes → `get_vision`
- Rule changes → `get_constitution`

## Step 3: Determine What Files to Update

Based on the user's request, identify ALL affected files:

| Change Type | Files to Update |
|-------------|----------------|
| **Module reassignment** | `.hackathon/modules/<name>.json` (owner field), `.hackathon/state.json` (assignments), `ASSIGNMENTS.md`, `.hackathon/coder/*.md` (rebuild affected briefs) |
| **New module** | `.hackathon/architecture.json`, new `.hackathon/modules/<name>.json`, `ASSIGNMENTS.md`, `ARCHITECTURE.md` |
| **Remove module** | `.hackathon/architecture.json`, delete `.hackathon/modules/<name>.json`, `ASSIGNMENTS.md`, `ARCHITECTURE.md`, update coder briefs |
| **Tech stack change** | `.hackathon/techstack.json`, `CLAUDE.md` tech stack section, affected `.hackathon/modules/*.json` (update recommended libraries) |
| **Feature change** | `.hackathon/app-spec.json`, `APP-SPEC.md`, possibly `.hackathon/modules/*.json` if features are reassigned |
| **Assignment swap** | `.hackathon/state.json`, `ASSIGNMENTS.md`, `.hackathon/modules/*.json` (owner), `.hackathon/coder/*.md` (rebuild both briefs) |
| **Rule change** | `.hackathon/constitution.json`, `CLAUDE.md` rules section |

## Step 4: Make the Changes

Update all affected files. Be thorough — if you change a module owner, update it everywhere (state.json, architecture.json, modules/<name>.json, ASSIGNMENTS.md, coder briefs).

## Step 5: Create Change Log Entry

Append to `.hackathon/changelog.md` (create if doesn't exist):

```markdown
## <date> <time> — <short description>
**Changed by:** <user name>
**What changed:**
- <bullet point description of each change>
**Files updated:**
- <list of files>
```

## Step 6: Commit and Push

Use the `gh-action` agent pattern — stage only the changed files:

```bash
git add <specific files>
git commit -m "update: <short description of what changed>"
git push
```

## Step 7: Notify

Tell the user:

```
Updated! Changes pushed to GitHub.

What changed:
- <summary of changes>

Files updated:
- <list>

Other team members will get these changes automatically via MCP brain (git pull on read).
```
