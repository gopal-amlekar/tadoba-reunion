# 🐯 Tadoba Reunion 2026

A small site for our school reunion at Tadoba — the programme, what it costs,
and where everyone stands on paying for it.

**21 & 22 November 2026** · people arrive on the 20th or 21st, most head back on
the 22nd.

---

## What it does

| Page | Who | What happens there |
| --- | --- | --- |
| `/` | Everyone | The hero, countdown, headline numbers. Names stay hidden until you enter the password. |
| `/unlock` | Everyone | One shared group password. Mayuri has a second one that switches on the editing controls. |
| `/itinerary` | The group | Safari reporting times and the day-by-day programme. Mayuri edits it here, in place. |
| `/money` | The group | What each segment costs, everyone's share, what's been paid, what's left. Mayuri edits the rates and the receipts here, in place. |
| `/travel` | The group | Every travel entry as a card. Anyone can open anyone's and fix it. |
| `/travel/new` | The group | The form: arrival and return date, time, gateway, mode, train/flight number, food, stay preference, notes. |
| `/groups` | The group | Put people who travel together into one party. |
| `/admin` | Mayuri | Where things stand, the change log, CSV export. |

### The programme

Each line is a day, a time, a title and an optional detail. Ordering is derived
from date and time rather than stored, so moving something an hour later is just
editing its time — there is no separate ordering to keep in sync.

### The money

Costs are entered as a **rate per person**, not as a lump sum, because that's
what Mayuri is actually quoted — a gypsy seat, a room share, a bus seat. Each
one either applies to everybody or to a ticked list of people.

| What for | Per person | Who pays | Comes to |
| --- | --- | --- | --- |
| Resort, 2 nights | ₹4,500 | Everyone · 26 | ₹1,17,000 |
| Safari seat | ₹1,800 | 18 people | ₹32,400 |
| Nagpur transfer | ₹1,200 | 14 people | ₹16,800 |

A person's share is then a plain sum of the rates that apply to them — no
division and no rounding, and nobody's number moves because somebody else joined
late or dropped out. Mayuri records one running total received per person plus a
free-text note ("UPI 12 Oct ₹3000 + cash ₹1500"), and the balance falls out.
Everyone can see everyone's balance; that's the point.

Two things worth knowing:

- **"Everyone" is stored as a flag**, not as today's list of ids, so anyone who
  joins later is charged for it automatically rather than slipping through.
- **Outstanding is the sum of what people still owe**, not `expected − received`
  — one person overpaying must not hide another's shortfall.

### Also on the organiser's desk

- **Change log** — since anyone can edit anyone, every save records who did it
  and what changed.
- **Export CSV** — the whole table including share, received and balance, for
  the resort or the travel desk.

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
node scripts/seed-demo.mjs   # six made-up friends, a programme and three costs
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
gateways, travel modes, food options, the safari slots and the days the
programme can have entries on. Edit that one file and the whole site follows.
The money arithmetic is all in [`lib/money.ts`](lib/money.ts), and it's pure —
nothing is stored except the rates, who they apply to and what's come in.

---

## Built with

Next.js (App Router) · TypeScript · Tailwind v4 · Neon Postgres
