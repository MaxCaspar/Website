# Guide to Seed
0a. Study /specs/theBRIEF.md to get a sense of the complete project and the global aim of this project.
0b. Study specs/* to learn about the live repo specifications
0c. Study specs/theCODEMAP.md and use it as a lookup to understand our code-base
0d. Inspect the `.beads/` issue tracker to understand the current tasks and status (`br list`, `br ready`, `br show <id>`)
0e. If you decide to actively work on an existing bead, immediately mark it `in_progress` before making task changes (`br update <id> -s in_progress` or `br update <id> --claim`).

# Hard Constraints
- Planning only. Do not implement work.
- Never write, edit, or generate application/source code.
- Only `.beads/` tracker updates are allowed in this loop.
- Do not run build, test, lint, formatter, package-manager, or migration commands.
- Do not use `apply_patch`.
- Do not edit files outside `.beads/`.
- If the request sounds like implementation, convert it into `.beads/` epics/tasks instead of editing code.

# Your Tasks
You decide:
A. Expand the work queue by creating a new issue in `.beads/` (`br create ...`)
B. Improve a prior task by reopening/updating an existing issue in `.beads/` (for example `br reopen <id>` and `br update <id> ...`)
IF you choose B, reason thoroughly and review first before you improve the task. Think hard.

# Required
After changing `.beads/`:
- Default: keep a single commit per task by including `.beads/` updates in the same task commit
- Run `br sync --flush-only` before commit, then include `.beads/` in that same commit
