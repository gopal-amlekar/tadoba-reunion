import Link from "next/link";
import { redirect } from "next/navigation";
import AdminRow from "@/components/AdminRow";
import PlanView from "@/components/PlanView";
import { getRole } from "@/lib/auth";
import { listAudit, listParticipants, usingPostgres } from "@/lib/db";
import { EVENT, prettyStamp } from "@/lib/event";
import { totals } from "@/lib/logistics";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if ((await getRole()) !== "admin") redirect("/unlock");

  const people = await listParticipants();
  const audit = await listAudit(40);
  const t = totals(people);

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
            The whole group can see{" "}
            <Link href="/plan" className="text-tiger underline">
              the plan
            </Link>
            ; the assignments, notes and export below are yours alone.
          </p>
        </div>
        <div className="no-print flex gap-2">
          <a href="/api/export" className="btn-ghost !py-2 text-sm">
            ⬇ Export CSV
          </a>
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

      {t.unassignedStay > 0 && (
        <p className="mt-6 rounded-xl border border-leaf/40 bg-leaf/10 px-4 py-3 text-sm text-leaf">
          <strong>{t.unassignedStay}</strong>{" "}
          {t.unassignedStay === 1 ? "person has" : "people have"} no Tadoba room
          assigned yet.
        </p>
      )}

      <div className="mt-8">
        <PlanView people={people} />
      </div>

      {/* ------------------------------------------------------- master -- */}
      <section className="mt-12">
        <h2 className="font-display text-2xl font-bold text-bone">
          📋 Everyone — assign &amp; annotate
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
