# hackathon-framework

Claude Code plugin for hackathon team coordination. Messy notes in, working product out.

## Install

```bash
claude plugin install hackathon-framework@hackathon-framework
```

## Quick Start

**Leader** creates a hackathon:
```
/init_hackathon create
```

**Team members** join:
```
/init_hackathon join https://github.com/<org>/<repo>
```

## Workflow

| Step | Command | What it does |
|------|---------|-------------|
| 1 | `/hackathon:step1` | Paste messy transcript/notes -> detailed app spec |
| 2 | `/hackathon:step2` | Architecture decomposition + parallel module research |
| 3 | `/hackathon:overnight` | Overnight autoresearch loop with coordinated merge |

## What Gets Installed

- **Plugins:** claude-mem, context7, supabase, vercel, github, playwright, codex (openai/codex-plugin-cc)
- **MCP Server:** Hackathon Brain (shared state: vision, architecture, progress)
- **Hooks:** Auto git savepoints after every file change
- **Permissions:** Bypassed for speed (destructive ops still blocked)

## Architecture

```
Plugin (global)          Repo (per hackathon)
├── Skills               ├── .hackathon/brain/    (MCP server)
├── Agents               ├── .hackathon/state/    (JSON state files)
├── Hooks                ├── .claude/settings.json (permissions)
└── Templates            ├── .mcp.json            (registers brain)
                         ├── .env                 (shared creds)
                         └── CLAUDE.md            (project rules)
```
