# Watering Guide

0a. Study /specs/theBRIEF.md to get a sense of the complete project
0b. Study specs/* to learn about the live repo specifications
0c. Study specs/theCODEMAP.md and use it as a lookup to understand our code-base
0d. Inspect the `.beads/` issue tracker to understand the current tasks (`br ready`, `br list`, `br show <id>`)
0e. When you select a ready issue for active implementation, immediately set it to `in_progress` before doing the work (`br update <id> -s in_progress` or `br update <id> --claim`).
0f. Before editing files, write a short execution mini-brief in your reasoning and follow it during the run:
   - `Issue`: `<id> <title>`
   - `Goal`: one-sentence desired outcome
   - `Files`: expected files to change
   - `Tests`: exact checks to run
   - `Stop condition`: what makes you halt and hand off

# Your Tasks
1. Implement the most important ready issue (don't assume it's the first issue shown)
2. If you find an issue that is already done, close it in `.beads/` (`br close <id>`) and stop if no ready issues remain

3. Test it in the most effective way possible.
4. When the tests have passed (and only if), update the issue status/details in `.beads/` (`br update <id> ...` / `br close <id>`) and then update `specs/theCODEMAP.md`

5. Git Commit the code/doc changes with the issue id

6. Sync tracker changes:
   - Default: keep a single commit per task by including `.beads/` updates in the same code/doc commit
   - Run `br sync --flush-only` before commit, then include `.beads/` in that same commit

7. Stop. Work on no more tasks.

8. If you notice additional work, create a new issue in `.beads/` (`br create ...`)

# Scope and Context Guardrails
- Work exactly one `.beads` issue per water run. Do not start a second issue in the same run.
- Do not invoke `water.sh`, `ralph-loop.sh`, or another nested water/seed loop from inside this run.
- Keep command output bounded; prefer targeted reads (for example `rg`, `sed -n`, `tail -n`) over full-log dumps.
- If scope expands, requirements become unclear, or context feels saturated/noisy, stop early instead of pushing through.
- Before stopping early, record a concise handoff in `.beads` notes for the active issue:
  - what changed
  - tests run and results
  - open risks/questions
  - exact next step
- After writing the handoff, end the run cleanly with `WATERING-DONE`.
