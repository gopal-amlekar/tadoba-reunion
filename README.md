# 🐯 Tadoba Reunion 2026

A small site for our school reunion at Tadoba — friends fill in their travel
plans, and Mayuri gets a logistics view she can actually book from.

**21 & 22 November 2026** · people arrive on the 20th or 21st, most head back on
the 22nd.

---

## What it does

| Page | Who | What happens there |
| --- | --- | --- |
| `/` | Everyone | The hero, countdown, headline numbers. Names stay hidden until you enter the password. |
| `/unlock` | Everyone | One shared group password. Mayuri has a second one that also opens the logistics desk. |
| `/travel` | The group | Every entry as a card. Anyone can open anyone's and fix it. |
| `/travel/new` | The group | The form: arrival and return date, time, gateway, mode, train/flight number, who's coming along, food, stay preference, notes. |
| `/admin` | Mayuri | Pickup plan, drop plan, stay allocation, per-person assignment, change log, CSV export. |

### The logistics desk

This is the part that saves the phone calls:

- **Pickup plan** — arrivals grouped by *day → gateway → time window*. Each card
  is one vehicle run, with a headcount and a suggested vehicle
  (Tempo Traveller ≈ 12 seats, Innova ≈ 6).
- **Drop plan** — the same in reverse.
- **Stay allocation** — who's in which resort/room, with everyone unplaced
  collected in one bucket.
- **Assign & annotate** — set stay, vehicle group, status and private notes per
  person. Reuse a vehicle group name to build a van load.
- **Change log** — since anyone can edit anyone, every save records who did it
  and what changed.
- **Export CSV** — the whole table, for sharing with the resort or the travel desk.

---

## Running it locally

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. With no `DATABASE_URL` set it stores everything in
`.data/db.json`, so there is nothing to configure to try it out.

Want it to look alive while you poke around?

```bash
node scripts/seed-demo.mjs   # adds six made-up friends
```

Delete the `.data` folder to clear them again.

**Default passwords** (until you change them): group `tadoba2026`, admin
`mayuri2026`.

---

## Deploying to Vercel

### 1. Put it on GitHub

```bash
git init
git add .
git commit -m "Tadoba reunion site"
gh repo create tadoba-reunion --private --source=. --push
```

(Or create the repo on github.com and `git remote add origin … && git push -u origin main`.)

### 2. Import it into Vercel

On <https://vercel.com/new>, pick the repo and hit **Deploy**. Next.js is
detected automatically — no build settings to change.

### 3. Add a database

In the project → **Storage** → **Create Database** → **Neon (Postgres)** →
**Connect**. Vercel injects `DATABASE_URL` for you.

> The app talks to Neon over its HTTP driver, so there is no connection pool to
> exhaust — the usual "too many connections" failure on serverless can't happen
> here. The tables are created automatically on the first request; there is no
> migration step to run.

### 4. Set the passwords

Project → **Settings** → **Environment Variables**:

| Name | Value |
| --- | --- |
| `SITE_PASSWORD` | The one you'll share on the WhatsApp group |
| `ADMIN_PASSWORD` | Mayuri's — keep this one separate |
| `SESSION_SECRET` | Any long random string |

Then **Redeploy** so they take effect. Share the URL and the group password, and
you're live.

---

## Changing the details

Almost everything lives in [`lib/event.ts`](lib/event.ts) — dates, cities,
gateways, travel modes, food options, and the time buckets used to group
pickups. Edit that one file and the whole site follows.

---

## Built with

Next.js (App Router) · TypeScript · Tailwind v4 · Neon Postgres
