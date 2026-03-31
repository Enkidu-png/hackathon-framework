---
name: hackathon-overnight
description: Run an overnight autoresearch loop that improves your module code while you sleep. Coordinates with other team members via git — last PC to finish triggers a merge agent.
---

# /hackathon:overnight — Overnight Autoresearch Loop

Inspired by Karpathy's autoresearch. Edit code, test, keep if improved, discard if worse, repeat 100+ times overnight.

## Step 1: Save Current Work

```bash
git add -A
git commit -m "savepoint: pre-overnight snapshot" --no-verify || true
git push || true
```

## Step 2: Determine Context

Read `.hackathon/state.json` to get:
- Current module assignment (based on current branch or ask the user)
- Total module count
- Team info

Read `.hackathon/modules/<module>.json` for module context.

If the user hasn't been assigned a module yet, ask which module they're working on.

## Step 3: Set Up Overnight Branches

### Create shared `overnight` branch (if needed)

```bash
# Check if overnight branch exists on remote
git fetch origin
if ! git rev-parse --verify origin/overnight >/dev/null 2>&1; then
  # Create from current main
  git checkout main
  git pull
  git checkout -b overnight
  git push -u origin overnight
else
  # Verify it's based on current main
  git checkout overnight
  git pull
fi
```

### Create module-specific overnight branch

```bash
MODULE_BRANCH="<module-name>"  # e.g., "auth", "frontend"
git checkout $MODULE_BRANCH
git pull
git checkout -b "${MODULE_BRANCH}-overnight"
git push -u origin "${MODULE_BRANCH}-overnight"
```

## Step 4: Plan Experiments

Ask the user: **"What time do you want to wake up?"** (e.g., "07:00" or "7am")

Calculate:
```
now = current time
wake_up = user's wake-up time
available_hours = wake_up - now (handle midnight crossing)
merge_reserve = 30 minutes
experiment_budget_minutes = (available_hours * 60) - merge_reserve
experiment_duration = 3 minutes (test suite run)
max_experiments = experiment_budget_minutes / experiment_duration
stop_time = wake_up - 30 minutes
```

Write plan to `.hackathon/overnight/plan/<module>.json`:
```json
{
  "module": "<module>",
  "member": "<name>",
  "started_at": "<ISO>",
  "wake_up_time": "<time>",
  "stop_time": "<time>",
  "max_experiments": <N>,
  "experiment_duration_min": 3
}
```

```bash
git add .hackathon/overnight/plan/
git commit -m "overnight: plan for <module>" --no-verify
git push
```

Tell the user:
```
Overnight plan:
- Module: <module>
- Stop time: <stop_time> (30 min before wake-up for merge)
- Max experiments: ~<N>
- Working on branch: <module>-overnight

Starting autoresearch loop now. You can sleep!
Press Ctrl+C to stop early.
```

## Step 5: Autoresearch Loop

**REPEAT until current time >= stop_time:**

### 5a. Read Context

- Read module spec from `.hackathon/modules/<module>.json`
- Read past results from `.hackathon/overnight/results/<module>.tsv` (if exists)
- Read the current code in the module directory

### 5b. Pick an Improvement

Based on context and past experiments, choose ONE improvement to try. Categories:

1. **Missing error handling** — find functions without try/catch or error states
2. **Test coverage** — add tests for uncovered functions
3. **Type safety** — add or improve TypeScript types
4. **Performance** — optimize hot paths, reduce re-renders, improve queries
5. **Code quality** — extract functions, reduce duplication, improve naming
6. **Edge cases** — handle empty states, loading states, error states
7. **Accessibility** — add aria labels, keyboard navigation, focus management
8. **Lint/warnings** — fix any linter or compiler warnings

Pick based on what hasn't been tried (check results.tsv) and what has the highest impact.

### 5c. Make the Change

Edit code files. **Only touch files in the module's directory** (as defined in module spec). Never modify:
- Files in other modules' directories
- Shared types (unless the change is clearly safe and additive)
- Configuration files
- `.hackathon/` state files (except overnight results)

### 5d. Run Tests

```bash
# Try to run the test suite (adapt to project's test runner)
npm test 2>&1 || npx jest 2>&1 || npx vitest run 2>&1

# Also try build
npm run build 2>&1 || npx tsc --noEmit 2>&1
```

Capture exit code and output.

### 5e. Evaluate

**KEEP if ALL of:**
- Tests pass (exit code 0)
- Build succeeds (exit code 0)
- No new warnings introduced

**DISCARD if ANY of:**
- Tests fail
- Build fails
- New warnings introduced
- Runtime errors in output

### 5f. Record Result

If **KEPT**:
```bash
git add -A
git commit -m "overnight: <one-line description of improvement>" --no-verify
git push
```

If **DISCARDED**:
```bash
git checkout -- .
git clean -fd
```

Append to `.hackathon/overnight/results/<module>.tsv`:
```
<timestamp>\t<commit-or-NONE>\t<KEPT|DISCARDED>\t<category>\t<description>
```

Create the TSV file with header if it doesn't exist:
```
timestamp	commit	status	category	description
```

### 5g. Check Time

```bash
current_time=$(date +%H:%M)
```

If current_time >= stop_time: exit loop.

Otherwise: continue to next experiment.

## Step 6: Signal Done

After loop ends:

```bash
# Create done marker
cat > .hackathon/overnight/done/<module>.json << 'EOF'
{
  "module": "<module>",
  "member": "<name>",
  "experiments_run": <total>,
  "experiments_kept": <kept_count>,
  "experiments_discarded": <discarded_count>,
  "finished_at": "<ISO>",
  "branch": "<module>-overnight"
}
EOF

git add .hackathon/overnight/
git commit -m "overnight: <module> complete — <kept_count>/<total> improvements kept" --no-verify
git push
```

## Step 7: Check If Last to Finish

```bash
git pull

# Count done markers
done_count=$(ls .hackathon/overnight/done/*.json 2>/dev/null | wc -l)

# Get total module count from architecture
total_modules=$(node -e "const a=JSON.parse(require('fs').readFileSync('.hackathon/architecture.json','utf8'));console.log(a.modules.length)")
```

### If done_count == total_modules: I'm last — trigger merge

Check for lock first:
```bash
if [ -f .hackathon/overnight/merge.lock ]; then
  echo "Another PC is already merging. Stopping."
  exit 0
fi

# Create lock
echo '{"locked_by":"<name>","locked_at":"<ISO>"}' > .hackathon/overnight/merge.lock
git add .hackathon/overnight/merge.lock
git commit -m "overnight: acquired merge lock" --no-verify
git push
```

**Launch `overnight-merger` agent** with full context:
- All module names and their overnight branches
- Architecture contracts
- All done markers (experiment counts, what was kept)

### If done_count < total_modules: Not last — stop

```
Overnight loop complete for <module>!

Results:
- Experiments run: <total>
- Improvements kept: <kept_count>
- Improvements discarded: <discarded_count>

Waiting for other modules to finish (<done_count>/<total_modules> done).
The last PC to finish will trigger the merge agent.

Your improvements are on branch: <module>-overnight
```
