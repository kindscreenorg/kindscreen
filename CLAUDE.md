# KindScreen — Claude Code Rules

## Prime Directive
You are building KindScreen — a parent-curated catalog of safe YouTube videos for kids.
Always read SPEC.md before making any architectural or product decision.
If anything in the spec is ambiguous, **ask before assuming**.

## Non-Negotiable Rules
- Supabase RLS on **every single table**, no exceptions, from the very first migration
- **No secrets in code, ever** — all API keys in environment variables only
- Never expose Supabase service role key to the client
- `.env.local` is always gitignored — never committed
- Build **one section at a time** — confirm with Felipe before moving to the next
- When in doubt about content safety decisions, **always be more conservative**

## Code Standards
- TypeScript everywhere — no plain JS
- Use Supabase Auth for all authentication — do not build custom auth
- All database access through Supabase client with RLS enforced
- API routes in Next.js `/app/api` — never call Supabase service role from client
- Tailwind for all styling — no CSS modules, no styled-components
- Mobile first — parents use phones

## Build Order
Follow this sequence strictly, one at a time:
1. Project scaffold (Next.js, Tailwind, folder structure, .env.example, .gitignore)
2. Supabase schema (all tables, RLS policies, migrations)
3. Auth flow (reviewer signup, email verification, login)
4. Catalog browsing page (anonymous, kid-friendly UI, embedded player)
5. Video submission flow (reviewer submits YouTube URL)
6. Review flow (5-question review screen)
7. Reviewer dashboard (queue, stats, badges)
8. Moderation tools (flag system, moderator override)
9. Donation milestone page (public stats, progress bars)
10. README + CONTRIBUTING.md

## Security Checklist (run before every commit)
- [ ] No API keys or secrets in any file
- [ ] RLS enabled on all new tables
- [ ] No service role key used client-side
- [ ] .env.local in .gitignore
- [ ] New API routes have auth checks

## When You Are Unsure
Stop. Ask Felipe. Do not guess on anything that touches:
- Security or permissions
- Content safety logic
- Database schema changes
- Anything that affects the reviewer trust model
