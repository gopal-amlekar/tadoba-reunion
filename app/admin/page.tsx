import Link from "next/link";
import { redirect } from "next/navigation";
import { lockAction } from "@/app/actions";
import AdminRow from "@/components/AdminRow";
import { getRole } from "@/lib/auth";
import { listAudit, listParticipants, usingPostgres } from "@/lib/db";
import { EVENT, MAIN_DAY, prettyDate, prettyStamp, prettyTime } from "@/lib/event";
import {
  buildRuns,
  byStay,
  earlyArrivals,
  earlyNightHeads,
  legTitle,
  runNeedsVehicle,
  runWhen,
  suggestVehicles,
  totals,
  type Run,
} from "@/lib/logistics";
import { headcount } from "@/lib/types";

export const dynamic = "force-dynamic";

function RunCard({
  run,
  direction,
}: {
  run: Run;
  direction: "arrive" | "return";
}) {
  return (
    <div className="card p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display font-bold text-bone">
          {legTitle(run, direction)}
        </h3>
        <span className="chip !border-tiger/40 !text-tiger whitespace-nowrap">
          {run.heads} {run.heads === 1 ? "head" : "heads"}
        </span>
      </div>
      <p className="mt-0.5 text-xs text-bone-dim">{runWhen(run)}</p>
      <p className="mt-1 text-xs text-amber-glow">
        {runNeedsVehicle(run)
          ? `Book: ${suggestVehicles(run.heads)}`
          : "Own vehicle — nothing to book"}
      </p>
      <ul className="mt-3 space-y-1 text-sm text-bone-dim">
        {run.people.map((p) => (
          <li key={p.id} className="flex justify-between gap-2">
            <span>
              {p.name}
              {headcount(p) > 1 && ` (+${headcount(p) - 1})`}
            </span>
            <span className="shrink-0 text-xs">
              {prettyTime(direction === "arrive" ? p.arriveTime : p.returnTime)}
              {(direction === "arrive" ? p.arriveMode : p.returnMode) &&
                ` · ${direction === "arrive" ? p.arriveMode : p.returnMode}`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default async function AdminPage() {
  if ((await getRole()) !== "admin") redirect("/unlock");

  const people = await listParticipants();
  const audit = await listAudit(40);
  const t = totals(people);
  const arrivals = buildRuns(people, "arrive");
  const departures = buildRuns(people, "return");
  const stays = byStay(people);
  const early = earlyArrivals(people);
  const earlyHeads = earlyNightHeads(people);
  const earlyUnplaced = early.reduce((n, g) => n + g.unplaced, 0);

  const stayOptions = [
    ...new Set(people.map((p) => p.stayAssigned).filter(Boolean)),
  ];
  const preNightOptions = [
    ...new Set(people.map((p) => p.preNightStay).filter(Boolean)),
  ];
  const vehicleOptions = [
    ...new Set(people.map((p) => p.vehicleGroup).filter(Boolean)),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-bone">
            Logistics desk
          </h1>
          <p className="mt-1 text-bone-dim">
            Everything {EVENT.organiser} needs to book rooms, vehicles and food.
          </p>
        </div>
        <div className="no-print flex gap-2">
          <a href="/api/export" className="btn-ghost !py-2 text-sm">
            ⬇ Export CSV
          </a>
          <form action={lockAction}>
            <button type="submit" className="btn-ghost !py-2 text-sm">
              Lock
            </button>
          </form>
        </div>
      </div>

      {!usingPostgres && (
        <p className="no-print mt-6 rounded-xl border border-amber-glow/40 bg-amber-glow/10 px-4 py-3 text-sm text-amber-glow">
          <strong>Local file storage.</strong> No database connection string is
          set, so entries are saved to <code>.data/db.json</code> on this
          machine. Add <code>DATABASE_URL</code> before sharing the site — on
          Vercel the filesystem resets and data would be lost.
        </p>
      )}

      {/* ------------------------------------------------------- totals -- */}
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { big: t.entries, small: "entries", tone: "text-bone" },
          { big: t.heads, small: "total heads to feed & sleep", tone: "text-tiger" },
          { big: t.tentative, small: "still tentative", tone: "text-amber-glow" },
          { big: t.unassignedStay, small: "without a stay assigned", tone: "text-leaf" },
        ].map((s) => (
          <div key={s.small} className="card p-4">
            <div className={`font-display text-3xl font-bold ${s.tone}`}>
              {s.big}
            </div>
            <div className="mt-0.5 text-xs text-bone-dim">{s.small}</div>
          </div>
        ))}
      </section>

      <section className="mt-3 flex flex-wrap gap-2">
        <span className="chip">
          {t.adults} adults · {t.kids} kids
        </span>
        {Object.entries(t.food).map(([k, v]) => (
          <span key={k} className="chip">
            {k}: {v}
          </span>
        ))}
        {t.missingTravel > 0 && (
          <span className="chip !border-tiger/50 !text-tiger">
            {t.missingTravel} missing arrival/return dates
          </span>
        )}
        {t.cancelled > 0 && (
          <span className="chip">{t.cancelled} cancelled</span>
        )}
      </section>

      {/* -------------------------------------------------- inbound leg -- */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-leaf">
          🛬 Getting everyone to Tadoba
        </h2>
        <p className="mt-1 text-sm text-bone-dim">
          The inbound road legs, grouped by day, arrival place and time window.
          One card = one vehicle to book. People arriving before the main day do
          this leg the next morning — see the night-halt board below.
        </p>
        {arrivals.length === 0 ? (
          <p className="card mt-4 p-5 text-bone-dim">No arrivals entered yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {arrivals.map((run) => (
              <RunCard
                key={`${run.date}-${run.gateway}-${run.slot}`}
                run={run}
                direction="arrive"
              />
            ))}
          </div>
        )}
      </section>

      {/* --------------------------------------------- pre-event night -- */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-amber-glow">
          🌙 Night before — beds at the arrival city
        </h2>
        <p className="mt-1 text-sm text-bone-dim">
          Anyone landing before {prettyDate(MAIN_DAY)} needs a room for that
          night, normally near where they land.{" "}
          <strong className="text-bone">
            {earlyHeads} {earlyHeads === 1 ? "bed" : "beds"}
          </strong>{" "}
          needed in total
          {earlyUnplaced > 0 && (
            <>
              {" — "}
              <strong className="text-tiger">
                {earlyUnplaced} still without a room
              </strong>
            </>
          )}
          .
        </p>

        {early.length === 0 ? (
          <p className="card mt-4 p-5 text-bone-dim">
            Nobody is arriving early yet, so there are no extra rooms to book.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {early.map((g) => (
              <div key={`${g.date}-${g.gateway}`} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display font-bold text-bone">
                    {g.gateway}
                  </h3>
                  <span className="chip !border-amber-glow/40 !text-amber-glow whitespace-nowrap">
                    {g.heads} {g.heads === 1 ? "bed" : "beds"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-bone-dim">
                  Night of {prettyDate(g.date)}
                </p>
                <ul className="mt-3 space-y-1.5 text-sm">
                  {g.people.map((p) => (
                    <li key={p.id} className="flex justify-between gap-2">
                      <span className="text-bone-dim">
                        {p.name}
                        {headcount(p) > 1 && ` (+${headcount(p) - 1})`}
                      </span>
                      <span
                        className={`shrink-0 text-right text-xs ${
                          p.preNightStay ? "text-leaf" : "text-tiger"
                        }`}
                      >
                        {p.preNightStay || "no room yet"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------- outbound leg -- */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-tiger">
          🛫 Getting everyone home
        </h2>
        <p className="mt-1 text-sm text-bone-dim">
          The outbound road legs from the resort. Watch the early-morning trains
          out of Chandrapur — those cars leave before breakfast.
        </p>
        {departures.length === 0 ? (
          <p className="card mt-4 p-5 text-bone-dim">No returns entered yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {departures.map((run) => (
              <RunCard
                key={`${run.date}-${run.gateway}-${run.slot}`}
                run={run}
                direction="return"
              />
            ))}
          </div>
        )}
      </section>

      {/* --------------------------------------------------------- stay -- */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-amber-glow">
          🛖 Tadoba stay — {EVENT.mainDays}
        </h2>
        <p className="mt-1 text-sm text-bone-dim">
          Rooms at the resort for the event itself. Separate from the night-halt
          board above.
        </p>
        {stays.length === 0 ? (
          <p className="card mt-4 p-5 text-bone-dim">Nobody to place yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {stays.map((g) => (
              <div key={g.stay} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-bold text-bone">{g.stay}</h3>
                  <span className="chip whitespace-nowrap">
                    {g.heads} {g.heads === 1 ? "head" : "heads"}
                  </span>
                </div>
                <ul className="mt-2 text-sm text-bone-dim">
                  {g.people.map((p) => (
                    <li key={p.id}>
                      {p.name}
                      {headcount(p) > 1 && ` (+${headcount(p) - 1})`}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ------------------------------------------------------- master -- */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-bone">
          📋 Everyone — assign & annotate
        </h2>
        <p className="mt-1 text-sm text-bone-dim">
          Set the stay, group people into vehicles, and keep your own notes.
          Reuse the same vehicle group name to build a van load.
        </p>
        {people.length === 0 ? (
          <div className="card mt-4 p-8 text-center text-bone-dim">
            Nothing yet.{" "}
            <Link href="/travel/new" className="text-tiger underline">
              Add the first entry
            </Link>
            .
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {people.map((p) => (
              <AdminRow
                key={p.id}
                p={p}
                stayOptions={stayOptions}
                preNightOptions={preNightOptions}
                vehicleOptions={vehicleOptions}
              />
            ))}
          </div>
        )}
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
                  {a.action} <strong className="text-bone">{a.participantName}</strong>
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
