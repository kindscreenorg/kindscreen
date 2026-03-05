# Contributing to KindScreen

Thank you for wanting to help. KindScreen exists because parents like you give their time to keep it safe.

There are two ways to contribute: as a **parent reviewer** or as a **developer**.

---

## As a parent reviewer

The most valuable contribution you can make is reviewing videos. Every review brings a video one step closer to the catalog — or keeps something harmful out of it.

**How to start:**
1. Create an account at kindscreen.org/signup
2. Verify your email
3. Go to your reviewer dashboard and start reviewing

**What reviewing involves:**
- Watch the submitted video
- Answer 5 yes/no safety questions (violence, scary content, adult themes, bad language, age band)
- Choose Approve or Reject
- The whole process takes under 3 minutes per video

**Review guidelines:**
- Watch the full video, or enough of it to be confident in your verdict
- When in doubt, choose the more cautious option — reject or rate for an older age band
- You cannot review videos you submitted yourself
- You won't see other reviewers' verdicts until you've submitted your own (blind review)

---

## As a developer

### Getting started

Follow the local development setup in [README.md](./README.md).

### Project structure

```
src/
├── app/
│   ├── (public)/        # Anonymous-accessible pages (browse, donate)
│   ├── (auth)/          # Login, signup, password reset
│   ├── (reviewer)/      # Authenticated reviewer area
│   ├── (moderator)/     # Moderator-only area
│   └── api/             # API route handlers
├── lib/
│   └── supabase/
│       ├── client.ts    # Browser client (anon key)
│       ├── server.ts    # Server client (anon key + cookies)
│       └── admin.ts     # Admin client (service role — server only)
├── types/
│   └── database.ts      # Auto-generated Supabase types
supabase/
├── migrations/          # Ordered SQL migration files
└── seed.sql             # Local dev seed data
```

### Code standards

- **TypeScript everywhere** — no plain JS files (`allowJs: false`)
- **Tailwind for all styling** — no CSS modules, no styled-components
- **Mobile first** — parents use phones
- **No secrets in code** — all API keys in environment variables only
- **Supabase RLS on every table** — no exceptions
- **Never use the service role key client-side** — `admin.ts` is server-only

### Before opening a pull request

Run these and make sure all pass with zero errors:

```bash
npm run type-check
npm run lint
npm run test:coverage
```

The project maintains 100% test coverage — new code needs tests.

Check the security checklist:
- [ ] No API keys or secrets in any file
- [ ] RLS enabled on any new tables
- [ ] No service role key used client-side
- [ ] `.env.local` is in `.gitignore`
- [ ] New API routes have auth checks where required

### Database migrations

If your change requires a schema update:

1. Create a new migration file in `supabase/migrations/` following the naming convention: `20240101000010_describe_change.sql`
2. Include RLS policies for any new tables
3. Regenerate types: `npx supabase gen types typescript --local > src/types/database.ts`
4. Update `supabase/seed.sql` if the seed data needs updating
5. Document the change in your PR description

**Never modify existing migration files** — always add a new one.

### Pull request process

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Run `npm run type-check` and `npm run lint` — both must pass
4. Open a PR with a clear description of what changed and why
5. For any change that touches security, permissions, or content safety logic — describe your reasoning carefully

PRs are reviewed by the maintainer. Small, focused PRs are merged faster than large ones.

### What makes a good first issue

Look for issues labelled `good first issue` on GitHub. Good candidates are:
- UI improvements on public pages
- Adding new video categories or age band labels
- Improving error messages
- Adding tests

### What to avoid without prior discussion

- Changes to the RLS policies
- Changes to the review scoring or approval logic
- Changes to the trust model (how trusted reviewers work)
- New external API dependencies

Open an issue first for anything in these areas — they touch the safety model and need careful thought.

---

## Security issues

**Please do not open a public GitHub issue for security vulnerabilities.**

Email security concerns to: `security@kindscreen.org`

Include:
- A description of the vulnerability
- Steps to reproduce
- Potential impact

We'll respond within 48 hours and credit you in the fix if you'd like.

---

## Code of conduct

KindScreen is built by parents for children. We hold ourselves to a simple standard: be the kind of person you'd want your kid to meet.

Treat contributors with respect. Disagreements about code are fine — personal attacks are not. Anyone who makes the community less welcoming will be removed.

---

Thank you for helping keep kids safe online.
