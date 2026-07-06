# RoadMaper

RoadMaper is a universal AI roadmap builder for any kind of learner: school students, college students, exam aspirants, working professionals, researchers, and self-learners.

It supports both:
- Short-term roadmaps: day-by-day plans under 90 days
- Long-term roadmaps: phased plans for 90+ days, exams, degrees, research, and career goals

## What It Can Build

- Technology: Python, React, ML, data science, cybersecurity, cloud
- School subjects: maths, physics, chemistry, biology, commerce, humanities
- Exams: UPSC, CAT, JEE, NEET, GATE, CA, CFA, GRE, GMAT, SSC, banking
- Academic goals: masters, thesis, PhD research, medical or law study
- Languages: English, Hindi, Japanese, German, French, Spanish
- Creative and career skills: writing, speaking, UX, marketing, product, business

## Core Features

- AI roadmap generator using Groq `llama-3.3-70b-versatile`
- Manual roadmap builder
- Short-term daily plans with study + practice + mini output
- Long-term phased plans with milestones and checkpoints
- Dashboard for multiple roadmaps
- Roadmap detail page for both daily and phased roadmaps
- Progress tracking and completion reports
- NextAuth login with Google, GitHub, and demo mode

## Tech Stack

- Next.js 15 App Router
- TypeScript
- Prisma + PostgreSQL
- NextAuth
- Groq SDK
- Tailwind CSS

## Setup

### 1. Install

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in:

```env
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=
GROQ_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_ID=
GITHUB_SECRET=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_EMAIL=
```

### 3. Push the latest Prisma schema

This step is required after the new universal roadmap update because the schema now includes:
- `roadmapType`
- `targetDate`
- `Phase`
- `GoalAnalytics`

```bash
npm run db:push
npm run db:generate
```

If you skip this, the roadmap detail page may fail to open because the database will still be missing the new fields/tables.

### 4. Run locally

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

## New Universal Roadmap Flow

### Create Page

The create page now supports:

1. Goal type selection
   - Short term
   - Long term
   - Or let AI decide from a natural-language goal

2. Short-term generation
   - current level
   - duration under 90 days
   - hours per day
   - focus type
   - background

3. Long-term generation
   - target goal
   - target date or duration
   - current level
   - hours per day
   - exam/goal type
   - background

## API

### Existing routes

- `GET /api/roadmaps`
- `POST /api/roadmaps`
- `GET /api/roadmaps/[id]`
- `PATCH /api/roadmaps/[id]`
- `DELETE /api/roadmaps/[id]`

### New route

- `POST /api/roadmaps/generate`

This new endpoint generates:
- short-term daily roadmaps
- long-term phased roadmaps

## Important Notes

- The old roadmap CRUD still works
- The new generator is additive and does not replace the existing routes
- Long-term roadmaps use phases, not only daily tasks
- Roadmap detail page now supports both roadmap types

## Deploy

For Vercel:

1. Push latest code to GitHub
2. Set all required environment variables
3. Run a fresh deploy
4. Make sure the database schema has been pushed before opening roadmap pages

## Troubleshooting

### Roadmap page does not open

Usually this means the Prisma schema was updated in code but not pushed to the database.

Run:

```bash
npm run db:push
npm run db:generate
```

Then redeploy if needed.

### Vercel build succeeds but roadmap page fails

Check:
- `DATABASE_URL`
- Prisma schema is pushed
- latest commit is deployed

## Status

The project now supports universal roadmap generation for both short-term and long-term study plans.
