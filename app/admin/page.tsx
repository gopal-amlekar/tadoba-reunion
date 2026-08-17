import Link from "next/link";
import { redirect } from "next/navigation";
import { getRole } from "@/lib/auth";
import {
  listAudit,
  listCosts,
  listItinerary,
  listParticipants,
  usingPostgres,
} from "@/lib/db";
import { EVENT, formatMoney, prettyStamp } from "@/lib/event";
import { moneySummary } from "@/lib/money";
import { totals } from "@/lib/roster";

export const dynamic = "force-dynamic";

/**
 * Mayuri's desk. The programme and the money are edited on their own public
 * pages — she sees the edit controls there — so what's left here is the stuff
 * that is genuinely only hers: the state of things, the change log and the
 * export.
 */
export default async function AdminPage() {
  if ((await getRole()) !== "admin") redirect("/unlock");

  const people = await listParticipants();
  const costs = await listCosts();
  const items = await listItinerary();
  const audit = await listAudit(40);

  const t = totals(people);
  const money = moneySummary(people, costs);

  const jobs = [
    {
      href: "/itinerary",
      title: "The programme",
      done: items.length > 0,
      detail:
        items.length > 0
          ? `${items.length} ${items.length === 1 ? "entry" : "entries"} published`
          : "Nothing published yet — the group can't see a plan",
    },
    {
      href: "/money",
      title: "Costs & contributions",
      done: costs.length > 0,
      detail:
        costs.length > 0
          ? `${costs.length} ${costs.length === 1 ? "cost" : "costs"} · ${formatMoney(money.outstanding)} still to come in`
          : "No costs entered, so nobody has a share yet",
    },
    {
      href: "/travel",
      title: "Travel details",
      done: t.missingTravel === 0 && t.entries > 0,
      detail:
        t.entries === 0
          ? "Nobody on the list yet"
          : t.missingTravel > 0
            ? `${t.missingTravel} missing arrival or return dates`
            : "Everyone has dates in",
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-bone">
            Organiser&apos;s desk
          </h1>
          <p className="mt-1 text-bone-dim">
            Where things stand, {EVENT.organiser}. The programme and the money
            are edited on their own pages — the group sees those, you see the
            same page with the controls on.
          </p>
        </div>
        <a href="/api/export" className="no-print btn-ghost !py-2 text-sm">
          ⬇ Export CSV
        </a>
      </div>

      {!usingPostgres && (
        <p className="no-print mt-6 rounded-xl border border-amber-glow/40 bg-amber-glow/10 px-4 py-3 text-sm text-amber-glow">
          <strong>Local file storage.</strong> No database connection string is
          set, so entries are saved to <code>.data/db.json</code> on this
          machine. Add <code>DATABASE_URL</code> before sharing the site — on
          Vercel the filesystem resets and data would be lost.
        </p>
      )}

      {/* ---------------------------------------------------- to-do list -- */}
      <section className="mt-8 grid gap-4 md:grid-cols-3">
        {jobs.map((j) => (
          <Link
            key={j.href}
            href={j.href}
            className="card p-5 transition hover:border-tiger/50"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-bone">
                {j.title}
              </h2>
              <span className={j.done ? "text-leaf" : "text-tiger"}>
                {j.done ? "✓" : "•"}
              </span>
            </div>
            <p className="mt-1 text-sm text-bone-dim">{j.detail}</p>
          </Link>
        ))}
      </section>

      {/* ------------------------------------------------------- numbers -- */}
      <section className="mt-8 flex flex-wrap gap-2">
        <span className="chip !border-leaf/40 !text-leaf">
          {t.entries} coming
        </span>
        <span className="chip">{t.confirmed} confirmed</span>
        {t.tentative > 0 && (
          <span className="chip !border-amber-glow/40 !text-amber-glow">
            {t.tentative} tentative
          </span>
        )}
        {t.cancelled > 0 && <span className="chip">{t.cancelled} cancelled</span>}
        {/* Food counts are hidden while the form doesn't ask — a tally of
            everyone's defaults would only mislead the resort. */}
        <span className="chip !border-tiger/40 !text-tiger">
          {formatMoney(money.received)} of {formatMoney(money.expected)} in
        </span>
      </section>

      {/* -------------------------------------------------------- audit -- */}
      <section className="no-print mt-12">
        <h2 className="font-display text-2xl font-bold text-bone-dim">
          🕵️ Change log
        </h2>
        <p className="mt-1 text-sm text-bone-dim">
          Since anyone can edit anyone, here&apos;s who touched what.
        </p>
        {audit.length === 0 ? (
          <p className="card mt-4 p-5 text-bone-dim">No changes yet.</p>
        ) : (
          <ul className="card mt-4 divide-y divide-jungle-800">
            {audit.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap justify-between gap-2 px-4 py-2.5 text-sm"
              >
                <span className="text-bone-dim">
                  <strong className="text-bone">{a.changedBy || "Someone"}</strong>{" "}
                  {a.action}{" "}
                  <strong className="text-bone">{a.participantName}</strong>
                  {a.summary && ` — ${a.summary.toLowerCase()}`}
                </span>
                <span className="text-xs text-bone-dim">
                  {prettyStamp(a.at)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
