# 📺 KindScreen

**Parent-reviewed. Kid-approved.**

KindScreen is an open source, community-curated catalog of YouTube videos that are safe for children aged 3–12. Nothing enters the catalog unless real parents have watched it and approved it. No algorithm. No surprises. Just verified content.

---

## The story

YouTube Kids failed my kid.

I sat next to her while she watched what looked like a harmless cartoon, and within two minutes it turned into something I never would have chosen for her. YouTube's automated filters had let it through. That was the last time I trusted an algorithm with my child's screen time.

I looked for an alternative. Something community-driven, transparent, human-verified. It didn't exist. So I built it.

KindScreen's model is simple: **instead of trying to block bad content, only allow verified good content.** That's a fundamentally stronger safety guarantee than what any algorithm can offer. Every video in the catalog has been watched and approved by multiple real parents — not filtered by a machine.

— Felipe, founder

---

## How it works

1. **Browse** — anyone visits kindscreen.org and browses a clean catalog organized by age band and category. No account needed. Kids never leave KindScreen — videos play embedded on the site with YouTube's recommendation engine disabled.

2. **Submit** — registered reviewers submit YouTube URLs for consideration.

3. **Review** — other reviewers (who didn't submit the video) watch it and answer five safety questions. A video needs **3 independent approvals** to enter the catalog — no single person can whitelist anything alone.

4. **Flag** — any visitor can flag an approved video. Three flags triggers moderator review. Moderators can remove videos instantly.

---

## Safety model

| Who | What they can do |
|---|---|
| **Anonymous visitor** | Browse catalog, watch videos, flag content |
| **Reviewer** | Submit videos, review others' submissions |
| **Trusted Reviewer** | Same as reviewer — their approval counts as 1.5 votes |
| **Moderator** | Override decisions, remove/restore any video directly, manage reviewers |
| **Admin** | Full access |

**Approval rules:**
- 3 independent reviewer approvals → video enters catalog
- 2 trusted reviewer approvals → video enters catalog
- 3 flags on an approved video → suspended for moderator review
- Moderators can reject any approved video directly via the All Videos page (`/moderator/videos`)

Reviewers never see each other's verdicts until they've submitted their own — blind review prevents groupthink.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend + API | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v3 |
| Database + Auth | Supabase (PostgreSQL + RLS + Auth) |
| Hosting | Vercel |
| Video metadata | YouTube Data API v3 |

---

## Donation milestones

KindScreen runs on community support. All funding is handled via [GitHub Sponsors](https://github.com/sponsors/felipeamarante) and is fully transparent.

| Milestone | What it unlocks |
|---|---|
| 🎯 €0/mo — **Launched** | Human-only parent review (live now) |
| 🎯 €200/mo | Whisper audio transcription — pre-screens videos for bad language before human review |
| 🎯 €500/mo | AI frame analysis — vision model inspects frames for violence and adult content |

Humans always make the final call. AI is a filter and assistant, never a judge.

---

## Local development

### Prerequisites

- Node.js 18+
- [Supabase CLI](https://supabase.com/docs/guides/cli)
- A YouTube Data API v3 key ([Google Cloud Console](https://console.cloud.google.com/))

### Setup

```bash
# 1. Clone and install
git clone https://github.com/kindscreenorg/kindscreen.git
cd kindscreen
npm install

# 2. Configure environment
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, and YOUTUBE_API_KEY

# 3. Start local Supabase (applies all migrations + seed data)
npx supabase start
npx supabase db reset

# 4. Start the dev server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### Seed accounts

| Email | Password | Role |
|---|---|---|
| `admin@kindscreen.dev` | `Password123!` | Admin + moderator |
| `trusted@kindscreen.dev` | `Password123!` | Trusted reviewer |
| `reviewer@kindscreen.dev` | `Password123!` | Reviewer |

### Useful commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run type-check   # TypeScript — must be zero errors
npm run lint         # ESLint — must be zero warnings
npm run test:coverage  # Tests — must pass with 100% coverage
npx supabase db reset              # Reset local DB + re-seed
npx supabase gen types typescript --local > src/types/database.ts  # Regenerate types after schema changes
```

---

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide — whether you want to contribute as a parent reviewer or as a developer.

---

## Principles

- **Safety first** — when in doubt, a video is rated for an older band or rejected. We'd rather disappoint a 6-year-old than expose a 4-year-old to something harmful.
- **No VC. No ads. No tracking.** KindScreen is funded by the community it serves.
- **Built in public** — every decision, every line of code, every expense is open.
- **Humans in the loop** — AI assists, parents decide.

---

## License

MIT — see [LICENSE](./LICENSE).

---

*"YouTube Kids failed my kid. So a group of parents built something better."*
