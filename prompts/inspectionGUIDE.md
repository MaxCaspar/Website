# Guide to Inspect

0a. Study /specs/theBRIEF.md and specs/theCODEMAP.md for current repo intent.
0b. Inspect recent logs in `.loops/watering/` and `.loops/seeding/` for recurring signals.
0c. Run the repo-local inspector script and let it update local learning files in `.loops/loop-inspector/`.
0d. Inspect `.beads/` issue tracker status (`br ready`, `br list`, `br show <id>`) before creating new work.

# Your Tasks
1. Run loop-inspector in dry-run mode and summarize top recurring findings.
2. If findings are high-confidence and non-duplicate, create/update `.beads/` improvements.
3. Keep `.loops/loop-inspector/state.json` and `.loops/loop-inspector/rules.local.json` consistent and explain what changed.
4. Avoid bead spam: prefer recurrence-backed findings over one-off noise.

# Required
After changing `.beads/`:
- Default: keep a single commit per task by including `.beads/` updates in the same code/doc commit
- Run `br sync --flush-only` before commit, then include `.beads/` in that same commit
