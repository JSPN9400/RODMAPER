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
| `notifications.ts` | Web Push helpers. `sendPushToUser` sends a push payload to every subscription a user has (and prunes subscriptions that fail, e.g. because the user uninstalled/blocked notifications). `scheduleReminders` is meant to be invoked on a schedule (every minute, via an external cron or a Vercel Cron Job) — it finds all `Reminder`s whose `time`/`days` match "now" and pushes a notification for each one's next incomplete task. **Note:** nothing in this repo currently calls `scheduleReminders()` on a timer — you need to wire up a Vercel Cron Job (or similar) hitting a small API route that calls it. |

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
  `generateRoadmapWithAI` export can be deleted too if you want to fully
  clean it up.
- **Removed:** `lib/report-generator.ts` (`generateReport`) was dead code —
  no API route imported it (report generation is handled entirely inline in
  `app/api/reports/route.ts`). It also imported two types
  (`TimelinePoint`, `ProjectReportData`) that were never added to
  `types/index.ts`, which broke the Vercel build. Deleted rather than
  patched, since nothing referenced it. If you want report-generation logic
  as a standalone, reusable function again (e.g. to call from a cron job),
  recreate it and give it real types instead of re-adding this file as-is.
- **`scheduleReminders()` needs a scheduler** — nothing currently calls it on
  a timer. Wire it up with a Vercel Cron Job (or any external scheduler)
  hitting a small authenticated API route once a minute.
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
| `GROQ_API_KEY` | Yes | Free key from [console.groq.com](https://console.groq.com/) — powers all AI generation. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Yes (for Google login) | OAuth app credentials from Google Cloud Console. Authorized redirect URI: `<NEXTAUTH_URL>/api/auth/callback/google`. |
| `GITHUB_ID` / `GITHUB_SECRET` | Yes (for GitHub login) | OAuth app credentials from GitHub Developer Settings. Authorized callback URL: `<NEXTAUTH_URL>/api/auth/callback/github`. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_EMAIL` | Optional | Only needed for browser push notifications (`lib/notifications.ts`). Generate with `npx web-push generate-vapid-keys`. |

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

