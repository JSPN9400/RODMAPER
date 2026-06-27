# RoadMaper — AI Learning System

A full-stack SaaS platform to build personalized learning roadmaps, track daily progress, and get AI-powered insights.

## Features

- **Multiple Roadmaps** — Create, delete, pause, archive unlimited roadmaps
- **AI Generator** — Tell AI your goal + background → complete roadmap with tasks, tech stack, resources
- **Manual Builder** — Build roadmaps with full control: projects, tasks, days
- **Daily Tracker** — Today's tasks across ALL roadmaps in one view
- **Done / Not Done** — Click to mark tasks complete, with heatmap visualization
- **Reminders** — Browser push notifications at custom times per roadmap
- **Completion Reports** — Analytics: completion rate, streak, skills learned, project breakdown, AI summary
- **LinkedIn Generator** — AI writes posts for your milestones

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS |
| Backend | Next.js API Routes |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth.js (Google, GitHub, Demo) |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| Push Notifications | Web Push API + VAPID |

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Setup environment variables
```bash
cp .env.example .env.local
# Edit .env.local with your values
```

### 3. Setup PostgreSQL database
```bash
# Start PostgreSQL (or use Railway, Supabase, Neon for free cloud DB)
npm run db:push        # Push schema to database
npm run db:generate    # Generate Prisma client
```

### 4. Generate VAPID keys (for push notifications)
```bash
node -e "const wp=require('web-push'); const k=wp.generateVAPIDKeys(); console.log(JSON.stringify(k, null, 2))"
# Copy public key to NEXT_PUBLIC_VAPID_PUBLIC_KEY
# Copy private key to VAPID_PRIVATE_KEY
```

### 5. Run development server
```bash
npm run dev
# Open http://localhost:3000
```

## Project Structure

```
roadmaper/
├── app/
│   ├── api/
│   │   ├── roadmaps/       # CRUD for roadmaps
│   │   │   └── [id]/       # Single roadmap ops
│   │   ├── tasks/[id]/     # Toggle done, update notes
│   │   ├── reminders/      # CRUD reminders
│   │   ├── reports/        # Generate + fetch reports
│   │   ├── today/          # Today's tasks across all roadmaps
│   │   ├── push/           # Push subscription management
│   │   └── auth/           # NextAuth
│   ├── dashboard/          # All roadmaps overview
│   ├── create/             # Create roadmap (AI or manual)
│   ├── roadmap/[id]/       # Individual roadmap tracker
│   ├── today/              # Daily work page
│   ├── reminders/          # Reminder management
│   ├── reports/            # Completion analytics
│   ├── settings/           # App settings
│   └── login/              # Auth page
├── components/
│   └── ui/
│       ├── Sidebar.tsx     # Navigation
│       └── SessionProvider.tsx
├── lib/
│   ├── prisma.ts           # DB client
│   ├── auth.ts             # NextAuth config
│   ├── ai-generator.ts     # Anthropic AI functions
│   ├── report-generator.ts # Report logic
│   └── notifications.ts    # Web push
├── prisma/
│   └── schema.prisma       # Database schema
└── types/index.ts          # TypeScript types
```

## Deploy to Production

### Vercel (Recommended)
```bash
npm install -g vercel
vercel
# Set environment variables in Vercel dashboard
```

### Database options (Free tiers)
- **Neon** — neon.tech (free PostgreSQL)
- **Supabase** — supabase.com (free PostgreSQL)
- **Railway** — railway.app (PostgreSQL)

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | Random secret for NextAuth |
| `NEXTAUTH_URL` | Your app URL |
| `ANTHROPIC_API_KEY` | Claude AI API key |
| `GOOGLE_CLIENT_ID` | Google OAuth (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth (optional) |
| `GITHUB_ID` | GitHub OAuth (optional) |
| `GITHUB_SECRET` | GitHub OAuth (optional) |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Push notification public key |
| `VAPID_PRIVATE_KEY` | Push notification private key |
| `VAPID_EMAIL` | Push notification email |

## Roadmap (Future Features)

- [ ] Team roadmaps (share with others)
- [ ] Mobile app (React Native)
- [ ] Calendar integration
- [ ] Streak rewards
- [ ] Public roadmap gallery
- [ ] CSV/Excel import of tasks
- [ ] Webhook integrations
