---
name: hackathon-update
description: Update the hackathon-framework plugin to the latest version from GitHub.
---

# /hackathon:update

Update the hackathon-framework plugin to the latest version.

## Steps

1. Uninstall current version:
```bash
claude /plugin uninstall hackathon-framework@Enkidu-png
```

2. Reinstall latest from GitHub:
```bash
claude /plugin install hackathon-framework@Enkidu-png
```

3. Tell the user:
```
Plugin updated! Restart Claude Code for changes to take effect.
```
