# Side A — Project Context

A vinyl record collection tracker. Photo-based album recognition, play logging with mood tags, star ratings and notes, and shared collections across multiple users.

---

## Tech Stack

| Layer | Technology | Hosting |
|---|---|---|
| Frontend | Next.js (React) | Vercel (free tier) |
| Backend | Node.js / Express | Render (free tier) |
| Database + Auth | Supabase (PostgreSQL + RLS + Auth) | Supabase (free tier) |
| Image Recognition | Claude API (vision) → MusicBrainz API | API calls from backend |

**Monorepo structure:** `/frontend` (Next.js) and `/backend` (Express) in the same GitHub repo. Vercel and Render each point to their respective subdirectories.

**Environment variables** manage all keys: Supabase URL + anon key, Supabase service role key (backend only), Claude API key. MusicBrainz is keyless.

---

## Data Model

```
users                  — managed by Supabase Auth
collections            — a shared collection entity (name, owner_id, created_at)
collection_members     — links users to collections (collection_id, user_id, role: owner | member)
records                — album entries (collection_id, title, artist, cover_image_url, metadata JSON, created_at)
plays                  — play log (record_id, user_id, played_at, mood)
notes                  — per-record notes (record_id, user_id, star_rating 1–5, text, updated_at)
```

**Moods** are a fixed enum to start: `Morning`, `Cocktail Hour`, `Dinner`, `Late Night`, `Background`, `Weekend`. Can be extended later.

**RLS policies** enforce that only members of a collection can read or write its records, plays, and notes. The owner can manage membership (add/remove members).

---

## Image Recognition Flow

1. User uploads a photo of an album cover or vinyl label from the album detail / add-record screen.
2. Backend receives the image, sends it to the **Claude API (vision)** with a prompt asking it to extract the album title and artist name.
3. Backend takes the extracted title + artist and queries the **MusicBrainz API** (`https://musicbrainz.org/ws/2/`) to find a matching release. Returns track listing, label, year, genre, and other metadata.
4. Backend returns the full structured record to the frontend.
5. Frontend populates the add-record form with the results. User can edit any field before saving.
6. Show a clear loading state during steps 2–4 so the flow feels intentional, not broken.

---

## Key UX Principles

- **Play logging is one tap.** From an album's detail page, a single prominent Play button logs the play instantly with a timestamp. A mood tag picker appears after (or optionally inline), but it does *not* block the log. The play history on each album is a clean reverse-chronological list: *"Tonight, 9:42 PM — Cocktail Hour"*.
- **Album recognition should feel like magic.** Show a loading state after photo upload, then populate fields. Don't just silently fill them in — make it a moment.
- **Shared collections are simple to set up.** Owner invites by email. Invitee signs up or logs in. The shared collection appears in their app automatically. No complex onboarding.
- **Notes and ratings are lightweight.** Star rating (1–5) and an optional free-text note field per record. No pressure to fill them in.

---

## Visual Design Direction — Mid-Century Modern / Warm Minimal

**Color palette:**
- Base: cream, warm white, soft tan
- Primary accent: muted mustard or burnt orange
- Text/headers: dark walnut brown (not pure black)
- Secondary accent: sage or olive green

**Typography:**
- Body: clean sans-serif with character — Inter or DM Sans
- Headings / album titles: editorial serif — Playfair Display or DM Serif
- Strong contrast between the two creates a magazine-like feel

**Surfaces and layout:**
- Slightly warm whites, not cold grays
- Cards with very subtle shadows, not sharp or corporate
- Rounded corners, restrained — 6–8px radius
- Spacious layouts, generous whitespace
- Feels like a well-designed coffee table book or a vintage hi-fi shop, not a tech dashboard

**Icons:** Thin/outline style, not filled. Lighter and more editorial.

**The Play button:** This is the signature interaction. Slightly larger than surrounding elements, uses the burnt orange accent color. Should feel satisfying to tap — it's the most-used action in the app.

---

## Deployment

| Service | What it hosts | Free tier limits |
|---|---|---|
| Vercel | Next.js frontend | Unlimited deploys, 100GB bandwidth/month |
| Render | Express backend | 750 hrs/month (enough for one always-on service) |
| Supabase | PostgreSQL DB + Auth | 500MB storage, 50K auth users, 2 projects |

All three connect to the same GitHub repo. Vercel and Render auto-deploy on push to main.

---

## Build Order (Original Plan - ALL STEPS COMPLETE)

1. ✅ **Scaffold monorepo** — set up `/frontend` and `/backend`, configure Supabase project, wire up auth (sign up / log in / session management)
2. ✅ **Core CRUD** — add a record manually (title, artist, cover image upload), view collection as a grid/list, delete a record
3. ✅ **Photo recognition flow** — upload album photo → Claude vision → MusicBrainz → populate the add-record form
4. ✅ **Play logging** — Play button on album detail, mood tag picker, play history list
5. ✅ **Notes + star ratings** — star rating widget and notes field on album detail
6. ✅ **Shared collections** — invite flow (owner invites by email), collection membership, RLS policies enforcing access
7. ✅ **Polish** — responsive design at all breakpoints, loading/error states, empty states, general UX refinement

**All core features are now implemented.** See `/BACKLOG.md` for current work priorities and future ideas. Keep BACKLOG.md updated as work progresses.
