# 🐯 Tadoba Reunion 2026

A small, public invite page for our friends' get-together at Tadoba.
Marathi and English side by side.

**20–22 November 2026** · arrivals in Nagpur on the 20th, Tadoba on the 21st,
heading home on the 22nd.

## What's on the page

- Hero with a countdown to the 20th
- Three days at a glance
- Fun programme: fishpond, singing sessions, friendly leg-pulling
- Organiser highlight and a tribute to सरकार

No login, no forms, no database, and no personal details or costs.

## Changing the text

- Dates, venue and countdown: [`lib/event.ts`](lib/event.ts)
- Everything people read: [`app/page.tsx`](app/page.tsx) (the `DAYS` and `FUN`
  lists at the top, plus the two highlight cards at the bottom)

## Running it locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>.

## Deploying

Push to GitHub and Vercel redeploys automatically. No environment variables
are needed any more; the old `SITE_PASSWORD`, `ADMIN_PASSWORD`,
`SESSION_SECRET` and `DATABASE_URL` can be deleted from the Vercel project.

## Built with

Next.js (App Router) · TypeScript · Tailwind v4
