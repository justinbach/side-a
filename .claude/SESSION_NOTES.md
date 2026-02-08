# Session Notes

**Last Updated:** 2026-02-08

This file captures the current state of the project, recent work, and key practices. Update this regularly to maintain context between Claude Code sessions.

---

## Current State

**Branch:** `feature/update-docs`
**Status:** Documenting project structure and practices

### All Core Features Complete ✅
- Photo-based album recognition (Claude vision → MusicBrainz)
- Play logging with mood tags
- Notes & star ratings (1-5 stars)
- Shared collections with email invites
- User play tracking & collection statistics
- PWA support (home screen installation)
- Track list management
- Image preprocessing & approval workflow
- Collection switcher, rename, member management
- Google OAuth sign-in
- Mobile responsive layouts

### Recent Work (Last 7 Days)
- **2026-02-07:** PWA support merged (PR #24)
- **2026-02-07:** Mobile layout fixes for collection header (PR #23)
- **2026-02-07:** User play tracking with collection stats page (PR #22)
- **2026-02-08:** Documentation restructure (current PR #25)

---

## Key Practices & Decisions

### Git Workflow
**IMPORTANT:** Always work on feature branches, never commit directly to `main`
- Branch naming: `feature/<short-description>`
- Commit frequently with clear messages
- Open PR when complete — do NOT merge (user will merge)
- Include `Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>` in commit messages

### Documentation Structure
**Human-Facing (Root):**
- `README.md` - Public project overview, setup instructions
- `BACKLOG.md` - Single source of truth for tasks (In Progress / Planned / Ideas / Completed)

**Claude-Facing (.claude/):**
- `.claude/CONTEXT.md` - Architecture, design principles, data model, UX guidelines
- `.claude/CLAUDE.md` - Workflow instructions (git, general practices)
- `.claude/SESSION_NOTES.md` - Current state, recent work (this file)

**Keep BACKLOG.md updated** as you complete features or identify new work.

### Architecture Decisions
- **Monorepo:** `/frontend` (Next.js) + `/backend` (Express) in same repo
- **Database:** Supabase PostgreSQL with RLS (Row Level Security) enforcing collection membership
- **Auth:** Supabase Auth (email + Google OAuth)
- **Image Flow:** User photo → Claude API (vision) → MusicBrainz API → structured data
- **Deployment:** Vercel (frontend), Render (backend), Supabase (DB/auth), all free tiers

### Design Principles
- **Mid-century modern / warm minimal aesthetic**
- **One-tap play logging** — mood tags are optional, never block the primary action
- **Album recognition should feel magical** — clear loading states, populate all fields
- **Shared collections are simple** — email invite → auto-join on sign-up
- The Play button is the **signature interaction** (burnt orange, oversized, satisfying)

### Testing & CI
- CI pipeline runs tests on all PRs
- ESLint configured
- Test coverage reporting enabled

---

## Next Up (From BACKLOG.md)

### Planned
- [ ] User analytics / personal listening stats
  - Total plays, plays this week/month
  - Top records
  - Mood patterns over time
  - Listening streaks

### Future Ideas
- [ ] Sonos/turntable integration
- [ ] Album recommendations based on history
- [ ] Social features (follow collectors, share plays)
- [ ] Import from Discogs
- [ ] Export collection data

---

## Known Issues / Blockers

None currently.

---

## Session History

### 2026-02-08: Documentation Restructure & Context Recovery
**Context:** After Claude Code upgrade, needed to reestablish project state and practices.

**Actions:**
1. Identified that CONTEXT.md was stale (last updated Feb 1) vs BACKLOG.md (Feb 7)
2. Updated both files to reflect current state (all core features complete)
3. Caught violation of feature branch workflow — fixed by moving commit to feature branch
4. Restructured documentation:
   - Created README.md (user-facing)
   - Moved CONTEXT.md to .claude/ (Claude-facing)
   - Created SESSION_NOTES.md (this file)
   - Established clear human-facing vs Claude-facing docs

**Key Learning:** Feature branch discipline is critical. Always check workflow before committing.

**Branch:** `feature/update-docs` (PR #25)
