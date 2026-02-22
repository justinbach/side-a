# Claude Code Workflow Instructions

## Git
- Work on short-lived feature branches, not directly on main.
- Branch naming: `feature/<short-description>` (e.g. `feature/auth-setup`, `feature/play-logging`)
- Commit frequently with clear, concise commit messages.
- Open a PR to main when the feature is complete and merge it using `gh pr merge --merge`.

## Documentation Structure
**Claude-facing docs (this directory):**
- `CONTEXT.md` - Architecture, design principles, data model, UX guidelines
- `SESSION_NOTES.md` - Current state, recent work, key decisions (UPDATE THIS as you work)
- `CLAUDE.md` - This file with workflow instructions

**Human-facing docs (project root):**
- `/README.md` - Public project overview and setup instructions
- `/BACKLOG.md` - Single source of truth for tasks and priorities

## General
- Start each session by reading SESSION_NOTES.md to understand current state
- Read CONTEXT.md for architecture and design principles
- Check /BACKLOG.md for current priorities and planned work
- Update BACKLOG.md and SESSION_NOTES.md as you complete tasks or make key decisions
- Ask before making significant architectural changes
