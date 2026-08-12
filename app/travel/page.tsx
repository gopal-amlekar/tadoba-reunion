import Link from "next/link";
import { redirect } from "next/navigation";
import TravelCard from "@/components/TravelCard";
import { getRole, getWho } from "@/lib/auth";
import { listParticipants, listSafaris } from "@/lib/db";
import { prettyTime, safariSlot } from "@/lib/event";
import { listGroups, ungrouped } from "@/lib/groups";

export const dynamic = "force-dynamic";

export default async function TravelPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; view?: string }>;
}) {
  const role = await getRole();
  if (!role) redirect("/unlock");

  const { saved, view } = await searchParams;
  const byGroup = view === "groups";
  const who = await getWho();
  const everyone = await listParticipants();
  const safaris = await listSafaris();

  const active = everyone.filter((p) => p.status !== "Cancelled");
  const groups = listGroups(active);
  const alone = ungrouped(active);
  const cancelled = everyone.filter((p) => p.status === "Cancelled");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {saved && (
        <div className="mb-6 rounded-xl border border-leaf/40 bg-leaf/10 px-4 py-3 text-leaf">
          Saved — {saved}&apos;s travel details are in. 🎉
        </div>
      )}

      {safaris.length > 0 && (
        <Link
          href="/plan"
          className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-tiger/40 bg-tiger/5 px-4 py-3 text-sm transition hover:border-tiger"
        >
          <span className="font-semibold text-tiger">🐅 Safari</span>
          {safaris.map((s) => (
            <span key={s.id} className="text-bone-dim">
              <span className="text-bone">
                {safariSlot(s.slot)?.short ?? s.slot}
              </span>{" "}
              — report at{" "}
              <strong className="text-bone">{prettyTime(s.time)}</strong>
            </span>
          ))}
        </Link>
      )}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-bold text-bone">
            Travel plans
          </h1>
          <p className="mt-1 text-bone-dim">
            {everyone.length}{" "}
            {everyone.length === 1 ? "entry" : "entries"} so far. Anyone can add
            or fix anyone&apos;s details — every change is logged
            {who && <> under your name, {who}</>}.
          </p>
        </div>
        <Link href="/travel/new" className="btn-primary">
          + Add someone
        </Link>
      </div>

      {/* --------------------------------------------------- view switch -- */}
      {everyone.length > 0 && (
        <div className="mt-6 inline-flex rounded-xl border border-jungle-700 bg-jungle-900/60 p-1">
          <Link
            href="/travel"
            className={`rounded-lg px-4 py-1.5 text-sm transition ${
              byGroup
                ? "text-bone-dim hover:text-leaf"
                : "bg-jungle-800 font-semibold text-tiger"
            }`}
          >
            Everyone
          </Link>
          <Link
            href="/travel?view=groups"
            className={`rounded-lg px-4 py-1.5 text-sm transition ${
              byGroup
                ? "bg-jungle-800 font-semibold text-tiger"
                : "text-bone-dim hover:text-leaf"
            }`}
          >
            By group{groups.length > 0 && ` (${groups.length})`}
          </Link>
        </div>
      )}

      {everyone.length === 0 ? (
        <div className="card mt-8 p-8 text-center">
          <p className="text-bone-dim">
            Empty so far. Add yourself, then nudge the group.
          </p>
          <Link href="/travel/new" className="btn-primary mt-4">
            Add the first entry
          </Link>
        </div>
      ) : byGroup ? (
        /* ------------------------------------------------ grouped view -- */
        <div className="mt-8 space-y-10">
          {groups.length === 0 && (
            <div className="card p-6 text-bone-dim">
              Nobody is grouped yet.{" "}
              <Link href="/groups" className="text-tiger underline">
                Put people who travel together into a group
              </Link>{" "}
              and they&apos;ll show up here as one party.
            </div>
          )}

          {groups.map((g) => (
            <section key={g.id}>
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-jungle-800 pb-2">
                <h2 className="font-display text-2xl font-bold text-leaf">
                  👥 {g.name}
                </h2>
                <span className="text-sm text-bone-dim">
                  {g.members.length}{" "}
                  {g.members.length === 1 ? "person" : "people"} ·{" "}
                  <Link href="/groups" className="text-tiger hover:underline">
                    edit group
                  </Link>
                </span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {g.members.map((p) => (
                  <TravelCard key={p.id} p={p} showGroup={false} />
                ))}
              </div>
            </section>
          ))}

          {alone.length > 0 && (
            <section>
              <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-jungle-800 pb-2">
                <h2 className="font-display text-2xl font-bold text-bone-dim">
                  Travelling on their own
                </h2>
                <span className="text-sm text-bone-dim">
                  {alone.length} {alone.length === 1 ? "person" : "people"}
                </span>
              </div>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {alone.map((p) => (
                  <TravelCard key={p.id} p={p} />
                ))}
              </div>
            </section>
          )}

          {cancelled.length > 0 && (
            <section>
              <h2 className="border-b border-jungle-800 pb-2 font-display text-2xl font-bold text-bone-dim">
                Cancelled
              </h2>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {cancelled.map((p) => (
                  <TravelCard key={p.id} p={p} />
                ))}
              </div>
            </section>
          )}
        </div>
      ) : (
        /* --------------------------------------------------- flat view -- */
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {everyone.map((p) => (
            <TravelCard key={p.id} p={p} />
          ))}
        </div>
      )}
    </div>
  );
}
