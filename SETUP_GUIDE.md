# RoadMaper — Fix & Setup Guide

## Error 1 Fix: @auth/prisma-adapter missing
Run: `npm install @auth/prisma-adapter`

## Error 2 Fix: DATABASE_URL missing in .env.local

### Free PostgreSQL in 2 minutes (Neon)
1. Go to: https://neon.tech
2. Sign up free
3. Create project → "roadmaper"
4. Copy connection string (looks like):
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require

### Fill your .env.local like this:
```
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="myrandomsecret123abc"

ANTHROPIC_API_KEY="sk-ant-your-key-here"

# Leave these empty for now (demo login will work without them)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GITHUB_ID=""
GITHUB_SECRET=""

NEXT_PUBLIC_VAPID_PUBLIC_KEY=""
VAPID_PRIVATE_KEY=""
VAPID_EMAIL="admin@roadmaper.com"
```

### After filling .env.local:
```bash
npm run db:push     # creates all tables
npm run dev         # start app
```

### Login without Google/GitHub:
Use the "Demo" login on the login page — just enter any email!

## Quick NEXTAUTH_SECRET generator:
Run in terminal: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
