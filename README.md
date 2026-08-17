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
| `/itinerary` | The group | The day-by-day programme, with an estimated cost per entry. Mayuri edits it here, in place. |
| `/money` | The group | Every bill, everyone's share, what's been paid, what's left. Mayuri edits the totals, who splits them, and the receipts here, in place. |
| `/travel` | The group | Every travel entry as a card. Anyone can open anyone's and fix it. |
| `/travel/new` | The group | The form: arrival and return date, time, gateway, mode, train/flight number, food, stay preference, notes. |
| `/groups` | The group | Put people who travel together into one party. |
| `/admin` | Mayuri | Where things stand, the change log, CSV export. |

### The programme

Each line is a day, a time, a title, an optional detail and an optional
estimated cost. Ordering is derived from date and time rather than stored, so
moving something an hour later is just editing its time — there is no separate
ordering to keep in sync.

Safaris are ordinary entries. They used to have a dedicated slot-based booking
panel and a reporting-times board; a drive is a time and a place, which is what
an entry already is, so the special case earned nothing.

### The money

Every cost is **one whole bill, divided between the people it applies to** —
either everybody or a ticked list. A cost typed against a programme entry lives
in the same table as the rest, linked by `itineraryId`, so there is exactly one
place a bill is stored and the two pages cannot disagree. Costs with no entry
behind them are the extras: tips, water, a cake.

| What for | Whole bill | Split between | Works out at |
| --- | --- | --- | --- |
| Check in at the resort | ₹27,000 | Everyone · 6 | ₹4,500 each |
| Evening safari | ₹7,200 | 4 people | ₹1,800 each |
| Tips, water and snacks | ₹5,200 | Everyone · 6 | ₹867 each |

Mayuri records one running total received per person plus a free-text note
("UPI 12 Oct ₹3000 + cash ₹1500"), and the balance falls out. Everyone can see
everyone's balance; that's the point.

Four things worth knowing, all of them in [`lib/money.ts`](lib/money.ts):

- **A bill rarely divides cleanly, so the split is allocated rather than
  rounded.** ₹5,200 between 6 is ₹866.67, and six × ₹867 is ₹5,202 — round every
  share the same way and the column stops adding up. So the remainder goes out a
  rupee at a time: four people pay ₹867, two pay ₹866, total exactly ₹5,200.
  Who absorbs the extra rupee is decided by participant id — arbitrary, but
  stable, so shares don't jump between page loads.
- **A share moves when the group does.** This is the cost of dividing rather
  than quoting per head: one late joiner re-divides every cost they're part of.
- **"Everyone" is stored as a flag**, not as today's list of ids, so anyone who
  joins later is charged automatically rather than slipping through.
- **Outstanding is the sum of what people still owe**, not `expected − received`
  — one person overpaying must not hide another's shortfall. Likewise `expected`
  counts only bills that have somebody to pay them, so it always equals the sum
  of everyone's shares; a bill charged to nobody is reported separately as
  unallocated instead of quietly vanishing.

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
node scripts/seed-demo.mjs   # six made-up friends, a programme and four costs
```

Delete the `.data` folder to clear them again.

**Default passwords**: group `tadoba2026`, organiser `mayuri`. These are only
the fallbacks for when no env vars are set, i.e. local development — a deployed
site reads the real ones from `SITE_PASSWORD` and `ADMIN_PASSWORD`, so changing
these two does nothing to what's live.

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
gateways, travel modes, food options and the days the programme can have
entries on. Edit that one file and the whole site follows.
The money arithmetic is all in [`lib/money.ts`](lib/money.ts), and it's pure —
nothing is stored except each bill, who it applies to and what's come in.

---

## Built with

Next.js (App Router) · TypeScript · Tailwind v4 · Neon Postgres
