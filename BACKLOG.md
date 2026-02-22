# Side A - Product Backlog

**NOTE:** Keep this file updated regularly as work progresses. Check it when starting new work to avoid stale priorities.

## In Progress

## Planned

### PWA Enhancements (High Priority)
Since Side A is now installable as a PWA, we need native app affordances that account for missing browser controls:
- [x] **Pull-to-refresh** — Swipe down to refresh collection/pages (Impact: High, Effort: Low)
- [x] **Safe area handling** — Support for notches, dynamic island, home indicator (Impact: High, Effort: Low)
- [x] **Navigation improvements** — Clear back button patterns (already implemented) (Impact: Medium, Effort: Low)
- [x] **Native share functionality** — Share albums/plays without browser share button (Impact: Medium, Effort: Low)
- [x] **Improved splash screen** — Match brand colors in manifest (Impact: Low, Effort: Low)
- [x] **Install prompt optimization** — Custom prompt with 10s delay and 7-day dismissal (Impact: Medium, Effort: Low)

### Analytics & Personal Stats
- [ ] User analytics / personal listening stats
  - Total plays, plays this week/month
  - Top records
  - Mood patterns over time
  - Listening streaks

## Feature Backlog

Features organized by category with Impact (user value) and Effort (development complexity) scores.
**Quick wins** = High Impact + Low Effort. **Major projects** = High Impact + High Effort.

### Analytics & Insights
- **Listening velocity trends** — Plays per day/week over time with charts (Impact: Medium, Effort: Low) [Depends on: Personal stats]
- **Genre/decade breakdown** — Visualize collection and listening by genre/era (Impact: Medium, Effort: Medium)
- **Year-in-review summary** — Annual recap with stats, top albums, and highlights (Impact: Medium, Effort: Medium) [Depends on: Personal stats]
- **Comparative stats** — Compare your plays vs other collection members (Impact: Medium, Effort: Low) [Depends on: Personal stats]
- **Collection growth timeline** — Track when albums were added over time (Impact: Low, Effort: Low)
- **Deep cuts finder** — Surface albums you haven't played recently (Impact: Medium, Effort: Low)
- **Listening time estimates** — Total hours listened based on track lengths (Impact: Low, Effort: Medium)

### Social & Activity
- **Now playing status** — Real-time "currently listening" for collection members (Impact: Medium, Effort: Low)
- **Comments on albums** — Discussion threads per record in collection (Impact: Medium, Effort: Medium)
- **Reactions on plays** — Like/heart plays from collection members (Impact: Low, Effort: Low)
- **Share plays to social** — Post individual plays to Twitter/Instagram (Impact: Low, Effort: Low)
- **Listening parties** — Synchronized listening sessions with chat (Impact: Low, Effort: High)

### Metadata & Collection Management
- **Pressing/edition info** — Track country, year, label variant per record (Impact: High, Effort: Low)
- **Condition tracking** — Record condition grades (VG+, NM, etc.) (Impact: High, Effort: Low)
- **Purchase info** — Date, price, source/store for each record (Impact: Medium, Effort: Low)
- **Custom tags** — User-defined tags beyond moods (genres, themes, "winter albums") (Impact: High, Effort: Medium)
- **Want list** — Track albums you're looking to acquire (Impact: Medium, Effort: Medium)
- **Storage location** — Shelf/crate numbers for physical organization (Impact: Medium, Effort: Low)
- **Loan tracking** — Track who you've lent records to (Impact: Low, Effort: Low)
- **Collection value estimation** — Estimate total collection value via Discogs prices (Impact: Medium, Effort: High)
- **Duplicate detection** — Identify and manage duplicate albums (Impact: Low, Effort: Medium)
- **Bulk operations** — Multi-select for batch edits and tagging (Impact: Medium, Effort: Medium)
- **Advanced search/filtering** — Complex queries and saved searches (Impact: Medium, Effort: Medium)

### Enhanced Play Logging
- **Listening context** — Who with, occasion, location metadata (Impact: Medium, Effort: Low)
- **Side-specific logging** — Log Side A vs Side B separately (Impact: Low, Effort: Low)
- **Equipment notes** — Track which turntable/system used (Impact: Low, Effort: Low)
- **Attach photos to plays** — Add photos of listening setup or environment (Impact: Low, Effort: Medium)
- **Skip tracking** — Mark incomplete listens (Impact: Low, Effort: Low)

### Import & Integration
- **Discogs import** — Full collection sync from Discogs (Impact: High, Effort: High)
- **Export collection data** — CSV/JSON export with custom fields (Impact: Medium, Effort: Low)
- **Last.fm scrobbling** — Auto-sync plays to Last.fm (Impact: Medium, Effort: Medium)
- **Barcode/catalog scanning** — Quick add via barcode scan (Impact: Medium, Effort: Medium)
- **Spotify/Apple Music links** — Compare vinyl vs streaming habits (Impact: Low, Effort: Medium)
- **Discogs marketplace integration** — Price checking and value tracking (Impact: Medium, Effort: High) [Depends on: Discogs import]
- **API for third-party integrations** — Public API for custom tools (Impact: Low, Effort: High)

### Discovery & Recommendations
- **Album recommendations** — Suggest new albums based on collection and plays (Impact: High, Effort: High)
- **Similar albums** — Find records similar to ones you own (Impact: Medium, Effort: High)
- **New release alerts** — Notifications for artists in your collection (Impact: Medium, Effort: Medium)
- **Trending in community** — See popular albums across all Side A users (Impact: Low, Effort: Medium)
- **Record store finder/map** — Discover local record shops (Impact: Low, Effort: Medium)

### Collection Features
- **Multiple personal collections** — Organize by genre, format, etc. (Impact: Medium, Effort: Medium)
- **Shelving visualization** — Virtual shelf view with album spines (Impact: Low, Effort: High)
- **Print collection catalog** — Generate PDF catalog for insurance/display (Impact: Low, Effort: Medium)

### Mobile & UX Enhancements
- **Dark mode** — Dark color scheme option (Impact: Medium, Effort: Low)
- **Accessibility improvements** — Screen reader support, keyboard nav, ARIA labels (Impact: High, Effort: Medium)
- **Offline mode** — View collection without internet (Impact: Medium, Effort: High)
- **Home screen widgets** — iOS/Android widgets for quick logging (Impact: Medium, Effort: Medium)
- **iOS Shortcuts / Siri** — Voice commands for logging plays (Impact: Low, Effort: High)
- **NFC tag integration** — Tap NFC stickers per album for instant logging (Impact: Low, Effort: High)

### Hardware & Advanced Integration
- **Sonos integration** — Detect and log actual playback from Sonos (Impact: Medium, Effort: High)
- **Turntable integration** — Auto-detect plays from smart turntables (Impact: Low, Effort: High)

## Completed
- [x] Social activity feed - Follow users, see listening activity, user profiles (PR #TBD)
- [x] PWA support - home screen installation (PR #24)
- [x] Mobile layout fixes for collection header (PR #23)
- [x] Show user names on play history (PR #22)
- [x] Collection stats page - listening habits per user (PR #22)
- [x] MusicBrainz approval step (PR #17)
- [x] Image reprocessing with approval (PR #18)
- [x] Replace image button (PR #19)
- [x] Track list management - clear + editable search (PR #20)
- [x] CI fixes and coverage reporting (PR #21)
- [x] "Log Play" button text clarity (PR #21)
- [x] Shared collections with invite flow (PR #3)
- [x] Collection switcher UI (PR #7)
- [x] Collection rename (PR #9)
- [x] Member email display (PR #11)
