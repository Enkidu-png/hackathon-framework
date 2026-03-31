---
name: init-hackathon
description: Initialize a new hackathon project or join an existing one. Use '/init_hackathon create' to lead a new hackathon or '/init_hackathon join <repo-url>' to join a team.
---

# /init_hackathon

This skill sets up a complete hackathon environment. Two modes: **create** (leader) and **join** (team member).

## Detect Mode

Parse the user's input:
- If they said `create` or no argument: run **Create Flow**
- If they said `join <url>`: run **Join Flow** with the provided repo URL

---

## Create Flow (Leader)

### Step 1: Gather Info

Ask the user these questions (use AskUserQuestion or direct conversation):

1. **Hackathon name** — short, no spaces, used as repo name (e.g., `smart-receipts`)
2. **Your name** — the leader's name for progress tracking
3. **Target directory** — where to create the project (default: current directory)
4. **GitHub org or username** — where to create the private repo
5. **Team members' GitHub usernames** — comma-separated list of all teammates
6. **Number of vibe coders** — how many people will be coding (may differ from team size)
7. **Supabase Access Token** — shared token for the team (or skip if not using Supabase)
8. **Supabase Project Ref** — the project reference ID (or skip)
9. **Vercel Token** — shared Vercel token (or skip if not using Vercel)

### Step 2: Create Project Directory

```bash
mkdir -p <target-dir>/<hackathon-name>
cd <target-dir>/<hackathon-name>
git init
```

### Step 3: Scaffold Repo Structure

Copy templates from `${CLAUDE_PLUGIN_ROOT}/templates/` into the new repo. For each template file, replace placeholders with actual values:

1. **`.hackathon/brain/`** — Copy `hackathon-brain/server.js` and `hackathon-brain/package.json`
2. **`.hackathon/progress/`** — Create empty directory
3. **`.hackathon/modules/`** — Create empty directory
4. **`.hackathon/research/`** — Create empty directory
5. **`.hackathon/overnight/`** — Create empty directory
6. **`.mcp.json`** — Copy from `mcp.json.template`
7. **`.claude/settings.json`** — Copy from `settings.json.template`
8. **`CLAUDE.md`** — Copy from `CLAUDE.md.template`, replace:
   - `{{HACKATHON_NAME}}` with hackathon name
   - `{{LEADER_NAME}}` with leader name
   - `{{VIBE_CODER_COUNT}}` with number
   - `{{REPO_URL}}` with the GitHub URL (fill after repo creation)
9. **`.env`** — Copy from `dotenv.template`, replace:
   - `{{SUPABASE_TOKEN}}` with provided token (or leave empty)
   - `{{SUPABASE_REF}}` with provided ref (or leave empty)
   - `{{VERCEL_TOKEN}}` with provided token (or leave empty)
10. **`.gitignore`** — Copy from `gitignore.template`

Create initial state file `.hackathon/state.json`:
```json
{
  "hackathon_name": "<name>",
  "created_at": "<ISO timestamp>",
  "current_phase": "init",
  "vibe_coder_count": <number>,
  "team": ["<leader-name>"],
  "leader": "<leader-name>",
  "repo_url": "",
  "modules": []
}
```

Create leader's progress file `.hackathon/progress/<leader-name>.json`:
```json
{
  "member": "<leader-name>",
  "status": "idle",
  "working_on": "Setting up hackathon",
  "completed": ["Project initialized"],
  "blockers": [],
  "last_updated": "<ISO timestamp>"
}
```

### Step 4: Install MCP Server Dependencies

```bash
cd .hackathon/brain && npm install
cd ../..
```

### Step 5: Initial Commit

```bash
git add -A
git commit -m "feat: initialize hackathon project"
```

### Step 6: Create GitHub Repo and Push

```bash
gh repo create <org>/<hackathon-name> --private --source=. --push
```

Update `.hackathon/state.json` with the repo URL.
Update `CLAUDE.md` with the repo URL.

```bash
git add -A && git commit -m "chore: add repo URL" && git push
```

### Step 7: Add Collaborators

For each GitHub username provided:
```bash
gh api repos/<org>/<hackathon-name>/collaborators/<username> -X PUT -f permission=push
```

### Step 8: Install Mandatory Plugins

Check if each plugin is already installed (skip if so):
```bash
claude plugin install claude-mem@thedotmack
claude plugin install context7@claude-plugins-official
claude plugin install supabase@claude-plugins-official
claude plugin install vercel@claude-plugins-official
claude plugin install github@claude-plugins-official
```

Install Codex plugin (requires restart before setup):
```bash
claude /plugin marketplace add openai/codex-plugin-cc
claude /plugin install codex@openai-codex
```

Also ensure Playwright is available:
```bash
npx playwright install chromium
```

### Step 9: Output (Pre-Restart)

**IMPORTANT:** After installing the codex plugin, Claude Code must restart for `/codex` commands to appear. Tell the user:

```
=== Hackathon Created! ===

Repo: https://github.com/<org>/<hackathon-name>

Share this with your team:
  /init_hackathon join https://github.com/<org>/<hackathon-name>

⚠ RESTART REQUIRED: Claude Code must restart for the Codex plugin to activate.
After restart, run:  /codex:setup
Then run:            /hackathon:step1
```

Open in VSCode:
```bash
code <target-dir>/<hackathon-name>
```

**Note for all skills:** If `/codex:setup` has not been run yet (check by trying a codex command), remind the user to run it first.

---

## Join Flow (Team Member)

Input: `/init_hackathon join <repo-url>`

### Step 1: Gather Info

Ask the user:
1. **Your name** — for progress tracking
2. **Target directory** — where to clone (default: current directory)

### Step 2: Clone

```bash
git clone <repo-url> <target-dir>/<repo-name>
cd <target-dir>/<repo-name>
```

### Step 3: Install MCP Server Dependencies

```bash
cd .hackathon/brain && npm install
cd ../..
```

### Step 4: Register as Team Member

Create `.hackathon/progress/<name>.json`:
```json
{
  "member": "<name>",
  "status": "idle",
  "working_on": "Just joined",
  "completed": [],
  "blockers": [],
  "last_updated": "<ISO timestamp>"
}
```

Read `.hackathon/state.json`, add name to the `team` array, write back.

```bash
git add -A
git commit -m "feat: <name> joined the hackathon"
git push
```

### Step 5: Install Mandatory Plugins

Check and install:
```bash
claude plugin install claude-mem@thedotmack
claude plugin install context7@claude-plugins-official
claude plugin install supabase@claude-plugins-official
claude plugin install vercel@claude-plugins-official
claude plugin install github@claude-plugins-official
```

Install Codex (requires restart before setup):
```bash
claude /plugin marketplace add openai/codex-plugin-cc
claude /plugin install codex@openai-codex
```

Playwright:
```bash
npx playwright install chromium
```

### Step 6: Output

```
=== Welcome to <hackathon-name>! ===

You're registered as: <name>
Team: <list of members from state.json>
Current phase: <current_phase from state.json>

⚠ RESTART REQUIRED: Claude Code must restart for Codex + MCP brain to activate.
After restart, run:  /codex:setup
Then follow team lead's instructions or run the current phase skill.
```

Open in VSCode:
```bash
code <target-dir>/<repo-name>
```
