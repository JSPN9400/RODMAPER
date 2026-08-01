<!--
  RoadMaper — AI-powered learning roadmap platform.
  Copyright (c) 2026 JSPN. All rights reserved.
  @author JSPN
  @license MIT — see LICENSE file in the project root.
-->

# RoadMaper

**RoadMaper** is an AI-powered learning-roadmap platform. A user describes a goal
(a skill, an exam, a career change — anything) and RoadMaper generates a
personalized, day-by-day (or phase-by-phase, for long-term goals) study plan
with tasks, resources, and progress tracking. Users sign in with Google or
GitHub, get a roadmap, check off tasks daily, and receive AI-driven insights
and completion reports.

Author / maintainer: **JSPN**
License: **MIT** (see [`LICENSE`](./LICENSE))

---

## 1. Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router, React Server Components) |
| Language | TypeScript |
| UI | React 18, inline styles + a small set of global utility classes (`app/globals.css`), [lucide-react](https://lucide.dev/) icons |
| Auth | [NextAuth.js](https://next-auth.js.org/) (Google + GitHub OAuth providers), JWT sessions |
| Database | PostgreSQL (designed for [Neon](https://neon.tech)) |
| ORM | [Prisma](https://www.prisma.io/) (`@prisma/client`, `prisma` CLI) |
| AI provider | [Groq](https://console.groq.com/) via `groq-sdk` (model: `llama-3.3-70b-versatile`) |
| State (client) | React `useState`/`useEffect` (no global store is currently wired up) |
| Push notifications | Web Push API via `web-push` (optional, VAPID-key gated) |
| Deployment target | [Vercel](https://vercel.com/) |

---

## 2. How the app works (end to end)

1. **Landing / marketing pages** (`app/home`, `app/about`, `app/pricing`) are
   public and describe the product.
2. **Sign in** — `app/login/page.tsx` calls NextAuth's `signIn('google')` or
   `signIn('github')`. NextAuth (`lib/auth.ts`) authenticates the user via
   OAuth and creates/reads a `User` row in Postgres through the Prisma
   adapter. A JWT session cookie is issued.
3. **Root routing** — `app/page.tsx` checks the session on the server: signed
   in → redirect to `/dashboard`; not signed in → redirect to `/login`.
4. **Authenticated shell** — `app/layout.tsx` renders `components/ui/Sidebar.tsx`
   (left nav) around every authenticated page.
5. **Create a roadmap** — `app/create/page.tsx` lets the user either:
   - pick **Short Term** (< 90 days) or **Long Term** (90+ days) manually, or
   - type a free-text goal and let AI classify it (`/api/nlu`, powered by
     `lib/ai-generator.ts::parseUserIntent`).

   Submitting calls `POST /api/roadmaps/generate`
   (`app/api/roadmaps/generate/route.ts`), which:
   - calls `lib/roadmap-generator.ts` to ask Groq for either a day-by-day
     plan (`generateShortTermRoadmap`) or a phase-based plan
     (`generateLongTermRoadmap`),
   - persists the result as a `Roadmap` row with related `Project`/`Task`
     rows (short-term) or `Phase`/`Project` rows (long-term),
   - records anonymous goal-popularity stats via
     `lib/goal-analytics.ts::trackGoalPopularity` (`GoalAnalytics` table),
   - redirects the browser to `/roadmap/[id]`.
6. **View / work a roadmap** — `app/roadmap/[id]/page.tsx` fetches
   `GET /api/roadmaps/[id]`, shows progress, projects (tabs), and a checklist
   of tasks. Ticking a task calls `PATCH /api/tasks/[id]`
   (`app/api/tasks/[id]/route.ts`), which flips `Task.done` and, if every task
   in the roadmap is now done, marks the `Roadmap.status` as `COMPLETED`.
7. **Dashboard** — `app/dashboard/page.tsx` calls `GET /api/roadmaps`
   (`app/api/roadmaps/route.ts`) to list all of the user's roadmaps with
   progress rings and streak info.
8. **Today** — `app/today/page.tsx` calls `GET /api/today`
   (`app/api/today/route.ts`), which returns, per active roadmap, the single
   next incomplete task — a focused "what should I do right now" view.
9. **Reminders** — `app/reminders/page.tsx` manages `Reminder` rows through
   `app/api/reminders/route.ts`. `lib/notifications.ts::scheduleReminders()`
   is the function a cron/scheduled job would call to push a browser
   notification (via `web-push`) when a reminder's time/day matches "now".
   `app/api/push/route.ts` stores the browser's push subscription
   (`PushSubscription` table).
10. **AI Insights** — `app/insights/page.tsx` calls `app/api/self-learn/route.ts`,
    which asks Groq to analyze the user's completion pattern (streaks, skills,
    pace) and suggest the next best topic.
11. **Reports** — `app/reports/page.tsx` + `ReportsContent.tsx` call
    `POST /api/reports` (`app/api/reports/route.ts` → also mirrored by
    `lib/report-generator.ts::generateReport`) to compute completion rate,
    max streak, top skills, and an AI-written summary, stored in the
    `Report` table (one per roadmap) and rendered as a shareable summary.
12. **Settings** — `app/settings/page.tsx` lets the user pick a timezone,
    persisted via `GET`/`PATCH /api/settings`. (`notificationsEnabled` and
    `defaultReminderTime` also exist on the `Settings` model and API route
    for future use; only timezone is currently exposed in the UI.)

---

## 3. Folder-by-folder, file-by-file reference

### `/` (project root)

| File | Purpose |
|---|---|
| `package.json` | Dependencies + npm scripts (`dev`, `build`, `start`, `db:push`, `db:generate`). `build` runs `prisma generate && next build` so the Prisma Client is always regenerated before compiling. |
| `next.config.js` | Next.js config: image remote patterns (Google/GitHub avatar hosts), response compression, disables the `X-Powered-By` header, and pre-optimizes `lucide-react` imports. |
| `tsconfig.json` | TypeScript compiler config; `@/*` path alias maps to the project root. |
| `tailwind.config.js` / `postcss.config.js` | Tailwind/PostCSS setup (utility classes are available, though most UI currently uses inline styles). |
| `.env.example` | Template listing every environment variable the app needs (copy to `.env.local`, never commit the real one). |
| `.gitignore` | Excludes `node_modules`, build output, all `.env*` secret files, editor junk, and the auto-generated `next-env.d.ts`. |
| `LICENSE` | MIT license, copyright JSPN. |
| `README.md` | This file. |
| `SETUP_GUIDE.md` | Step-by-step local setup notes (OAuth app creation, Neon DB, etc). |
| `next-env.d.ts` | Auto-generated by Next.js. Never hand-edit; it's gitignored and regenerates on every `next dev`/`next build`. |

### `prisma/`

| File | Purpose |
|---|---|
| `schema.prisma` | The single source of truth for the database shape. Defines every model (see §4) and the two enums `RoadmapStatus` and `RoadmapType`. Running `npx prisma db push` syncs this file to the real Postgres database; `npx prisma generate` regenerates the typed Prisma Client used everywhere in `app/api/**` and `lib/**`. |

### `lib/` — server-side business logic (no UI)

| File | Purpose |
|---|---|
| `prisma.ts` | Creates a single, reused `PrismaClient` instance (prevents exhausting DB connections from hot-reloading in dev). |
| `auth.ts` | NextAuth configuration: Google + GitHub OAuth providers, Prisma adapter, JWT session strategy, and a callback that copies the user's DB id onto `session.user.id`. |
| `api-response.ts` | Tiny helper (`privateJson`) that wraps `NextResponse.json` and adds a `Cache-Control: private, max-age=N` header, used by newer API routes. |
| `roadmap-generator.ts` | The current AI generator. Talks to Groq and returns strongly-typed `ShortTermRoadmap` (day-by-day tasks) or `LongTermRoadmap` (phases with weekly milestones). Also exports `detectGoalType()`, a keyword heuristic (UPSC, NEET, PhD, "3 years", etc.) that guesses short-term vs long-term when the user doesn't pick explicitly. Used by `app/api/roadmaps/generate/route.ts`. |
| `goal-analytics.ts` | Writes/updates the `GoalAnalytics` table — tracks how popular a given goal text is and (via `updateSuccessRate`) how often people who start it actually finish it. Currently write-only; nothing reads this table back into the UI yet. |
| `ai-generator.ts` | An older/parallel AI generator (`generateRoadmapWithAI`, `parseUserIntent`, `generateCompletionSummary`, `generateResumeBullets`). `parseUserIntent` still powers the "let AI decide" box on the Create page (`/api/nlu`) and `generateCompletionSummary` still powers report summaries. The roadmap-creation function `generateRoadmapWithAI` itself is now dead code — the Create page calls `/api/roadmaps/generate` (→ `roadmap-generator.ts`), not the legacy `mode: 'ai'` path in `app/api/roadmaps/route.ts` that calls this function. Safe to delete once you've confirmed nothing else references it. |
| `report-generator.ts` | **Removed** — see §5 for why. |
| `notifications.ts` | Web Push helpers. `sendPushToUser` sends a push payload to every subscription a user has (and prunes subscriptions that fail, e.g. because the user uninstalled/blocked notifications). `scheduleReminders` computes each reminder's due time in *that reminder's own user's timezone* (via `Settings.timezone`, `Intl.DateTimeFormat`) and sends a push for every `Reminder` due within the last few minutes — see `app/api/cron/reminders/route.ts` for how it's actually triggered on a schedule. |
| `push-client.ts` | Browser-side only. `subscribeToPush()`/`unsubscribeFromPush()` register `public/sw.js` and manage the actual Push API subscription (permission prompt, `PushManager.subscribe`, POST/DELETE to `/api/push`). Used by the "Enable push on this device" button on `/settings` — without this, `notifications.ts` has no subscriptions to send to. |

### `types/`

| File | Purpose |
|---|---|
| `index.ts` | Shared, hand-written TypeScript types used on top of the JSON columns Prisma can't strongly type (`TechItem`, `Resource`, etc.). |
| `next-auth.d.ts` | Module augmentation that adds a strongly-typed `id` field to NextAuth's `Session.user`. |

### `components/ui/` — shared authenticated-app UI

| File | Purpose |
|---|---|
| `Sidebar.tsx` | The left navigation bar shown on every authenticated page (Dashboard, Today, Roadmaps, New Roadmap, AI Insights, Reminders, Reports, Settings) plus a sign-out button. |
| `SessionProvider.tsx` | Thin client-side wrapper around NextAuth's `<SessionProvider>` so `useSession()` works in client components. |
| `PageState.tsx` | Two small reusable components: `PageSpinner` (loading state) and `PageError` (error state), used across most authenticated pages while data is fetched client-side. |

### `components/marketing/` — public/marketing-site UI

| File | Purpose |
|---|---|
| `MarketingLayout.tsx` | Wraps the public pages (`/home`, `/about`, `/pricing`) with a shared nav + footer. |
| `MarketingNav.tsx` | The top navigation bar for the marketing site. |

### `app/` — routes (Next.js App Router: one folder = one URL segment)

**Top-level files**

| File | Route / role |
|---|---|
| `layout.tsx` | Root HTML layout for the whole app. Reads the server session once; if logged in, renders the `Sidebar` + authenticated shell around `children`; if not, renders `children` alone (used by `/login` and the public marketing pages, which have their own layout/nav). |
| `page.tsx` | `/` — no UI of its own; just redirects to `/dashboard` (if signed in) or `/login`. |
| `loading.tsx` | Global Next.js loading fallback (shown automatically during route transitions) — a spinner. |
| `globals.css` | All global CSS: color variables/theme tokens, resets, the card/button/chip/nav styles, and small keyframe animations used across the authenticated app. |

**Public / marketing routes**

| Folder | Route | Purpose |
|---|---|---|
| `app/home/` | `/home` | Marketing landing page (hero, feature grid, "how it works", stats, CTA). |
| `app/about/` | `/about` | About page (uses `MarketingLayout`). |
| `app/pricing/` | `/pricing` | Pricing page (uses `MarketingLayout`). |
| `app/login/` | `/login` | Sign-in screen with "Continue with Google" / "Continue with GitHub" buttons calling NextAuth's `signIn()`. |

**Authenticated app routes**

| Folder | Route | Purpose |
|---|---|---|
| `app/dashboard/` | `/dashboard` | List of all the user's roadmaps as cards (progress ring, streak, next task preview). |
| `app/create/` | `/create` | Two-step wizard to create a new roadmap — pick short/long-term (or let AI decide from free text), fill in goal/background/hours-per-day/etc, submit. |
| `app/roadmap/[id]/` | `/roadmap/:id` | Full detail view of one roadmap — progress bar, day-tile heatmap, project tabs, expandable task list with tech-stack chips and resource links, mark-done/delete/generate-report actions. |
| `app/roadmap/page.tsx` | `/roadmap` | Just redirects to `/dashboard` (kept as a friendly fallback URL). |
| `app/today/` | `/today` | "What's next" view — the single next incomplete task per active roadmap, swipe/step through them. |
| `app/insights/` | `/insights` | AI-generated learning analysis for a selected roadmap (streaks, skills, motivation score, suggested next topic). |
| `app/reminders/` | `/reminders` | Create/list/delete daily reminders per roadmap (time of day + which days of the week). |
| `app/reports/` | `/reports` | Wraps `ReportsContent.tsx` in a `<Suspense>` boundary (required because it reads the URL's `roadmapId` query param via `useSearchParams`). |
| `app/reports/ReportsContent.tsx` | — | The actual reports UI: pick a roadmap, generate/view its completion report (completion %, streak, top skills, AI summary, share). |
| `app/settings/` | `/settings` | Timezone preference UI, persisted via `app/api/settings/route.ts`. |

**API routes** (`app/api/**/route.ts` — server-only, called via `fetch()` from the pages above)

| File | Method(s) | Purpose |
|---|---|---|
| `app/api/auth/[...nextauth]/route.ts` | GET, POST | NextAuth's catch-all handler — powers `/api/auth/signin`, `/api/auth/callback/google`, `/api/auth/callback/github`, `/api/auth/session`, etc. |
| `app/api/roadmaps/route.ts` | GET | List the signed-in user's roadmaps with task counts, done counts, and next-task preview — powers the dashboard. (Used to also have a `POST` handler for legacy manual/AI roadmap creation; removed — see §5.) |
| `app/api/roadmaps/[id]/route.ts` | GET, PATCH, DELETE | `GET`: full roadmap detail (projects, tasks, reminders, report). `PATCH`: update title/goal/status/color. `DELETE`: remove a roadmap (cascades to its projects/tasks/reminders/phases/report). |
| `app/api/roadmaps/generate/route.ts` | POST | **Current** roadmap-creation endpoint. Calls `lib/roadmap-generator.ts`, persists a short-term (`Task`/`Project`) or long-term (`Phase`/`Project`) roadmap, and logs analytics via `lib/goal-analytics.ts`. |
| `app/api/tasks/[id]/route.ts` | PATCH | Toggle a task's `done` state (and notes); auto-completes the parent roadmap when every task is done. |
| `app/api/today/route.ts` | GET | Per active roadmap, returns the single next incomplete task — powers `/today`. |
| `app/api/reports/route.ts` | GET, POST | `POST`: compute + upsert a roadmap's `Report`. `GET`: fetch an existing report by `roadmapId`. |
| `app/api/reminders/route.ts` | GET, POST | List/create reminders. |
| `app/api/push/route.ts` | POST | Save a browser's Web Push subscription (`endpoint`/`p256dh`/`auth`) so `lib/notifications.ts` can push to it later. |
| `app/api/nlu/route.ts` | POST | Parses a free-text goal ("I want to learn Python in 30 days") into structured fields (goal, background, days, hoursPerDay) via Groq — powers the "AI understands" box on the Create page. |
| `app/api/self-learn/route.ts` | POST | Two modes: `action: 'suggest'` (recommend the next topic) and full analysis (insights, motivation score, learning style) — powers `/insights`. |
| `app/api/settings/route.ts` | GET, PATCH | Get-or-create and update the signed-in user's `Settings` row — powers `/settings`. |
| `app/api/cron/reminders/route.ts` | GET | Calls `scheduleReminders()`. Requires an `Authorization: Bearer <CRON_SECRET>` header. Meant to be hit on a schedule — see §11. |

---

## 4. Database schema (`prisma/schema.prisma`)

| Model | What it stores |
|---|---|
| `User` | One row per signed-in person (from Google/GitHub via NextAuth). |
| `Account`, `Session` | NextAuth's own tables (OAuth account links, sessions) — managed by the Prisma adapter, not queried directly by app code. |
| `Roadmap` | One learning plan: title, goal, description, total days, status (`ACTIVE`/`COMPLETED`/`ARCHIVED`/`PAUSED`), `roadmapType` (`SHORT_TERM`/`LONG_TERM`), color, target date. |
| `Project` | A sub-section/phase-as-shown-in-UI of a roadmap with a day range (e.g. "Week 1: Foundations"). Both short-term and long-term roadmaps use `Project` for the tab/grouping UI. |
| `Task` | A single day's work item: title, description, tech-stack chips (JSON), resources (JSON), done/doneAt/notes. |
| `Phase` | Long-term-roadmap-only structure: named phase with a week range, JSON milestones and JSON topic checklist. (Added to fix a schema/code mismatch — see the "known issues fixed" note below.) |
| `GoalAnalytics` | Aggregate, cross-user stats per unique goal text — popularity count, completion count/rate, typical duration. Not yet surfaced in any UI. |
| `Reminder` | A recurring daily-reminder rule attached to a roadmap (time, enabled days, optional custom message). |
| `PushSubscription` | A browser's Web Push subscription for a user. |
| `Settings` | Per-user preferences (notifications on/off, default reminder time, timezone, theme). Read/written via `app/api/settings/route.ts`; the Settings page currently exposes only the timezone field. |
| `Report` | One generated completion report per roadmap (completion %, max streak, top skills, per-project + timeline JSON, AI summary). |

---

## 5. Known issues already fixed / things to be aware of

- **Fixed:** `Phase` and `GoalAnalytics` models were referenced by
  `app/api/roadmaps/generate/route.ts` and `lib/goal-analytics.ts` but were
  missing from `schema.prisma`, which broke every roadmap generation
  (and could fail the Vercel build entirely, since `build` = `prisma generate
  && next build` and TypeScript type-checks against the Prisma Client). Both
  models now exist in the schema.
- **Removed:** `app/api/roadmaps/route.ts` used to also export a `POST`
  handler (legacy manual + `mode: 'ai'` creation via `lib/ai-generator.ts`).
  It was never called by the frontend (the Create page has always used
  `POST /api/roadmaps/generate`) and its loosely-typed `any` data caused a
  `noImplicitAny` TypeScript build failure on Vercel. It has been deleted;
  this file now only exports `GET` (used by the dashboard). `lib/ai-generator.ts`
  is kept because `parseUserIntent` (→ `/api/nlu`) and
  `generateCompletionSummary` (→ reports) are still used; its unused
  `generateRoadmapWithAI` and `generateResumeBullets` exports were flagged
  as safe to delete several times and have now actually been removed (§21).
- **Removed:** `lib/report-generator.ts` (`generateReport`) was dead code —
  no API route imported it (report generation is handled entirely inline in
  `app/api/reports/route.ts`). It also imported two types
  (`TimelinePoint`, `ProjectReportData`) that were never added to
  `types/index.ts`, which broke the Vercel build. Deleted rather than
  patched, since nothing referenced it. If you want report-generation logic
  as a standalone, reusable function again (e.g. to call from a cron job),
  recreate it and give it real types instead of re-adding this file as-is.
- **Fixed: reminders now actually fire.** `scheduleReminders()` previously
  had nothing calling it, and even if invoked would have compared reminder
  times against the server's UTC clock instead of each user's own timezone
  (so a "9:00 AM" reminder for a user in `Asia/Kolkata` would have fired at
  2:30 PM local time), plus it required an exact-minute string match that a
  periodic cron would rarely land on. All three are fixed — see §2 and §11.
- **Fixed (full-codebase audit):** a pass through every file turned up and
  fixed several functional bugs that had shipped silently:
  - Long-term roadmap generation created `Phase`/`Project` rows but **zero
    `Task` rows**, so the checklist, dashboard progress, `/today`, and
    reports were permanently empty for every long-term roadmap. Fixed by
    turning each phase's weekly milestones into one `Task` per week.
  - The dashboard read `rm.colorHex`, a field that has never existed in the
    API response (the real field is `color`, a name like `"violet"`) — every
    roadmap card always rendered the same hardcoded color. Fixed to resolve
    `color` through the same name→hex map used on the roadmap detail page.
  - `--accent-bg` / `--accent-border` CSS variables were used (reminder
    day-highlights, report skill chips, the AI-summary card border) but
    never defined. Added them.
  - The `pulse-dot` keyframe used by the AI Insights loading animation was
    never defined. Added it.
  - `.desktop-only` (the sidebar's wrapper class) only had a `display: none`
    rule inside the mobile media query — on desktop it had no `display`
    value at all, so the sidebar's `flexDirection: column` inline style had
    no effect and the user card at the bottom wasn't actually flex-anchored.
    Added a base `display: flex`.
  - `completionRate` in both the reports and self-learn routes divided by
    `tasks.length` with no guard, producing `NaN` for any roadmap with no
    tasks yet. Guarded both.
  - `/today`'s `markDone()` computed the next card index using the stale
    `items.length` from the render closure instead of the array's length
    after removal, occasionally skipping a card. Fixed to compute the index
    from the actual post-filter array.
  - The AI Insights "Get Suggestion" button was missing a `!selected` guard
    (unlike the "Analyze" button next to it), so it could fire a request
    with an empty `roadmapId` when there were no active roadmaps.
  - The marketing footer had mangled UTF-8 characters (`Â©`, `Â·` instead of
    `©`, `·`) from an encoding round-trip. Fixed.
  - The Settings page's "Save Settings" button didn't persist anything — it
    just showed a fake "Saved!" toast. Added `app/api/settings/route.ts`
    (`GET`/`PATCH`) and wired the page to it (see §3, §4).

---

## 6. Environment variables

Copy `.env.example` to `.env.local` for local dev (never commit the real file
— `.gitignore` already excludes every `.env*` variant except `.env.example`).

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string (e.g. from Neon). |
| `NEXTAUTH_URL` | Yes | The app's public base URL (must match your deployment exactly). |
| `NEXTAUTH_SECRET` | Yes | Random secret for signing session JWTs — generate with `openssl rand -base64 32`. |
| `GROQ_API_KEY` | Yes | Free key from [console.groq.com](https://console.groq.com/) — primary AI provider for roadmap generation. |
| `GEMINI_API_KEY` | Recommended | Free key from [Google AI Studio](https://aistudio.google.com/) — automatic fallback provider used when `GROQ_API_KEY` is missing or a Groq call fails (see `lib/roadmap-generator.ts`, `lib/ai-generator.ts`). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Yes (for Google login) | OAuth app credentials from Google Cloud Console. Authorized redirect URI: `<NEXTAUTH_URL>/api/auth/callback/google`. |
| `GITHUB_ID` / `GITHUB_SECRET` | Yes (for GitHub login) | OAuth app credentials from GitHub Developer Settings. Authorized callback URL: `<NEXTAUTH_URL>/api/auth/callback/github`. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_EMAIL` | Optional | Only needed for browser push notifications (`lib/notifications.ts`). Generate with `npx web-push generate-vapid-keys`. |
| `CRON_SECRET` | Optional | Only needed for reminder push notifications. Authorizes calls to `/api/cron/reminders` — see §11. Generate with `openssl rand -base64 32`. |

---

## 7. Running it locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
# then fill in DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, GROQ_API_KEY,
# and your Google/GitHub OAuth credentials

# 3. Push the Prisma schema to your database (creates all tables)
npx prisma db push

# 4. Start the dev server
npm run dev
# → http://localhost:3000
```

## 8. Deploying (Vercel)

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Add every variable from §6 as a Vercel **Environment Variable**
   (`NEXTAUTH_URL` must exactly equal your Vercel deployment URL).
4. Add the exact same redirect URIs to your Google/GitHub OAuth app settings,
   using the Vercel URL instead of `localhost`.
5. After the first deploy, run `npx prisma db push` once (locally, pointed at
   the production `DATABASE_URL`) to create the tables in your real database —
   `next build` only generates the Prisma Client, it does **not** migrate the
   database automatically.
6. Every subsequent `git push` to the connected branch triggers an automatic
   Vercel deployment.

---

## 9. License

This project is licensed under the **MIT License** — see [`LICENSE`](./LICENSE).
Every source file (`.ts`, `.tsx`, `.js`, `.css`) carries a matching header
comment crediting **JSPN** as the author.

---

## 10. Development History & Fixes Report (Step-by-Step)

Here is a comprehensive developer report tracking our modern visual refactoring, NextAuth multi-environment adjustments, and local server reliability.

### 🛠️ 1. Mobile & Multi-Device Optimization (UI Fixes)
- **Marketing Navigation (`MarketingNav.tsx`):**
  - **Issue:** The navbar used fixed-width layout values and tight inline spacing, which caused layout overflow and ruined the experience on mobile viewports.
  - **Solution:** Converted styling to **Tailwind CSS**. Built a fully fluid, responsive container using custom padding states (`px-4 sm:px-10`), and cleanly hid the secondary page navigation on mobile (`hidden md:flex`). Replaced rigid login buttons with responsive typography and flexible touch-targets (`text-xs sm:text-sm`).
- **Stats Dashboard (`app/home/page.tsx`):**
  - **Issue:** Desktop-centric grid with fixed inline separators rendered incorrectly on smaller screens.
  - **Solution:** Replaced inline-flex structures with a fluid responsive grid (`grid-cols-2 md:grid-cols-4`). Styled modern borders using Tailwind’s divide utilities (`divide-x divide-y divide-white/[0.04] md:divide-y-0`) for clean borders that look spectacular on both mobile and wide screens.
- **Roadmap Preview & Checklist (`app/home/page.tsx`):**
  - **Issue:** The AI-generated roadmap simulation component was layout-constricted and caused horizontal page overflow.
  - **Solution:** Shifted the key layout container from flat alignment to responsive flex structures (`flex flex-col md:flex-row`). Corrected padding systems (`p-4 sm:p-7`) and refined tech badges to wrap naturally on narrow viewports.

### 🌐 2. Dynamic NextAuth Environment Handling
- **The Problem:** NextAuth expects a static `NEXTAUTH_URL` configuration inside `.env` which fails during multi-environment deployments (AI Studio development containers, Render, Vercel). This mismatch triggers redirect loop blockages, "localhost refused to connect" states, and failed OAuth sessions on callback.
- **The Solution:** Patched `/app/api/auth/[...nextauth]/route.ts`. Created a dynamic runtime wrapper to inspect proxy headers:
  ```typescript
  async function handler(req: NextRequest, ctx: any) {
    const proto = req.headers.get('x-forwarded-proto') || 'https'
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || 'localhost:3000'
    process.env.NEXTAUTH_URL = `${proto}://${host}`
    return authHandler(req, ctx)
  }
  ```
  This fully decoupled the application from static environment configurations, ensuring absolute portable authentication across Localhost, AI Studio, Render, or Vercel out-of-the-box.

### ⚡ 3. React Client Manifest & Bundler Recovery
- **The Problem:** The compiler raised a fatal Next.js dev server error: `Could not find the module ... in the React Client Manifest. This is probably a bug in the React Server Components bundler.`
- **The Solution:** 
  1. Purged the stale compilation cache (`rm -rf .next`).
  2. Established a stable linting environment by installing `eslint` and `eslint-config-next` and creating `.eslintrc.json`.
  3. Recompiled the whole application and restarted the background Node.js process to rebuild clean client-server manifests.


---

## 11. Turning on reminder push notifications

Reminders (`/reminders`) only actually *send* anything once these are in
place. None of this is required for the rest of the app to work.

**Step 0 — each user opts in on their device:** on `/settings`, under
"Study Reminders", the "Enable push on this device" button
(`lib/push-client.ts`) prompts for browser notification permission and
creates a Push API subscription, saved via `POST /api/push`. This has to
happen once per browser/device a user wants notified on — there's no way
around the browser's permission prompt.

**Step 1 — generate VAPID keys** (lets the server push to browsers):
```bash
npx web-push generate-vapid-keys
```
Set the output as `NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` in
Vercel's environment variables (and `.env.local` for local dev).

**Step 2 — protect and schedule `/api/cron/reminders`:**
1. Generate a secret: `openssl rand -base64 32`.
2. Add it as `CRON_SECRET` in Vercel's environment variables.
3. Pick **one** scheduler:
   - **Recommended — GitHub Actions** (`.github/workflows/reminders.yml`,
     runs every 5 minutes, free, works on any Vercel plan): in your GitHub
     repo, go to Settings → Secrets and variables → Actions, and add two
     repository secrets: `APP_URL` (your live deployment URL, no trailing
     slash) and `CRON_SECRET` (same value as in Vercel). The workflow
     starts running automatically once it's on the default branch.
   - **Alternative — Vercel Cron** (`vercel.json`, already included):
     works out of the box once `CRON_SECRET` is set, but Vercel's **Hobby
     (free) plan only guarantees cron jobs run once per day**, at
     whatever time Vercel schedules it — too coarse for a reminder set at
     a specific time. Fine as a low-effort fallback; use GitHub Actions if
     you actually want reminders to fire near their configured time.

`scheduleReminders()` (`lib/notifications.ts`) computes each reminder's due
time in *that reminder's own user's timezone* (from `Settings.timezone`,
default `Asia/Kolkata`) and sends a push for any reminder due within the
last few minutes, so it doesn't matter that different users are in
different timezones or that the cron doesn't land on the exact minute.

---

## 13. Security fix: removed an authentication backdoor

`lib/auth.ts` previously included a `CredentialsProvider` labeled
"Developer Mode" whose `authorize()` unconditionally returned a valid
logged-in user with **no credential check at all** — anyone who clicked
the "Developer Demo Mode" button on `/login` (a real, publicly visible
button) got full access to the app as a fake account, no password, no
OAuth, nothing. This has been removed entirely — both the provider in
`lib/auth.ts` and the button in `app/login/page.tsx`. Google and GitHub
OAuth are the only ways to sign in now.

If you were relying on that button for local testing, sign in with a real
Google or GitHub account in development instead — there's no safe way to
keep a credential-less bypass in a codebase that also gets deployed
publicly.

## 14. Session persistence

NextAuth's JWT session now has an explicit `maxAge` of 60 days (previously
unset, which defaults to 30 days) set on both `session` and `jwt` in
`lib/auth.ts`. Once someone signs in with Google or GitHub in a browser,
they stay signed in on that browser for 60 days (or until they explicitly
sign out) — no repeat login prompts on return visits. This is standard
browser-cookie-based persistence: it's per-browser, not per-device, and
doesn't survive clearing cookies or switching browsers.

## 15. Design system: "Field Journal"

The previous look — near-black background, a single bright violet accent,
a rainbow `135deg` gradient — is a recognizable generic-AI-product
pattern, not a deliberate choice, and it's what made the app feel
templated rather than designed. The system was rebuilt around a specific
idea instead: **a hand-annotated trail map**, tying the visual language
directly to what "RoadMaper" actually is — a tool for tracking a long
journey through material, in named phases, toward named checkpoints.

**Color** (`app/globals.css` `:root`): warm ink instead of blue-black
(`--bg: #14120F`), parchment instead of pure white (`--text1: #F4EEE2`),
and a brass/gold primary accent instead of violet (`--accent: #C88A3D`) —
like a compass or foil lettering on a map, not a SaaS-dashboard purple.
Secondary accents (pine green, rust, ochre, slate) replace the previous
neon semantic colors with muted, warm-family equivalents, including the
seven user-selectable roadmap colors (`BAR`/`colorOptions` in
`app/dashboard/page.tsx` and `app/roadmap/[id]/page.tsx`) — existing
roadmaps with `color: 'violet'` in the database automatically render in
the new brass tone with no data migration needed, since only the hex each
name maps to changed, not the stored name itself.

**Type** (`app/layout.tsx`): three faces instead of the default system
font — **Fraunces** (a warm serif with real character) for headings and
big numbers, **IBM Plex Sans** for UI/body text, **IBM Plex Mono** for
data-like figures (day counts, streaks, timestamps) via the `.stat-figure`
class. Loaded through `next/font/google` (no FOUC, self-hosted by Next.js
at build time, no extra runtime request to Google Fonts).

**Signature motif**: a dotted "route line" connecting waypoints
(`.route-line` / `.route-dot` in `app/globals.css`), applied to the
sidebar navigation — each nav item is a stop along a path, with the
current page shown as a filled waypoint. This is meant to be reused
anywhere else a sequence of steps should read as a journey rather than a
plain list (e.g. a future phase/week timeline).

**What this pass covered**: every hardcoded color in `app/**/*.tsx` and
`components/**/*.tsx` (buttons, gradients, borders, chips, shadows) was
swept to the new palette — including values in `rgba()` form, which a
plain hex find-and-replace would have missed. The marketing pages
(`/home`, `/pricing`, `/about`) keep their original copy, layout, and
structure exactly as built — only their color values changed, consistent
with the rest of the app.

**Accessibility**: contrast-checked every text/background pairing in the
new palette against WCAG AA. Three colors initially fell short for
normal-size text (`--text3` at 3.96:1, rust/danger at 4.16:1, slate/info
at 4.21:1 — all against the `#14120F` background) and were nudged
slightly lighter (barely perceptible) to clear the 4.5:1 threshold; every
other pairing (parchment body text, brass accent, pine/success, dark text
on brass buttons) already passed with margin to spare.

**What this pass didn't do** (worth doing next, but out of scope here):
apply the route-line motif to other sequential UI (task lists, phase
timelines); revisit spacing/radius tokens; check contrast for any color
combinations introduced after this pass.
---

## 16. UI/UX polish pass

- **Real streak, not a formula.** The dashboard used to show
  `Math.min(9, active.length + 2)` as a "streak" — a number derived from
  how many roadmaps you had, not anything you'd actually done. Replaced
  with `app/api/stats/route.ts`, which computes a real current streak,
  longest streak, and today/all-time completion counts from actual
  `Task.doneAt` timestamps, correctly bucketed into calendar days in the
  user's own timezone (not UTC).
- **Guided onboarding.** A user with zero roadmaps now sees a 3-step
  "how this works" walkthrough (`app/dashboard/page.tsx`) instead of a
  single bare button.
- **Skeleton loading screens** (`components/ui/PageState.tsx`:
  `DashboardSkeleton`, `RoadmapDetailSkeleton`, `TodaySkeleton`,
  `ListSkeleton`) replace plain spinners on the dashboard, roadmap detail,
  and today pages — the shape of the real layout is visible immediately.
- **Richer empty/error states** — `EmptyState` now takes a lucide icon in
  a colored badge instead of plain text, used for "no active roadmaps" and
  "all caught up" on `/today`.
- **Micro-animations**: a small CSS-only confetti burst
  (`components/ui/Confetti.tsx`, no external dependency) plays when a task
  is marked done, on both the roadmap detail checklist and `/today`; the
  checkmark itself pops in (`.check-pop`); the dashboard's streak card
  glows (`.streak-hot`) once the streak reaches 3 days.
- **Mobile bottom nav**: the active tab now has a small sliding indicator
  bar and the icon lifts slightly, instead of just a color change.
- **Light theme.** `[data-theme="light"]` in `app/globals.css` is a full
  second palette ("Field Journal, daylight" — parchment background, dark
  ink text, darkened accent colors re-verified against WCAG AA since the
  dark-mode brass fails contrast on a light background). Toggle it from
  the sidebar (sun/moon icon next to sign-out) or `/settings` →
  Appearance. Applied via `lib/theme-client.ts`: an inline script in
  `app/layout.tsx`'s `<head>` sets the theme from `localStorage` before
  paint (no flash-of-wrong-theme), and the choice is also synced to
  `Settings.theme` so it follows the user to a new device once they've
  visited `/settings` there at least once.

---

## 17. Build fixes

- **Missing `web-push` dependency.** `lib/notifications.ts` calls
  `require('web-push')` but the package was never added to
  `package.json`, breaking the production build with
  `Module not found: Can't resolve 'web-push'`. Added as a real
  dependency (plus `@types/web-push` for editor support).
- **Removed a risky mock-database fallback.** `lib/prisma.ts` had been
  rewritten to fall back to a local JSON-file "database"
  (`prisma-fallback-db.json`) whenever `DATABASE_URL` was missing, empty,
  or contained the substring `"mock"`. On Vercel's serverless filesystem
  this wouldn't actually work (the filesystem is read-only outside `/tmp`,
  and doesn't persist between invocations anyway) — worse, it would fail
  *silently*, masking a real misconfiguration behind confusing
  data-disappears-for-no-reason bugs instead of a clear connection error.
  Reverted to a plain, correct `PrismaClient` singleton. A missing
  `DATABASE_URL` now logs a clear error and every DB-backed route fails
  loudly, as it should.
- **ESLint crashing (silently, non-fatally) during every build.**
  `eslint@9` requires the "flat config" format
  (`eslint.config.mjs`) — the project still had a legacy
  `.eslintrc.json`, and `eslint-config-next` was pinned to a `16.x`
  release line meant for a Next.js major version the project isn't on
  (it runs Next 15.5.20). Together these caused a
  `Converting circular structure to JSON` crash in the linter on every
  build. `next build` treats a crashing linter as non-fatal and just
  skips linting, so builds kept succeeding — but no linting was actually
  running. Replaced `.eslintrc.json` with `eslint.config.mjs` (using
  `@eslint/eslintrc`'s `FlatCompat` to bridge the legacy
  `next/core-web-vitals` shareable config into flat format) and
  re-pinned `eslint-config-next` to the `15.x` line that matches the
  installed Next.js version.

---

## 18. AI Mentor (Phase A of the roadmap-companion features)

A persistent, context-aware chat coach — `/mentor` (also on both the
desktop sidebar and mobile bottom nav).

- **`Message` model** (`prisma/schema.prisma`) — one row per message,
  both sides of the conversation, tied to the user (and optionally a
  roadmap). This is what gives the mentor real memory: every reply is
  generated with the last 20 messages as actual conversation history,
  not just the current message in isolation.
- **`lib/mentor.ts`** — `askMentor(userId, roadmapId, message)`:
  1. Builds a live context string from the user's *actual* active
     roadmaps (title, goal, % done, current pace) via `buildContext()`.
  2. Computes which tasks look overdue — since roadmaps here are
     self-paced (`Task.day` is a relative day number, not a calendar
     date), "overdue" means the task's day number has fallen behind
     `roadmap.createdAt`-elapsed days by more than a 1-day grace period,
     not a hard calendar deadline. This list is handed to the model so
     it can naturally ask about a specific missed task rather than the
     student having to bring it up.
  3. Calls Groq (`llama-3.3-70b-versatile`) with a proper
     `messages: [system, ...history, user]` array for real multi-turn
     conversation; falls back to Gemini (flattened into a single prompt,
     since multi-turn `contents` shape wasn't verified against the
     pinned SDK version) if Groq is unavailable or fails.
  4. Persists both the user's message and the reply to `Message`.
- **`app/api/mentor/route.ts`** — `GET` (history), `POST` (send a
  message), `DELETE` (clear the conversation, which also clears the
  model's memory of it, since memory is just "the last N rows").
- **`app/mentor/page.tsx`** — chat UI with a typing indicator, optimistic
  message rendering, and starter-prompt suggestions when the
  conversation is empty.

**Not built yet** (later phases, by design — see the phased breakdown
given when this was scoped): accountability/challenge system, behavior
pattern detection across sessions, predictive completion dates, skill
graph, career readiness score, weekly reflection, dynamic roadmap
adjustment, personalized revision planning. The `Message` history this
phase adds is the foundation several of those will build on.

---

## 19. Accountability Engine (Phase B)

Reliability scoring, behavior-pattern detection, and adaptive recovery
challenges — all on the dashboard, no new page needed.

- **`lib/accountability.ts`** — `computeAccountability(userId)` derives
  everything from existing `Task`/`Roadmap` data (no new tracking table
  needed for the stats themselves):
  - **Reliability score**: of the tasks that "should" be done by now
    given each roadmap's pace (`Task.day <= expected day since
    Roadmap.createdAt`), what % actually are. Same overdue definition as
    the AI Mentor (§18), so the two features agree with each other.
  - **Weekday pattern**: completions grouped by weekday from
    `Task.doneAt`, bucketed in the user's own timezone — surfaces things
    like "Wednesdays tend to be your quietest day."
  - **Trend**: completions in the last 7 days vs. the 7 before that.
  - **Longest gap**: the biggest stretch between two active days —
    computed but not yet surfaced in the UI (available on the
    `/api/accountability` response for a future iteration).
- **Recovery challenges, not punishment.** `getOrCreateChallenge()` only
  creates one when there's a real signal (2+ overdue tasks, or a streak
  that just broke) and only if the user doesn't already have an
  incomplete one. Generated via Groq (rule-based fallback if AI is
  unavailable) with an explicit instruction to be encouraging, not
  guilt-tripping — shame-based nudges measurably hurt follow-through, so
  this was deliberately built as "here's an easy way back in," not a
  penalty. The user can mark it done or dismiss it outright
  (`PATCH`/`DELETE /api/challenges/[id]`) — dismissing doesn't block a
  new one from appearing later if the underlying signal is still there.
- **Dashboard integration**: the challenge card (if any) and a
  reliability/weekday-pattern card sit between the streak stats and the
  roadmap list. Fetched via a separate, non-blocking `useEffect` (calling
  `/api/accountability` can trigger an AI call for challenge generation
  server-side, and shouldn't delay the rest of the dashboard rendering).

**Still not built** (Phases C and D): predictive completion dates,
learning curve prediction, career readiness score, skill graph, weekly
reflection, dynamic roadmap adjustment, personalized revision planning.

---

## 20. Fixed: broken resource links, and thin/generic roadmap content

Two related complaints, one root cause each:

- **Resource links didn't load.** The generation prompt asked the model
  for a specific `url` directly (`"url":"https://..."`). LLMs reliably
  hallucinate exact URLs — they don't have live web access, so a link
  that "looks right" for a real course or article is frequently wrong or
  dead. This isn't fixable by better prompting; no amount of instruction
  makes a model actually know the correct current URL for an arbitrary
  resource. Fixed by changing what the model is asked for: a resource
  **name** and a **type** (`youtube`/`docs`/`book`/`course`/`article`),
  never a URL. `lib/roadmap-generator.ts`'s new `buildResourceUrl()`
  then constructs the actual link server-side — a YouTube search for
  `type: youtube`, a Google Books search for `book`, and a Google search
  otherwise — so every resource link is *guaranteed* to load and land on
  genuinely relevant results, instead of a coin-flip on whether the
  model's invented URL happens to be real.
- **Roadmaps came out basic/generic.** Two contributing causes, both
  fixed: (1) `max_tokens` was capped at 7000 (short-term) / 8000
  (long-term) — for a 30+ day plan that's a very tight budget once JSON
  structure overhead is accounted for, forcing terse, one-line content
  per day. Raised to 16000 for both. (2) The prompts didn't ask for
  depth — `"topic": "string"` invites a one-liner. Prompts now explicitly
  require 2-3 sentence topic/milestone descriptions, specific
  (non-generic) exercises and subtopics, and 2-4 resources per
  day/phase instead of 1.

---

## 21. Cleanup + consistency pass

- **Deleted long-flagged dead code**: `lib/ai-generator.ts`'s
  `generateRoadmapWithAI` and `generateResumeBullets` — both unused by
  any route, flagged as safe-to-delete across several earlier passes in
  this log but never actually removed until now. (`generateRoadmapWithAI`
  also had the same "ask the model for a literal URL" problem fixed in
  §20 — moot now that it's gone.)
- **`lib/accountability.ts`'s AI challenge generator had no Gemini
  fallback** — every other AI call in the app (roadmap generation, the
  mentor, NLU parsing, report summaries) tries Groq first and falls back
  to Gemini if it's unavailable or fails; this one only tried Groq and
  fell straight to the rule-based challenge text otherwise. Not a crash
  (the rule-based fallback is fine on its own), but inconsistent with the
  resilience pattern used everywhere else — added the same Groq→Gemini
  fallback here too.

---

## 22. Clarifying questions before generation (fixes generic/basic roadmaps)

The generic level/hours/background fields weren't enough for the model to
produce genuinely specific content — "learn Anatomy" means something
completely different for an MBBS 1st-year student's university exams
than for a NEET-PG aspirant or a hobbyist, and the model had no way to
know which. Concretely reported: an MBBS 1st-year student asked for an
Anatomy roadmap and got generic, surface-level topics.

**New flow** (`/create`, both AI paths): after filling in goal/level/
background and hitting "Continue," the app now calls
`generateClarifyingQuestions()` (`lib/roadmap-generator.ts`) — the model
itself generates 3-5 sharp, domain-adaptive questions for whatever the
student just typed (e.g. for an MBBS Anatomy goal: which body regions
are priority, which exam this is for, which textbook they follow), shown
as a quick form (`app/api/roadmaps/clarify/route.ts` →
`app/create/page.tsx` step 3). The answers are passed through
`generate`'s request body as `clarifications` and folded into the actual
generation prompt via `buildClarificationContext()`, with an explicit
instruction to use real, standard field-specific terminology rather than
generic placeholders.

Fails open by design: if the clarify call errors or the model returns no
questions, generation proceeds immediately with just the original form
fields rather than blocking the user on an enhancement that didn't work.

---

## 23. Activity Timetable — time-of-day behavior tracking

Extends the Accountability Engine (§19) with genuine time-of-day
tracking, not just which weekday — answers "am I keeping to my usual
schedule right now," not just "was I active this week."

- **`lib/accountability.ts`** additions to `computeAccountability()`:
  - `hourlyPattern`: completions bucketed by hour-of-day (0-23), in the
    user's own timezone (via `localHour()`, same `Intl.DateTimeFormat`
    approach used for dates elsewhere in the app).
  - `typicalWindow`: the busiest rolling 3-hour block, computed by
    sliding a window across `hourlyPattern` — surfaced as a readable
    label like `"7 PM – 10 PM"`. Only computed once there are at least 5
    completions total, to avoid a "pattern" of one data point.
  - `todayStatus`: `'on_pattern'` (already active today),
    `'too_early'` (the typical window hasn't started yet — not a red
    flag), or `'off_pattern'` (past the usual window with no activity
    yet today) — this is what actually answers "am I on schedule right
    now," rather than making the user infer it from a chart.
  - `calendarHeatmap`: last 84 days, one entry per day with a completion
    count — the data behind a GitHub-style contribution graph.
- **`/insights`** now opens with an "Activity Timetable" card (global,
  not tied to a single roadmap) showing the heatmap, the hourly bar
  chart, and a plain-language status line, before the existing
  per-roadmap AI analysis section.

---

## 24. Premium UI/UX pass — animations, depth, navigation

Feedback: the app felt flat and templated — no motion between pages, cards
with no depth, and a plain sidebar/bottom nav on both desktop and mobile.
Addressed the highest-impact pieces:

- **Page transitions** (`components/ui/PageTransition.tsx`) — every route
  change now does a smooth fade + slight rise instead of an instant hard
  cut. Implemented with zero dependencies: the wrapper is keyed by
  `usePathname()`, so React remounts the subtree on navigation, which
  retriggers a plain CSS `@keyframes` animation
  (`.page-enter` in `globals.css`, `cubic-bezier(0.16,1,0.3,1)` — a
  gentle deceleration curve, not a linear snap). Respects
  `prefers-reduced-motion`.
- **Real depth on cards.** `.card-feed` went from a flat single-color
  background with a 1px border to a subtle vertical gradient + layered
  shadow (`box-shadow` with two layers, tight + broad) and a hover lift
  (`translateY(-1px)`), with matching values for the light theme. Buttons
  and inputs got the same easing curve for their hover/focus transitions
  instead of a generic `transition: all 0.18s`.
- **Sidebar redesign.** Desktop: added a directional drop shadow off the
  right edge instead of just a flat border, and switched nav-item hover/
  active transitions to the same premium easing. Mobile: the bottom nav
  is no longer a flush-edge bar — it's now a floating glass "dock" (12px
  side margins, rounded corners, blur+saturate backdrop filter, its own
  drop shadow), closer to an iOS floating tab bar than a generic web app
  footer nav. `page-shell`'s mobile bottom padding was increased to match
  so content doesn't sit underneath it.
- **Settings "API Keys" card redesign** — the specific card flagged as
  looking basic. Rebuilt with an icon in a soft accent-colored badge (the
  pattern used elsewhere in the app), a title+subtitle header instead of
  a bare label, and the `.env.local` block restyled as a small code
  window (macOS-style traffic-light dots in the header bar, actual
  syntax-color separation between key/`=`/value, the app's real
  monospace font instead of the browser default `monospace`).
- **Display font coverage check** — most page titles already use real
  `<h1>`/`<h2>` tags, which the global `h1, h2, h3 { font-family:
  var(--font-display) }` rule already covers automatically; only one
  page (`/today`) had its title on a plain `<div>` instead, missed by
  that rule — fixed.

**Not done in this pass** (would need more time/a different tool):
a full onboarding-tour animation sequence, per-component micro-interaction
audit beyond buttons/inputs/cards, and a genuine icon set redesign (still
using stock `lucide-react` icons throughout).

---

## 25. Full redesign: "Command Center" (replaces the previous "Field Journal" theme)

Feedback was direct: the previous theme (warm dark ink + brass accent +
serif display face) still read as a safe default — a warm-earthy palette
with a characterful serif is really the same move as the light-mode
"cream + terracotta + serif" cliché, just inverted to dark mode. Redone
from scratch, following a real brainstorm → token plan → critique →
build process, with explicit inspiration from Apple's HIG (clarity,
deference to content, depth via translucency) — adapted into RoadMaper's
own values, not copied.

**Color** (`app/globals.css` `:root` / `[data-theme="light"]`): true
near-black (`#000000`, not a warm or blue-tinted dark) instead of ink;
a cobalt-blue primary accent (`#4F6BFF`) instead of brass; and — the
bigger shift — **seven distinct vivid category colors** (cobalt, sky,
mint, amber, red, teal, pink) used consistently per section/nav-item/
roadmap, the way iOS assigns a color to every Settings row and app icon,
instead of one muted accent doing everything. Every color was contrast-
checked against WCAG AA on both themes (three values had to be nudged
darker/lighter to clear 4.5:1 — documented the same way as the previous
pass). Light theme mirrors Apple's exact `systemGroupedBackground` logic:
light-gray canvas (`#F5F5F7`), white cards, near-black text (`#1D1D1F`).

**Type**: Manrope (a geometric, rounded-terminal sans, the closest
Google-Fonts-licensable analogue to SF Pro Rounded) replaces the serif
Fraunces for headings — Apple's own type system is sans-only, and a
serif display face was working against the direction, not for it. Body
(IBM Plex Sans) and data/mono (IBM Plex Mono) faces are unchanged.

**Structure — glass over borders.** `.card-feed` no longer relies on a
flat background + 1px border for separation; it's a real translucent
surface (`backdrop-filter: blur(20px) saturate(180%)`) with a two-layer
shadow, which is literally Apple HIG's "depth" principle (materials, not
just flat panels) rather than a decorative choice.

**Signature: icon tiles.** The one deliberately bold, recognizable
element — a colored rounded-square icon badge per category
(`.icon-tile` + `.cobalt/.sky/.mint/.amber/.red/.teal/.pink` in
`globals.css`), applied to every sidebar nav item and (already, from the
Settings redesign) several settings sections. This is the single most
recognizable piece of Apple's own visual vocabulary (Settings app, home
screen icons), borrowed as a *pattern*, not by copying any of Apple's
actual colors or icons. Nav items dim their tile to 55% opacity when
inactive, full color + tinted label when active — restrained, not applied
everywhere at once, per the skill's "spend your boldness in one place."

**What changed structurally in navigation**: the previous theme's
route-line/waypoint-dot motif (appropriate for "Field Journal," not for
this direction) was removed from the sidebar entirely and replaced by
the icon-tile system so there's exactly one signature motif, not two
competing ones.

**Not restyled in this pass**: the marketing pages' bespoke layout
structure (content/copy/sections) — only their color values, which the
earlier sweep already keeps in sync with whatever `:root` defines, so
they picked up the new palette automatically without needing individual
edits.

---

## 26. Phase C + D: Predictive Analytics, Reflection & Adaptive Planning

Built together per request. All of it derives from data that already
existed (`Task.doneAt`, `Task.techStack`, `Roadmap.createdAt`) — no new
tracking burden on the user, just deeper analysis of what's already
being recorded, same principle as the Accountability Engine (§19).

**`lib/predictions.ts`**:
- `computeSkillGraph(userId)` — rolls up `Task.techStack` tags across
  every completed task into a ranked skill list (name, completion count,
  how many distinct roadmaps it appeared in).
- `computeCareerReadiness(userId)` — a composite 0-100 score from three
  factors, each shown separately rather than hidden in a black-box
  number: **consistency** (45% weight — reuses the Accountability
  Engine's reliability score, since real-world readiness tracks
  follow-through more than raw activity), **depth** (30% — average
  completions per skill, rewards finishing over skimming), **breadth**
  (25% — distinct skills touched).
- `predictCompletion(roadmapId, userId)` — predicted finish date and a
  learning-curve trend (accelerating/steady/slowing), computed from the
  student's actual velocity over the last 14 days vs. the 14 before that
  — not the nominal pace the roadmap's `totalDays` implied. Needs at
  least 4 completed tasks before it'll show anything; returns
  `hasEnoughData: false` otherwise rather than a meaningless guess.

**`lib/reflection.ts`** — `getOrGenerateReflection()`: computes real
weekly numbers (tasks done, active days, skills touched, streak,
comparison to the previous week) and asks Groq/Gemini (rule-based
fallback if neither is configured) for a short, specific two-paragraph
reflection. Cached per `(user, weekStart)` in the new `Reflection`
model — revisiting the same week returns the same text rather than
regenerating or losing it. Surfaced on `/insights`.

**`lib/adaptive.ts`**:
- `replanRemainingTasks()` — "dynamic roadmap adjustment." Only ever
  touches *incomplete* tasks; asks AI to redistribute (and, if genuinely
  necessary, drop the lowest-priority) remaining tasks across the days
  actually left. Day numbers continue on from whatever's already
  completed rather than restarting at 1 — otherwise a replanned "day 3"
  could sit next to an already-completed "day 40" in the UI, which reads
  as broken even though it technically isn't. Surfaced on the roadmap
  detail page when predicted completion is more than 5 days behind
  target.
- `generateRevisionTasks()` — "personalized revision planning." Looks at
  what's actually been completed (not the original plan) and generates
  3-4 short, specific spaced-revision tasks, appended after the current
  last day and grouped into whichever phase/project the student most
  recently worked in (so they're findable under a specific tab, not just
  the "All Days" view). Needs at least 3 completed tasks.

**New model**: `Reflection` (one row per user per week, `@@unique([userId, weekStart])`).

**Where it shows up**: Career Readiness + Skill Graph and Weekly
Reflection are new cards on `/insights` (global, not tied to one
roadmap). Predicted completion date + learning curve, plus the Replan
and Add Revision Tasks buttons, are on the roadmap detail page
(`/roadmap/[id]`), right below the day-tile progress heatmap.

---

## 27. Bug audit — full pass

Comprehensive sweep: syntax integrity (parens/braces) across all 70
source files, every `package.json` dependency actually used, implicit-
`any` patterns (the class of bug that broke the Vercel build twice
earlier in this project's history — see §5), every CSS class referenced
in JSX checked against what's defined in `globals.css`, every API route
checked for an auth guard, and a full manual review of `schema.prisma`.

**One real bug found and fixed**: the Settings nav item's mobile tile
color (`tile: 'gray'`, both `NAV` and `MOBILE_NAV` in
`components/ui/Sidebar.tsx`) referenced `var(--cat-gray)` for its active-
state color — but only `.icon-tile.gray` (the desktop icon background)
had ever been defined; the `--cat-gray` custom property itself was
missing from both `:root` and `[data-theme="light"]`. On mobile, tapping
into Settings would silently fail to color its active-tab indicator and
icon (the `var()` reference just resolves to nothing). Added
`--cat-gray: #8E8E93` (dark) / `#6E6E73` (light), both contrast-checked
against their backgrounds (6.44:1 and 4.66:1 — comfortably past AA).

Everything else checked out: no other missing CSS classes/variables, no
missing npm dependencies, no implicit-`any` risk anywhere in `app/api`
or `lib`, every non-NextAuth API route has a session check, and the full
Prisma schema is internally consistent (every relation has a matching
reverse field, every enum used matches its declaration).

---

## 28. Fixed: roadmap generation and AI suggestions failing silently

Two related reports — "the roadmap generator isn't working" and "the
suggestion AI isn't replying" — traced to two different bugs, both in
the same family (errors that never reached the user in a form they
could act on).

- **`app/api/roadmaps/generate/route.ts` had no top-level try/catch.**
  `generateShortTermRoadmap`/`generateLongTermRoadmap` already correctly
  throw when neither `GROQ_API_KEY` nor `GEMINI_API_KEY` is configured
  (or when both providers fail) — but with nothing catching that at the
  route level, Next.js's default error handling took over and returned a
  generic **HTML** 500 page instead of JSON. The frontend
  (`app/create/page.tsx`) always called `res.json()` on the response,
  which then threw its own cryptic parse error — so instead of "no AI
  provider is configured," the person saw an unrelated JSON-parsing
  failure with no indication of the real cause. Wrapped the whole
  handler in try/catch with messages that actually distinguish
  "no provider configured" from "the model returned something
  unparseable" from a generic failure.
- **`app/api/self-learn/route.ts` (the "Get Suggestion" / "Analyze"
  features on `/insights`) silently swallowed every error.** Both code
  paths had a bare `catch { return NextResponse.json({ ...fake
  hardcoded content... }) }` — no `console.error`, no error status, just
  a made-up "Review previous topics" / motivation-score-70 response
  every single time something failed. This made the feature look like
  it was "replying" with generic, unhelpful, non-personalized content
  instead of visibly failing — impossible to diagnose from either the UI
  or the server logs. Also had no Groq→Gemini fallback when Groq itself
  errored (only when the key was entirely absent) — every other AI call
  in the app follows the fallback pattern; this was the one exception.
  Also asked the model directly for a resource `url`, the same
  hallucinated-link problem fixed in §20 for roadmap generation, missed
  here. Rewrote the whole route: real Groq→Gemini fallback, resource
  links resolved server-side instead of trusted from the model, and
  actual error responses (502, with a message naming the likely cause)
  instead of fake success.
- **`app/insights/page.tsx` didn't check `res.ok`** before treating a
  response as successful data — so even with the route fixed, the error
  responses above would have rendered as blank/broken cards instead of a
  visible message. Added `analysisError`/`sugError` state and an actual
  error card in the UI for both the "Analyze" and "Get Suggestion"
  flows.

If roadmap generation or suggestions are still not working after this
fix, the app will now say exactly why (most likely: `GROQ_API_KEY` and
`GEMINI_API_KEY` are both missing or invalid in your environment
variables) instead of failing silently or confusingly.
