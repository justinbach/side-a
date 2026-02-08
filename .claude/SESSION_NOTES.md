# Session Notes

**Last Updated:** 2026-02-08

This file captures the current state of the project, recent work, and key practices. Update this regularly to maintain context between Claude Code sessions.

---

## Current State

**Branch:** `feature/pwa-enhancements`
**Status:** Implementing PWA native affordances (pull-to-refresh, safe areas)

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
- **2026-02-08:** Documentation restructure merged (PR #25)
- **2026-02-08:** Feature backlog restructure merged (PR #26)
- **2026-02-08:** PWA enhancements - pull-to-refresh and safe areas (in progress)

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
- `BACKLOG.md` - Single source of truth for tasks (In Progress / Planned / Feature Backlog / Completed)

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

**Branch:** `feature/update-docs` (PR #25, merged)

### 2026-02-08: Feature Backlog Restructure
**Context:** Brainstormed extensive feature list across analytics, social, metadata, and integrations. Needed structure and prioritization.

**Actions:**
1. Defined prioritization framework: Impact (user value) + Effort (development complexity)
2. Chose simple H/M/L scoring for maintainability
3. Kept single source of truth in BACKLOG.md (replaced "Ideas / Future" section)
4. Organized ~60 features across 8 categories:
   - Analytics & Insights
   - Social & Activity
   - Metadata & Collection Management
   - Enhanced Play Logging
   - Import & Integration
   - Discovery & Recommendations
   - Collection Features
   - Mobile & UX Enhancements
   - Hardware & Advanced Integration
5. Added dependencies where relevant

**Key Learning:** Simple, scannable format (one-liner per feature) easier to maintain than detailed specs. Priority naturally emerges from Impact/Effort matrix.

**Branch:** `feature/structured-backlog` (PR #26, merged)

### 2026-02-08: PWA Enhancements - Native App Affordances
**Context:** With PWA installed, users lose browser controls (refresh button, back button, address bar). Need native app behaviors.

**Actions:**
1. Added safe area CSS support for iOS notches, dynamic island, and home indicator
   - Added CSS env() variables to globals.css
   - Set viewport-fit=cover in layout.tsx
   - Applied safe area padding to body element
2. Implemented pull-to-refresh component
   - Custom touch handlers for pull gesture
   - Burnt orange spinner matching design system
   - Smooth animations with resistance curve
   - Integrated into CollectionView with router.refresh()
3. Added PWA enhancements to BACKLOG.md planned work:
   - Pull-to-refresh ✅
   - Safe area handling ✅
   - Navigation improvements (pending)
   - Native share functionality (pending)
   - Improved splash screen (pending)
   - Install prompt optimization (pending)

**Technical Details:**
- Pull-to-refresh only activates at top of scroll (window.scrollY === 0)
- Prevents default scroll when pulling down
- Applies resistance curve (distance * 0.5) for natural feel
- Release threshold of 60px to trigger refresh

**Branch:** `feature/pwa-enhancements` (in progress)
### 2026-02-08: PWA Navigation and Share - Completing PWA Suite
**Context:** After pull-to-refresh and safe areas merged (PR #27), continued with remaining PWA affordances.

**Actions:**
1. Created ShareButton component using Web Share API
   - Detects if navigator.share is available
   - Falls back to copy-link modal if not supported
   - Icon-only mode for compact placement
   - Added to record detail page title area
2. Improved splash screen
   - Updated manifest.json background_color to match cream (#FAF7F2)
   - Updated theme_color to match burnt-orange (#CC5500)
3. Created InstallPrompt component
   - Intercepts beforeinstallprompt event
   - Custom UI with burnt orange branding
   - 10-second delay before showing (not aggressive)
   - Respects 7-day dismissal period via localStorage
   - Checks if already installed (display-mode: standalone)
   - Added to root layout for global availability
4. Navigation improvements
   - Verified all subpages already have "Back to Collection" links
   - No additional work needed - already well-implemented

**Technical Details:**
- ShareButton uses Web Share API with fallback copy-to-clipboard
- InstallPrompt stores dismissal timestamp in localStorage
- Safe area padding added to install prompt (.safe-bottom class)
- Manifest colors now match design system exactly

**All PWA Enhancements Complete:**
✅ Pull-to-refresh (PR #27)
✅ Safe area handling (PR #27)
✅ Navigation patterns (verified existing)
✅ Native share (this PR)
✅ Splash screen (this PR)
✅ Install prompt (this PR)

**Branch:** `feature/pwa-navigation-share` (in progress)
