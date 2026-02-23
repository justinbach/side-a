# Side A

A vinyl record collection tracker for music lovers who want to catalog their collection, log listening sessions, and share with friends.

## Features

### 🎵 Smart Album Recognition
Upload a photo of your album cover or vinyl label and Side A automatically identifies it using Claude AI vision and MusicBrainz metadata. Get complete track listings, release dates, label info, and album art with minimal effort. Works on iconic covers even when text is obscured.

### ▶️ Play Logging
One-tap play logging captures your listening sessions with timestamps and optional mood tags (`Morning`, `Cocktail Hour`, `Dinner`, `Late Night`, `Background`, `Weekend`). Tapping Play means "I'm listening right now" — plays under 30 minutes old are treated as active sessions.

### 🔴 Now Playing
See who's listening in real time. A live "Listening Now" strip on the activity feed shows friends with active plays, updating instantly via Supabase Realtime. Record detail pages show how many people are currently listening to that album. Your own "Now Spinning" banner appears on your home screen and browse screen.

### 👍 Play Reactions
React to friends' plays with emoji (❤️ 🔥 👏 🎵). Reactions appear on feed cards and update optimistically.

### ⭐ Notes & Ratings
Add personal star ratings (1–5) and notes to any album in your collection. Lightweight and optional.

### 👥 Shared Collections
Create collections and invite friends or family by email. Everyone sees the same albums and can log their own plays. Perfect for households or shared record libraries.

### 🌐 Social Activity Feed
Follow other collectors (one-way, like Twitter) and see their plays in a Venmo-style activity feed. Also shows plays from people in your shared collections. Privacy is opt-out — users can disable activity sharing from their profile settings.

### 📈 Listening Stats
Per-user listening stats with interactive drill-down. Tap **Total Plays**, **This Week**, or **This Month** to re-scope Most Played and Favorite Moods to that window, plus a chronological play log so the numbers are fully verifiable.

### 🔗 Cross-Collection Stats
When a record has a MusicBrainz ID (MBID), Side A links it to the same album in other collections and shows aggregate play counts across all of them.

### 📱 Progressive Web App
Install Side A to your home screen for a native app experience. Includes pull-to-refresh, safe area handling for iOS notches, native share, and an "Update available" banner when a new version deploys.

---

## Tech Stack

```
side-a/
├── frontend/     Next.js (React) — hosted on Vercel
├── backend/      Node.js + Express — hosted on Render
├── supabase/     Database migrations
└── scripts/      Build and utility scripts
```

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 (App Router, React Server Components) |
| Styling | Tailwind CSS |
| Backend | Node.js + Express |
| Database | Supabase PostgreSQL with Row Level Security |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Realtime | Supabase Realtime (postgres_changes) |
| Image Recognition | Claude API (vision) + MusicBrainz API |
| File Storage | Supabase Storage |
| Frontend Hosting | Vercel |
| Backend Hosting | Render |

---

## Data Model

```
collections         records              plays
───────────         ───────              ─────
id                  id                   id
name                collection_id →      record_id →
owner_id →          title                user_id →
created_at          artist               played_at
                    cover_image_url      mood
collection_members  metadata (jsonb)
──────────────────  mbid                 play_reactions
id                  created_at           ──────────────
collection_id →                          id
user_id →           notes                play_id →
role                ─────                user_id →
created_at          id                   emoji
                    record_id →          created_at
profiles            user_id →
────────            star_rating          follows
id                  text                 ───────
display_name        updated_at           id
email                                    follower_id →
share_activity      invitations          following_id →
created_at          ───────────          created_at
                    id
                    collection_id →
                    email
                    invited_by →
                    accepted_at
```

**Security:** All tables use Supabase Row Level Security. Collection data is only accessible to members. Play visibility extends to followed users and shared collection members (respecting the `share_activity` privacy flag).

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase account (free tier works)
- An Anthropic API key (for album recognition)

### Local Development

1. **Clone and install**
   ```bash
   git clone https://github.com/justinbach/side-a.git
   cd side-a
   npm install
   ```

2. **Start Supabase locally**
   ```bash
   npx supabase start
   npx supabase db push   # applies all migrations
   ```

3. **Configure environment variables**

   `backend/.env`:
   ```env
   PORT=3001
   FRONTEND_URL=http://localhost:3000
   SUPABASE_URL=http://127.0.0.1:54321
   SUPABASE_ANON_KEY=<from supabase status>
   SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
   ANTHROPIC_API_KEY=your_anthropic_api_key
   ```

   `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<from supabase status>
   SUPABASE_SERVICE_ROLE_KEY=<from supabase status>
   NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
   ```

4. **Run the dev servers**
   ```bash
   # Terminal 1
   cd backend && npm run dev

   # Terminal 2
   cd frontend && npm run dev
   ```

5. Open `http://localhost:3000`

### Deployment

| Service | Config |
|---|---|
| Vercel (frontend) | Root directory: `frontend/` |
| Render (backend) | Root directory: `backend/`, build: `npm install`, start: `npm start` |
| Supabase (DB) | Run `npx supabase db push` to apply migrations to production |

All services auto-deploy on push to `main`.

---

## Design

Side A uses a **mid-century modern / warm minimal** aesthetic:

- **Colors:** Cream (`#FAF7F2`), warm white, burnt orange (`#CC5500`) accent
- **Typography:** Playfair Display (serif headings) + Inter (body)
- **Feel:** Coffee table book meets vintage hi-fi shop

The Play button is the signature interaction — burnt orange, slightly oversized, satisfying to tap.

---

## Acknowledgments

- Album metadata via [MusicBrainz](https://musicbrainz.org/)
- AI-powered recognition via [Anthropic Claude](https://www.anthropic.com/claude)
- Built with [Next.js](https://nextjs.org/), [Supabase](https://supabase.com/), and [Vercel](https://vercel.com/)
