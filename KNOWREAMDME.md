# KNOWREAMDME.md

Feature/Stack + File-Structure Verification Report (NO code changes)

---

## 0) What this document is
This document explains:
1) The **runtime flow** of the app.
2) The **tech stack actually used** (based on inspected files).
3) The **features/endpoints** that exist in the code.
4) The **full file structure** of the app (high-level, based on the repository paths you provided).

No existing program code was changed.

---

## 1) Runtime model (how the app works)
This is a **Next.js (App Router) full-stack** app:

### Browser / UI
- React pages under `app/*` render the UI.
- Shared UI components live under `components/*`.

### Server / API routes
- Backend logic is implemented as Next.js **route handlers** under `app/api/**/route.ts`.
- Most endpoints enforce authentication using:
  - `getServerSession(authOptions)` from `next-auth`.

### Database
- Data is stored in **PostgreSQL** via **Prisma**.
- Prisma client is exported from `lib/prisma.ts`.

### Auth
- NextAuth is configured in `lib/auth.ts` using a **Prisma adapter**.
- API routes rely on the session to ensure the user owns the resource.

### AI
- AI logic lives in `lib/ai-generator.ts`.
- AI is used when:
  - Creating a roadmap with `mode: 'ai'` in `app/api/roadmaps/route.ts`.
  - Generating completion report summaries in `lib/report-generator.ts`.

### Push notifications
- Web push logic lives in `lib/notifications.ts` (web-push + VAPID).
- Subscriptions are stored in `PushSubscription` in the DB.

---

## 2) Technologies / stacks actually used (from code)
### Frontend
- **Next.js App Router** (`app/*` pages)
- **React 18**
- **Tailwind CSS** (`tailwind.config.js`, `app/globals.css`)

### Backend
- **Next.js Route Handlers**: `app/api/**/route.ts`

### Database
- **PostgreSQL**
- **Prisma ORM**: `prisma/schema.prisma`, `lib/prisma.ts`

### Auth
- **NextAuth.js** + **Prisma Adapter**: `lib/auth.ts`
- Providers in code: **Google**, **GitHub**, and **Credentials “Demo”**.

### AI
- `lib/ai-generator.ts` uses **Google Generative AI (Gemini)**
  - Env var: `GEMINI_API_KEY`

> Note: `README.md` mentions Anthropic Claude, but current implementation uses Gemini.

### Push notifications
- **web-push** + **VAPID**: `lib/notifications.ts`

---

## 3) Full file structure (what exists in this repo)
Based on the repository file paths you shared in `<environment_details>`, the important structure is:

### Root
- `README.md` (main documentation)
- `SETUP_GUIDE.md` (setup guide)
- `package.json`, `package-lock.json`
- `next.config.js`
- `tsconfig.json`, `next-env.d.ts`
- `tailwind.config.js`, `postcss.config.js`
- `.gitignore`

### App Router pages
- `app/layout.tsx`
- `app/page.tsx`
- `app/login/page.tsx`
- `app/dashboard/page.tsx`
- `app/create/page.tsx`
- `app/today/page.tsx`
- `app/reminders/page.tsx`
- `app/reports/page.tsx`
- `app/insights/page.tsx`
- `app/settings/page.tsx`
- Roadmap tracker pages:
  - `app/roadmap/[id]/page.tsx`

### API routes
- `app/api/nlu/route.ts`  
- `app/api/auth/[...nextauth]/route.ts`
- `app/api/roadmaps/route.ts`
- `app/api/roadmaps/[id]/route.ts`
- `app/api/tasks/[id]/route.ts`
- `app/api/today/route.ts`
- `app/api/reminders/route.ts`
- `app/api/reports/route.ts`
- `app/api/push/route.ts`
- `app/api/self-learn/route.ts`
- plus other route directories listed in `<environment_details>`:
  - `app/api/create/...` (if present)

### Components
- `components/ui/Sidebar.tsx`
- `components/ui/SessionProvider.tsx`
- (and other `components/*` paths)

### Library code (`lib`)
- `lib/prisma.ts` (Prisma client singleton)
- `lib/auth.ts` (NextAuth config)
- `lib/ai-generator.ts` (Gemini calls + AI helpers)
- `lib/report-generator.ts` (report calculations + AI summary)
- `lib/notifications.ts` (web-push + reminder scheduling)

### Types
- `types/index.ts`

### Prisma schema
- `prisma/schema.prisma` (models + enums)

### Database models (Prisma)
From `prisma/schema.prisma`, main models:
- `User`, `Account`, `Session` (NextAuth)
- App models: `Roadmap`, `Project`, `Task`, `Reminder`, `PushSubscription`, `Settings`, `Report`
- Enums:
  - `RoadmapStatus` = `ACTIVE | COMPLETED | ARCHIVED | PAUSED`
  - `CreateMethod` = `MANUAL | AI`

---

## 4) Feature verification (what features exist + where)
The endpoints below were verified by reading the backend files.

### 4.1 NLU endpoint
**File:** `app/api/nlu/route.ts`
- **Endpoint:** `POST /api/nlu`
- **Auth:** required (`session.user.id`)
- **Body:** `{ input: string }`
- **Action:** calls `parseUserIntent(input)` from `lib/ai-generator.ts`

### 4.2 Roadmaps (CRUD + AI generation)
**File:** `app/api/roadmaps/route.ts`
- **GET /api/roadmaps**
  - Returns the user’s roadmaps including projects/tasks/reminders/report.
- **POST /api/roadmaps**
  - Supports creation modes:
    - `mode: 'ai'`: calls `generateRoadmapWithAI()` and then persists roadmap/projects/tasks
    - otherwise: creates manual roadmap from provided payload
  - Creates a default reminder at `09:00` (enabled, all days)

### 4.3 Today (next undone task across all active roadmaps)
**File:** `app/api/today/route.ts`
- **GET /api/today**
  - For each ACTIVE roadmap, finds the next task where `done=false`
  - Returns progress metrics + task details

### 4.4 Task completion + auto report generation
**File:** `app/api/tasks/[id]/route.ts`
- **PATCH /api/tasks/[id]**
  - Auth required
  - Updates:
    - `done` / `doneAt`
    - `notes` when provided
  - If all tasks for the roadmap are done:
    - generates report via `generateReport(roadmapId)`
    - updates roadmap status to `COMPLETED`

### 4.5 Reports (fetch or generate)
**File:** `app/api/reports/route.ts`
- **POST /api/reports**
  - Generates report for `roadmapId` (calls `generateReport`)
- **GET /api/reports?roadmapId=...**
  - Fetches stored report (verifies user ownership)

### 4.6 Reminders management
**File:** `app/api/reminders/route.ts`
- **POST**
  - Creates reminder for a roadmap owned by the user
- **PATCH**
  - Updates reminder fields: `time`, `enabled`, `message`, `days`
- **DELETE**
  - Deletes reminder by `id` query param after verifying ownership

### 4.7 Push subscription management
**File:** `app/api/push/route.ts`
- **POST**
  - Upserts push subscription by `endpoint`
- **DELETE**
  - Deletes push subscription by `endpoint` and `userId`

### 4.8 AI completion summary generation
**File:** `lib/report-generator.ts`
- Uses `generateCompletionSummary()` from `lib/ai-generator.ts`
- Computes:
  - completion rate
  - max streak
  - top skills from `task.techStack`
  - project breakdown
  - timeline points
- Stores/upserts a `Report` record

### 4.9 Web push reminder sending
**File:** `lib/notifications.ts`
- `web-push` configuration (VAPID)
- `sendPushToUser(...)` sends payloads to all stored subscriptions for the user
- `scheduleReminders()`:
  - intended to be called by cron
  - queries active reminders at the current time
  - sends notification with the roadmap’s next undone task

---

## 5) Known documentation mismatch (README vs code)
- `README.md` states AI uses **Anthropic Claude**.
- `lib/ai-generator.ts` currently uses **Google Gemini** (`GEMINI_API_KEY`, `gemini-1.5-flash`).

---

## 6) No-change guarantee
- This file was created/updated for documentation only.
- No existing app code was modified.

