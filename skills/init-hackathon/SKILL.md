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

### Step 1: Gather Info — USE AskUserQuestion TOOL

**You MUST use the AskUserQuestion tool for gathering info. Do NOT ask questions as plain text chat.**

Use AskUserQuestion with up to 4 questions per call. Split into 2 rounds:

**Round 1** — AskUserQuestion with these 4 questions:
1. "What is the hackathon name?" (header: "Name", options: let user type via Other — no preset options needed, use 2 example options like "smart-receipts", "hack-2026")
2. "What is your name (for progress tracking)?" (header: "Leader", options: 2 example options, user picks or types)
3. "GitHub org or personal account for the repo?" (header: "GitHub", options: user's GitHub username as option 1, "Other org" as option 2)
4. "How many vibe coders (including you)?" (header: "Coders", options: "2", "3", "4", "5+")

**Round 2** — AskUserQuestion:
1. "GitHub usernames of your teammates (comma-separated)?" (header: "Team", options: 2 placeholder options, user types)
2. "Target directory for the project?" (header: "Directory", options: "Current directory (Recommended)", "Desktop", user can type custom)

**Do NOT ask for .env secrets.** The .env file will be created as a template for the user to fill manually.

### Step 2: Create Project Directory

```bash
mkdir -p <target-dir>/<hackathon-name>
cd <target-dir>/<hackathon-name>
git init
```

### Step 3: Scaffold Repo Structure

Copy templates from `${CLAUDE_PLUGIN_ROOT}/templates/` into the new repo. Replace placeholders with actual values:

1. **`.hackathon/brain/`** — Copy `hackathon-brain/server.js` and `hackathon-brain/package.json`
2. **`.hackathon/progress/`** — Create empty directory
3. **`.hackathon/modules/`** — Create empty directory
4. **`.hackathon/research/`** — Create empty directory
5. **`.hackathon/overnight/`** — Create empty directory
6. **`.mcp.json`** — Copy from `mcp.json.template`
7. **`.claude/settings.json`** — Copy from `settings.json.template`
8. **`CLAUDE.md`** — Copy from `CLAUDE.md.template`, replace placeholders
9. **`.env`** — Create from `dotenv.template` but leave values EMPTY as placeholders:
   ```
   # Fill in your credentials — DO NOT share in chat
   SUPABASE_ACCESS_TOKEN=
   SUPABASE_PROJECT_REF=
   VERCEL_TOKEN=
   ```
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

```
=== Hackathon Created! ===

Repo: https://github.com/<org>/<hackathon-name>

Share this with your team:
  /init_hackathon join https://github.com/<org>/<hackathon-name>

IMPORTANT: Fill in your .env file with your credentials before starting.
Open .env and add your Supabase and Vercel tokens.

RESTART REQUIRED: Claude Code must restart for Codex + MCP brain.
After restart, run:  /codex:setup

Brainstorm with your team first. When you have a plan, run /hackathon:step1
```

Open in VSCode:
```bash
code <target-dir>/<hackathon-name>
```

---

## Join Flow (Team Member)

### Step 1: Gather Info — USE AskUserQuestion TOOL

**You MUST use the AskUserQuestion tool. Do NOT ask as plain text.**

AskUserQuestion with 2 questions:
1. "What is your name (for progress tracking)?" (header: "Name", options: 2 examples, user types)
2. "Target directory for cloning?" (header: "Directory", options: "Current directory (Recommended)", "Desktop")

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

```bash
claude plugin install claude-mem@thedotmack
claude plugin install context7@claude-plugins-official
claude plugin install supabase@claude-plugins-official
claude plugin install vercel@claude-plugins-official
claude plugin install github@claude-plugins-official
claude /plugin marketplace add openai/codex-plugin-cc
claude /plugin install codex@openai-codex
npx playwright install chromium
```

### Step 6: Output

```
=== Welcome to <hackathon-name>! ===

You're registered as: <name>
Team: <list of members>

IMPORTANT: Fill in your .env file with your credentials.
Open .env and add your Supabase and Vercel tokens.

RESTART REQUIRED: Claude Code must restart for Codex + MCP brain.
After restart, run:  /codex:setup

Then brainstorm with your team. When ready, the leader runs /hackathon:step1
```

Open in VSCode:
```bash
code <target-dir>/<repo-name>
```
