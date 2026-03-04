# KindScreen — Project Kickoff Prompt for Claude Opus 4.6

---

You are the lead architect and product thinker for **KindScreen** (kindscreen.org), an open source community platform that provides a **curated catalog of YouTube videos safe for children aged 3–12**.

## The Problem

YouTube Kids has repeatedly failed parents — inappropriate, violent, and adult content slips through its automated filters. Parents have no reliable alternative that is community-driven, transparent, and human-verified. KindScreen solves this.

## The Core Idea

KindScreen is a **parent-curated whitelist** of YouTube videos. Nothing enters the catalog unless real parents reviewed and approved it. Kids browse and watch exclusively from this whitelist, embedded directly on the KindScreen website — with YouTube's recommendation engine completely disabled. No algorithm. No surprises. Just safe, verified content.

The philosophy is: **instead of blocking bad content, only allow verified good content.** That's a fundamentally stronger safety model than what YouTube does.

---

## Product Vision

### The Browsing Experience
- Parents and kids visit kindscreen.org
- They browse a clean, warm, kid-friendly catalog organized by age band (3–5, 6–9, 10–12) and category (nature, science, stories, music, animation, etc.)
- They click a video and it plays **embedded on KindScreen** using YouTube's iframe embed with `rel=0`, `modestbranding=1` — YouTube is purely used as a CDN, kids never leave KindScreen
- At end of video, KindScreen shows the next whitelisted video — never YouTube's algorithm
- **Zero account required** for kids or parents to browse and watch
- Full GDPR/COPPA compliance by design — no tracking, no cookies for anonymous viewers

### The Review System
- Parents create accounts and become **volunteer reviewers**
- Anyone can submit a YouTube video or channel URL for review
- Reviewers watch submitted videos and answer a simple structured checklist:
  - Any violence (including cartoon)?
  - Any scary content?
  - Any adult themes?
  - Any inappropriate language?
  - Age band recommendation
  - Category tags
- A video requires **minimum 3 independent parent approvals** before entering the catalog
- No single person can whitelist alone — consensus is the trust layer
- Reviewers build reputation scores over time — agreement rate with other reviewers, volume reviewed, consistency

### Gamification & Sustainability
- Reviewer badges and milestones: "50 videos reviewed", "Trusted Reviewer", "Category Expert", "Pioneer" (early contributors)
- Leaderboard of top contributors this month
- Personal impact counter: *"Your reviews have protected 1,240 kids"*
- **Public donation milestone roadmap** — fully transparent, visible to everyone:
  - 🎯 €0 — Launch: human-only parent review
  - 🎯 €200/mo — Add Whisper audio transcription to pre-screen before human review
  - 🎯 €500/mo — Add AI frame analysis (vision model) layer

- Donors listed on supporters page, named credits
- Open Collective for transparent fund management

---

## Technical Architecture

### Phase 1 — Launch (Human Review Only)
**Stack:**
- Frontend + API: **Vercel** (Next.js, free tier)
- Database + Auth: **Supabase** (free tier)
- DNS + CDN + Email: **Cloudflare** (already configured)
- AI processing (Phase 2): **Hetzner VPS €10/mo** for yt-dlp + FFmpeg only
- Transcription (Phase 2): **Groq API** (managed Whisper)
- Vision analysis (Phase 2): **Anthropic API** (Claude Sonnet)

**Core data models:**
- `videos` — YouTube ID, title, thumbnail, category, age_band, status (pending/approved/rejected), approval_count
- `channels` — whitelisted YouTube channels
- `reviews` — reviewer_id, video_id, checklist answers, verdict, timestamp
- `reviewers` — account, reputation_score, badges, review_count

**Key flows:**
1. Submit video URL → fetch metadata from YouTube Data API v3 → create pending entry
2. Reviewer dashboard → watch video → submit structured review
3. 3 approvals → video status flips to approved → appears in catalog
4. Parent/kid browses catalog → clicks video → embedded player loads

### Phase 2 — AI-Assisted Review (at €500/mo donation milestone)
**Pipeline per video (~€0.03-0.05 total cost per video processed):**
- **yt-dlp** on a small Hetzner VPS (€10/mo) — downloads video temporarily
- **FFmpeg** — extracts ~10 frames (smart sampling: first 30s, last 30s, random middle segments) + audio strip
- **Groq API** — managed Whisper transcription, ~€0.001/minute of audio, fastest available
- **Anthropic API (Claude Sonnet)** — sends frames as images with structured safety prompt, returns scored analysis per frame
- **VPS immediately deletes video file** after extraction — no storage of video content ever
- Results stored in Supabase as a pre-screening report attached to the video entry

**Review experience with AI:**
- Reviewer sees AI pre-screening report before watching — confidence score, flagged moments with timestamps, transcript highlights
- High-confidence safe videos → fast-track review queue
- Flagged videos → detailed report shown to reviewer with specific concerns
- **Humans always make the final call** — AI is a filter and assistant, never a judge

**Estimated Phase 2 running cost:**
- Groq API: ~€2/mo at 500 videos
- Anthropic API: ~€10-15/mo at 500 videos
- Hetzner VPS: €10/mo
- Vercel + Supabase: free tier
- **Total: ~€25-30/mo** — well within the €500/mo donation milestone

---

## Design & Brand

- **Name:** KindScreen
- **Tagline:** *"Watched by parents. Safe for kids."* or *"Parent-reviewed. Kid-approved."*
- **Logo:** Soft pastel screen icon with heart — warm, not techy
- **Colors:** Soft pastels — pinks, peaches, warm whites. Nothing corporate or cold.
- **Tone:** Warm, trustworthy, community-driven. Feels like a group of caring parents, not a startup.
- **Target audience:** Parents of children aged 3–12, globally, English-first but multilingual eventually

---

## Open Source Strategy

- GitHub organization: github.com/kindscreen
- License: MIT
- README tells the origin story: *"YouTube Kids failed my kid. So a group of parents built something better."*
- Contributing guide for parent reviewers and developers
- Public roadmap tied to donation milestones
- No VC, no ads, no selling data — ever. Funded by the community it serves.

---

## Login & Permission Model

### Roles

**Anonymous Visitor** — kids and parents browsing and watching
- Full catalog access, no account required
- Can watch any whitelisted video embedded on KindScreen
- Can flag an approved video as inappropriate (no account needed, just a flag button)
- Zero tracking, zero cookies, zero friction

**Reviewer** — parent volunteer who has signed up
- Can submit YouTube video URLs for review
- Can review pending videos (cannot review own submissions)
- Sees personal stats, badges, impact counter
- Cannot see other reviewers' verdicts until they have submitted their own (blind review — prevents groupthink)

**Trusted Reviewer** — earned status after consistent high-quality reviews
- Unlocked automatically based on reputation score (review volume + agreement rate with consensus)
- Their approval counts as 1.5 votes
- Can fast-track obviously safe content

**Moderator** — small trusted inner circle
- Can override decisions
- Can remove approved videos that were flagged
- Can manage reviewer accounts
- Cannot access financial or admin settings

**Admin** — founder only
- Full access to everything

### Approval Rules
- A video requires **3 independent reviewer approvals** to enter the catalog
- OR **2 Trusted Reviewer approvals**
- Reviewers never see each other's verdicts until they submit their own
- Any visitor can flag an approved video — 3 flags triggers moderator review
- Only moderators and admin can remove an approved video

---

## Review UX — As Simple As Possible

A reviewer must be able to complete a full review in **under 3 minutes**. One screen, one video, five questions, one decision.

**The review screen:**
1. Video plays embedded at the top (full YouTube embed, reviewer watches it)
2. Below the video, five simple yes/no questions:
   - 👁️ Any violence? (including cartoon)
   - 😨 Any scary content?
   - 🔞 Any adult themes?
   - 🤬 Any bad language?
   - 👶 Age band: 3–5 / 6–9 / 10–12
3. One big **Approve** or **Reject** button
4. If Reject is chosen → one optional free-text field appears: *"What was the issue?"* — not required
5. Submit → immediately shown next video in queue

**No forms. No essays. No complexity.** The checklist answers feed catalog metadata automatically — age band and category tags are derived from reviewer consensus, not manual tagging.

**Reviewer dashboard** shows:
- Queue of videos pending review
- Personal stats (reviewed count, approval rate, reputation score)
- Badges earned
- Impact counter: *"Your reviews have protected X kids"*

---

## Security

KindScreen is open source — all code is public on GitHub. This is intentional and fine. However, secrets and security must be handled correctly from day one, no exceptions.

### Environment Variables — Non Negotiable
- **Never** commit secrets to the repo — ever
- All API keys and credentials live in environment variables only:
  - Supabase URL and anon key
  - Groq API key
  - Anthropic API key
  - Any other credentials
- Set up `.env.local` locally (gitignored) and Vercel environment variables in the dashboard
- Create a `.env.example` file with empty values as a template — this is safe to commit and helps contributors know what they need
- `.gitignore` must include `.env`, `.env.local`, `.env*.local` from the very first commit
- Enable GitHub secret scanning on the repo — free for public repos, alerts if a key is accidentally committed

### Supabase RLS — Critical
- Enable Row Level Security on **every single table** from day one
- No table should ever be publicly writable without authentication
- Scope permissions tightly by role:
  - Anonymous — read approved videos only
  - Reviewer — read review queue, write own reviews only
  - Moderator — write to moderation actions only
  - Admin — full access
- Never expose service role key to the client — server side only

### Review System Integrity
The review system is the primary attack surface — not the servers. A bad actor creating fake reviewer accounts to approve harmful content is the biggest real threat.

Mitigations:
- **Email verification required** before any reviewing — no throwaway accounts
- **New reviewer probation** — first 10 reviews are recorded but carry zero weight toward approval until reputation is established
- **Rate limiting** on account creation and video submission — Supabase Auth handles basics, add extra limits in API routes
- **Blind review** — reviewers never see other verdicts until they submit their own
- **3 independent approvals required** — one compromised account cannot approve anything alone
- **Flag system** — any visitor can flag approved content, 3 flags triggers immediate moderator review
- **Moderator override** — moderators can pull any video from the catalog instantly

### Frontend Security
- All API keys server side only — never in client-side code
- Vercel handles HTTPS and edge security automatically
- Cloudflare in front adds rate limiting, bot protection, and WAF for free
- No sensitive data ever sent to the client
- YouTube embed parameters locked — `rel=0`, `modestbranding=1` — no escape to YouTube's ecosystem

### What You Don't Need to Worry About
- Server hacking — Vercel and Supabase are managed, hardened platforms
- DDoS — Cloudflare + Vercel absorb this automatically
- Data breaches — minimal sensitive data stored, no payment data, no children's personal data ever

---



KindScreen takes a **safety-first, err on the side of caution** approach. When in doubt, a video is rated for an older band or rejected entirely. We would rather disappoint a 6 year old than expose a 4 year old to something harmful.

### The Disclaimer — Short Version
Shown on every video page and catalog view:

*"Age bands are suggested by real parents and are a guide, not a guarantee. Every child is different — you know yours best. KindScreen always tries to be as safe as possible, but no system is perfect. Watch with your kids when you can."*

### The Disclaimer — Full Version
Shown on the About/FAQ page and during reviewer onboarding:

**Subjectivity** — Age bands are based on consensus from volunteer parent reviewers, not official ratings bodies like PEGI, BBFC, or MPAA. What feels appropriate for a 7 year old varies by family, culture, and individual child. Our bands are a starting point, not a ruling.

**Cultural context** — KindScreen is a global community. Reviewers come from different countries and cultural backgrounds. A scene that feels mild in one culture may feel intense in another. We try to reflect a broad, inclusive standard that prioritises child safety above all.

**No guarantees** — KindScreen does its best to verify every video in the catalog through multiple independent parent reviews. However, we are a volunteer community, not a regulatory body. We cannot guarantee that every video is appropriate for every child. Parents remain the final authority on what their children watch.

**Our commitment** — When there is any doubt, KindScreen always chooses the safer option. We would rather over-protect than under-protect. A video that divides reviewers does not get approved — consensus is required, and the bar is always set by the most cautious reasonable opinion in the room.

**Legal** — KindScreen provides this catalog in good faith as a free community service. We accept no liability for content hosted on YouTube's platform. By using KindScreen you acknowledge that parental supervision remains your responsibility.

### Where It Appears
- **Every video page** — short version, below the embedded player
- **Catalog page** — short version in the footer
- **About/FAQ page** — full version with all four points
- **Reviewer onboarding** — full version, reviewers must acknowledge it before their first review
- **Homepage** — one line version woven into the hero copy naturally

---



KindScreen is built entirely in public. Every decision, every milestone, every failure is shared openly. This is core to the project's identity — not a marketing tactic.

**What building in public means for KindScreen:**
- **Weekly progress updates** on X/Twitter at @kindscreen — what was built, what broke, what was learned
- **Transparent finances** — every donation and every expense visible on Open Collective
- **Public roadmap** — GitHub issues and milestones are the single source of truth, no hidden backlog
- **Open architecture decisions** — major technical choices documented as GitHub Discussions, community can weigh in
- **Honest numbers** — catalog size, reviewer count, videos watched, donation totals all visible on a public stats page on kindscreen.org
- **Founder voice** — Felipe shares the personal story behind the project, why it matters, the struggles of building it solo

**Why this matters for KindScreen specifically:**
Parents need to trust this platform with their kids. Radical transparency is not optional — it's the foundation of that trust. A black box safety tool for children is a contradiction. Everything KindScreen does should be visible, auditable, and community-owned.

---

## What I Need From You

Given everything above, help me with the following in order of priority:

1. **Validate and stress-test this architecture** — what are the weakest points, what have I missed, what will break at scale?

2. **Design the complete data model** — all tables, relationships, indexes, and key queries for Phase 1

3. **Write the core Next.js project structure** — folder layout, key components, routing, with Supabase integration

4. **Build the video submission and review flow** — the full reviewer experience from submission to approval

5. **Write the catalog browsing page** — kid-friendly UI with embedded player, category filtering, age band selection, and "up next" from whitelist only

6. **Draft the GitHub README** — origin story, what it is, how to contribute, donation milestones, setup instructions

Be opinionated. Point out what won't work. Suggest better approaches where you see them. This needs to be built right from the start because parents are trusting it with their kids.
