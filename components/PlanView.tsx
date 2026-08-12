import { MAIN_DAY, prettyDate, prettyTime } from "@/lib/event";
import { asParties, listGroups } from "@/lib/groups";
import {
  buildRuns,
  byStay,
  earlyArrivals,
  earlyNightHeads,
  inboundConvoys,
  lateArrivals,
  legTitle,
  runNeedsVehicle,
  runWhen,
  suggestVehicles,
  totals,
  type Run,
} from "@/lib/logistics";
import type { Participant } from "@/lib/types";

/**
 * The plan itself — transfer legs, the night-halt board and room allocation.
 * Read-only and safe to show the whole group: it deliberately leaves out the
 * organiser's private notes, the change log and the export.
 */

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
          {run.heads} {run.heads === 1 ? "person" : "people"}
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
            <span>{p.name}</span>
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

export default function PlanView({ people }: { people: Participant[] }) {
  const t = totals(people);
  const groups = listGroups(people.filter((p) => p.status !== "Cancelled"));
  const convoys = inboundConvoys(people);
  const late = lateArrivals(people);
  // Departures stay per-person: everyone leaves on their own train or flight.
  const departures = buildRuns(people, "return");
  const stays = byStay(people);
  const early = earlyArrivals(people);
  const earlyHeads = earlyNightHeads(people);
  const earlyUnplaced = early.reduce((n, g) => n + g.unplaced, 0);

  return (
    <>
      {/* ------------------------------------------------------- totals -- */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[
          { big: t.entries, small: "people coming", tone: "text-bone" },
          { big: t.confirmed, small: "confirmed", tone: "text-tiger" },
          { big: t.tentative, small: "still tentative", tone: "text-amber-glow" },
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
        {groups.length > 0 && (
          <span className="chip !border-leaf/40 !text-leaf">
            {groups.length} {groups.length === 1 ? "group" : "groups"} travelling
            together
          </span>
        )}
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
        {t.cancelled > 0 && <span className="chip">{t.cancelled} cancelled</span>}
      </section>

      {/* -------------------------------------------------- inbound leg -- */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-leaf">
          🛬 Getting everyone to Tadoba
        </h2>
        <p className="mt-1 text-sm text-bone-dim">
          Everyone drives in together on{" "}
          <strong className="text-bone">{prettyDate(MAIN_DAY)}</strong> — one
          convoy per gateway, whether you landed that morning or the day before.
          A convoy can&apos;t leave before its last arrival is on the ground.
        </p>

        {convoys.length === 0 ? (
          <p className="card mt-4 p-5 text-bone-dim">No arrivals entered yet.</p>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {convoys.map((c) => (
              <div key={c.gateway} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display font-bold text-bone">
                    {c.selfDriven
                      ? "Driving straight in"
                      : c.gateway === "Gateway not given"
                        ? "Gateway not decided"
                        : `${c.gateway} → Tadoba`}
                  </h3>
                  <span className="chip !border-tiger/40 !text-tiger whitespace-nowrap">
                    {c.heads} {c.heads === 1 ? "person" : "people"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-bone-dim">
                  {prettyDate(MAIN_DAY)} · everyone together
                </p>

                <p className="mt-1 text-xs text-amber-glow">
                  {c.selfDriven
                    ? "Own vehicle — nothing to book"
                    : `Book: ${suggestVehicles(c.heads)}`}
                </p>

                {!c.selfDriven && (
                  <p className="mt-1 text-xs text-leaf">
                    {c.sameDayCount === 0 ? (
                      <>Everyone&apos;s already in town — leave whenever suits.</>
                    ) : c.notBefore ? (
                      <>
                        Not before {prettyTime(c.notBefore)} — waiting on{" "}
                        {c.notBeforeWho}
                      </>
                    ) : (
                      <>
                        {c.sameDayCount} arriving that day with no time given yet
                      </>
                    )}
                  </p>
                )}

                <ul className="mt-3 space-y-1.5 text-sm text-bone-dim">
                  {asParties(c.people).map((party) =>
                    party.kind === "group" ? (
                      <li
                        key={party.id}
                        className="rounded-lg border border-leaf/25 bg-leaf/5 px-2.5 py-1.5"
                      >
                        <div className="flex justify-between gap-2">
                          <span className="font-semibold text-leaf">
                            {party.name}
                          </span>
                          <span className="shrink-0 text-xs text-leaf/80">
                            {party.members.length} together
                          </span>
                        </div>
                        {party.members.map((m) => (
                          <div
                            key={m.id}
                            className="flex justify-between gap-2 text-xs"
                          >
                            <span>{m.name}</span>
                            <span className="shrink-0">
                              {m.arriveDate && m.arriveDate < MAIN_DAY
                                ? `waiting since ${prettyDate(m.arriveDate)}`
                                : prettyTime(m.arriveTime)}
                            </span>
                          </div>
                        ))}
                      </li>
                    ) : (
                      <li
                        key={party.person.id}
                        className="flex justify-between gap-2"
                      >
                        <span>{party.person.name}</span>
                        <span className="shrink-0 text-xs">
                          {party.person.arriveDate < MAIN_DAY ? (
                            <span className="text-bone-dim/70">
                              waiting since {prettyDate(party.person.arriveDate)}
                            </span>
                          ) : (
                            <>
                              {prettyTime(party.person.arriveTime)}
                              {party.person.arriveMode &&
                                ` · ${party.person.arriveMode}`}
                            </>
                          )}
                        </span>
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ))}
          </div>
        )}

        {late.length > 0 && (
          <>
            <h3 className="mt-8 font-display text-lg font-bold text-tiger">
              Arriving after the convoy — separate transfer needed
            </h3>
            <div className="mt-3 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {late.map((run) => (
                <RunCard
                  key={`${run.date}-${run.gateway}-${run.slot}`}
                  run={run}
                  direction="arrive"
                />
              ))}
            </div>
          </>
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
                      <span className="text-bone-dim">{p.name}</span>
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

      {/* --------------------------------------------------- resort stay -- */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-amber-glow">
          🛖 Tadoba stay — 21 &amp; 22 November
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
                    {g.heads} {g.heads === 1 ? "person" : "people"}
                  </span>
                </div>
                <ul className="mt-2 text-sm text-bone-dim">
                  {g.people.map((p) => (
                    <li key={p.id}>{p.name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
