# Session Notes

**Last Updated:** 2026-02-23

This file captures the current state of the project, recent work, and key practices. Update this regularly to maintain context between Claude Code sessions.

---

## Current State

**Branch:** `feature/social-activity-feed`
**Status:** Completed social activity feed implementation

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

**Branch:** `feature/pwa-navigation-share` (merged as PR #28)

### 2026-02-22: Social Activity Feed Implementation
**Context:** Users requested a Venmo-style social feed to see what friends are listening to. This expands Side A from shared collections to a broader social network of vinyl collectors.

**Actions:**
1. **Database Foundation (Phase 1):**
   - Created migration `20250222000001_add_social_features.sql`
   - Added `follows` table for one-way follow relationships (Twitter/Instagram style)
   - Added `share_activity` boolean column to profiles (defaults to true - opt-out privacy)
   - Extended plays RLS policy to show plays from:
     - Users you follow (if they have share_activity = true)
     - Users in your shared collections (if they have share_activity = true)
   - Indexes on follower_id, following_id for fast lookups

2. **Follow System & Profiles (Phase 2):**
   - Created server actions: `follow-user.ts`, `update-privacy-settings.ts`
   - Built `FollowButton` component (matches Play button styling, optimistic UI)
   - Created user profile pages `/profile/[id]` showing:
     - Display name, email, member since date
     - Follow button (hidden on own profile)
     - Recent play statistics
     - Activity feed of recent plays

3. **Activity Feed (Phase 3):**
   - Created `/feed` page as main social hub
   - Built `FeedCard` component displaying:
     - User name (links to profile)
     - Timestamp (relative: "5m ago", "2h ago", etc.)
     - Mood emoji and tag
     - Album cover, title, artist
   - Integrated with existing `PullToRefresh` component
   - Empty state for users with no activity

4. **Discovery & Privacy (Phase 4):**
   - Created `/discover` page with two sections:
     - Email search (debounced, real-time results)
     - Suggested users from shared collections
   - Built `UserSearch` component (client-side with debounce)
   - Built `SuggestedUsers` component (server-side)
   - Created `/profile/settings` page for privacy controls
   - Built `ActivityPrivacyToggle` component (iOS-style toggle switch)

5. **Navigation Integration (Phase 5):**
   - Added feed icon to collection header navigation
   - Added privacy settings icon to feed page header
   - All pages have clear "Back to..." navigation

**Key Design Decisions:**
- **Privacy:** Opt-out model (public by default) - users must explicitly disable sharing
- **Follow Model:** One-way follows (asymmetric) like Twitter/Instagram, not bidirectional
- **RLS Strategy:** Multiple policies on plays table work with OR logic - new follow-based visibility doesn't break existing collection-based access
- **Feed Scope:** Shows followed users + collection members (unified social experience)
- **Visibility:** Full play details visible even if you don't have access to that collection

**Technical Details:**
- RLS policies handle all privacy filtering at database level
- Follows table uses profiles.id (not auth.users.id) for consistency
- ON DELETE CASCADE ensures cleanup when users delete accounts
- Unique constraint prevents duplicate follows
- Check constraint prevents self-follows
- formatRelativeTime: "5m ago", "2h ago", "3d ago" (matches stats page)
- Reused MOODS constant and emoji mapping from play-button.tsx

**Files Created:**
- Migration: `supabase/migrations/20250222000001_add_social_features.sql`
- Server Actions: `frontend/src/app/actions/follow-user.ts`, `update-privacy-settings.ts`
- Pages: `feed/page.tsx`, `profile/[id]/page.tsx`, `discover/page.tsx`, `profile/settings/page.tsx`
- Components: `follow-button.tsx`, `feed-card.tsx`, `feed-list.tsx`, `user-search.tsx`, `suggested-users.tsx`, `activity-privacy-toggle.tsx`

**Files Modified:**
- `collection-view.tsx` - Added feed icon to header navigation
- `feed/page.tsx` - Added privacy settings icon

**What's Next:**
- Testing: Need to test follow/unfollow flow, privacy toggle, RLS policies
- Future: Consider pagination for feed (currently limited to 50 items)
- Future: Real-time updates when someone logs a play (WebSocket/Supabase realtime)

**Branch:** `feature/social-activity-feed` (in progress)

### 2026-02-22: MBID, Iconic Cover Recognition & Cross-Collection Stats
**Context:** Three related improvements to album recognition and the data model.

**Actions:**
1. **Migration** (`20250222000005_add_mbid_to_records.sql`): Added `mbid TEXT` column + index to `records` table. Enables canonical linking of the same album across collections.
2. **Iconic cover recognition** (`backend/src/lib/claude.ts`): Updated `extractAlbumInfo` prompt with a two-step approach — read visible text first, then fall back to visual knowledge of iconic album artwork (Dark Side of the Moon prism, Abbey Road zebra crossing, etc.).
3. **Persist MBID on insert** (`collection/new/page.tsx`): `mbid` written to DB when user accepts a MusicBrainz match. Added `id?: string` to `MusicBrainzMetadata` and `RecognitionResult.metadata` types.
4. **Manual "Look up on MusicBrainz" button** (`collection/new/page.tsx`): Appears below title+artist fields when both are filled and no scan is active. Calls `/api/lookup`, sets `musicBrainzMatch` + `musicBrainzApproval = pending`. Reuses existing approval card UI.
5. **Fetch Track List also sets MBID** (`fetch-tracks-button.tsx`): Supabase update now includes `mbid: data.metadata.id ?? null`.
6. **Backfill action + component**: `backfill-mbid.ts` server action calls `/api/lookup` and writes mbid. `mbid-backfiller.tsx` invisible client component fires on mount for legacy records.
7. **Cross-collection stats** (`collection/[id]/page.tsx`): When `mbid` is known, two parallel queries count other records + aggregate plays. Renders "Also in X other collections · Y total plays" below artist name.

**Branch:** `feature/play-reactions` (PR #43, open)

### 2026-02-22: "Now Playing" Live Presence
**Context:** UX shift — tapping Play means "I'm listening right now." A play < 30 min old = active session. No new DB tables needed.

**Actions:**
1. `play-button.tsx`: "Log without mood" → "Just listening"
2. `feed-card.tsx`: plays within 30-min window show "Listening now 🎵" via `formatRelativeTime`
3. `collection/[id]/page.tsx`: Active listener count query + pulsing dot badge ("X people listening now")
4. `collection/page.tsx`: 5th parallel query for current user's active play; "Now spinning" banner links to record detail
5. `collection/browse/page.tsx` + `collection-view.tsx`: Same now-spinning banner passed as optional prop to CollectionView
6. New `now-playing-bar.tsx` component: SSR-seeded, realtime Supabase `postgres_changes` INSERT subscription, deduplicates per user_id, auto-prunes on 60s interval
7. `feed/page.tsx`: Parallel live query + NowPlayingBar above FeedList

**Branch:** `feature/now-playing-presence` (PR #44, open)

### 2026-02-23: Mood-Based Album Recommendations
**Context:** "What should we listen to?" — recommend albums from the collection based on mood. One-tap play logging from the recommendation screen.

**Actions:**
1. `backend/src/lib/claude.ts`: Added `rankAlbumsForContext(context, albums)` — sends a rich context string + album list to Claude, returns ranked IDs (max 8). Backend is context-agnostic; frontend owns the mood→context mapping.
2. `backend/src/routes/recommend.ts`: New `POST /api/recommend` route. Accepts `{ context: string, albums[] }`. Returns `{ recommendations: string[] }`. Graceful degradation (returns 200 with empty array on Claude errors).
3. `backend/src/index.ts`: Registered `/api/recommend` route.
4. `frontend/src/app/collection/pick/page.tsx`: Server component. No mood param → renders 6 mood cards. With mood param → fetches records + plays, computes Tier 1 (history-based) and Tier 2 candidates (unplayed, capped at 30), renders `<PickResults>`.
5. `frontend/src/components/pick-results.tsx`: Client component. On mount calls backend for Claude rankings. Renders "Your top picks" (Tier 1) and "Try something new" (Tier 2) sections with `RecPick` cards. One-tap play logging — button becomes "✓ Now playing".
6. `frontend/src/app/collection/page.tsx`: Added "What are we listening to?" 3×2 mood grid above Activity section.
7. `frontend/src/components/collection-view.tsx`: Added lightbulb icon in header nav linking to `/collection/pick`.

**Key Design Decisions:**
- Context string (not raw mood enum) sent to Claude — adding free-text vibe input later is purely a frontend change
- MOOD_CONTEXTS map lives in frontend pick page, not backend
- Tier 2 candidates capped at 30 to keep Claude prompt manageable; response capped at 8
- Play logging: direct Supabase client insert (no server action needed)
- Tier 2 silently absent if Claude unavailable — Tier 1 always shows

**Branch:** `feature/mood-recommendations` (PR #48, open)

### 2026-02-23: Wish List + MusicBrainz Catalog Search
**Context:** Users want to track albums they want to acquire, and the existing MusicBrainz integration returned only a single best-guess match. Both features share a common catalog search UI.

**Architecture:**
- Per-user wish list (not per-collection) — `wish_list_items` table with RLS
- Reusable `AlbumSearch` component used in both wish list and add-record flows
- Backend: two new catalog-search endpoints on `/api/catalog-search`

**Actions:**
1. DB migration `20260223000001_add_wish_list.sql`: `wish_list_items` table with UNIQUE(user_id, mbid), RLS policies (read: all authenticated; insert/delete: owner only)
2. `backend/src/lib/musicbrainz.ts`: Added `MusicBrainzSearchResult` type, `searchReleaseCatalog(q)` (multi-result, no cover art), `getReleaseByMbid(mbid)` (full detail). Factored `fetchReleaseDetail(mbid)` private helper shared with `searchRelease`.
3. `backend/src/routes/catalog-search.ts`: `GET /` (?q=...) and `GET /:mbid` — both return 200 with empty/null on errors.
4. `frontend/src/components/album-search.tsx`: Client component with idle→loading-results→results→loading-detail→preview phases. 400ms debounce on typing. Props: `onSelect`, `actionLabel`, `onCancel`.
5. `frontend/src/app/actions/wish-list.ts`: `addToWishList` (upsert), `removeFromWishList`, `promoteToCollection` (insert record + delete item).
6. `frontend/src/app/wishlist/page.tsx` + `wish-list-search.tsx` + `wish-list-item.tsx`: Full wish list management page. Promote supports single or multi-collection picker.
7. `frontend/src/app/profile/[id]/page.tsx`: Parallel wish list query; read-only section shown if non-empty; "Manage →" link for own profile.
8. `frontend/src/app/collection/new/page.tsx`: `showCatalogSearch` state + `handleCatalogSelect` callback + "Search catalog" button that renders `<AlbumSearch>` inline. Feeds existing approval card flow unchanged.
9. Navigation: Heart icon in `collection-view.tsx` header; "My wish list →" teaser in `collection/page.tsx`.

**Key Design Decisions:**
- Wish list is per-user (not per-collection) so users can track personal acquisition goals
- AlbumSearch shows results without cover art (fast) then fetches full detail on click
- upsert on conflict (user_id, mbid) makes re-adding idempotent
- promoteToCollection: insert first, delete after; delete failure is logged but not surfaced

**Branch:** `feature/wish-list-catalog-search` (open)
