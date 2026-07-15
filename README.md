# AnzenCare

Affordable Protection, Delivered Digitally. Because We Care.

Phone-only Next.js web app for digital accident protection — membership, referrals, wallet, and claims.

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- Supabase Auth (email / password)
- Vercel-ready

## Getting started

```bash
npm install
cp .env.local.example .env.local
```

Fill in your Supabase project values in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will land on the login screen. On desktop, the UI is centered in a phone frame (max-width ~430px).

## Auth

- Sign in uses Supabase `signInWithPassword`
- Protected member routes: `/dashboard`, `/card`, `/referrals`, `/wallet`, `/profile`, `/claims`
- Without env keys configured, the login form validates input and shows a clear configuration message

## Project structure

```
src/app/(auth)/login          Login screen
src/app/(auth)/register       Registration placeholder
src/app/(auth)/forgot-password
src/app/(member)/dashboard    Member home shell
src/components/auth/          Login form
src/components/layout/        Phone shell + bottom nav
src/lib/supabase/            Browser, server, middleware helpers
```

## Scripts

| Command       | Description              |
| ------------- | ------------------------ |
| `npm run dev` | Development server       |
| `npm run build` | Production build       |
| `npm run start` | Start production server|
| `npm run lint`  | ESLint                 |

## Next phases

PayMongo / QRPH payments, full registration + KYC, digital insurance card, multi-level commissions, claims workflow, withdrawals, admin dashboard, Resend email, Cloudflare R2.
