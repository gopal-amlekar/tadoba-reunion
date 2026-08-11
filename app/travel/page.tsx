import Link from "next/link";
import { redirect } from "next/navigation";
import AnimalAvatar from "@/components/AnimalAvatar";
import { getRole, getWho } from "@/lib/auth";
import { listParticipants } from "@/lib/db";
import { prettyDate, prettyTime } from "@/lib/event";

export const dynamic = "force-dynamic";

export default async function TravelPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const role = await getRole();
  if (!role) redirect("/unlock");

  const { saved } = await searchParams;
  const who = await getWho();
  const everyone = await listParticipants();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {saved && (
        <div className="mb-6 rounded-xl border border-leaf/40 bg-leaf/10 px-4 py-3 text-leaf">
          Saved — {saved}&apos;s travel details are in. 🎉
        </div>
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

      {everyone.length === 0 ? (
        <div className="card mt-8 p-8 text-center">
          <p className="text-bone-dim">
            Empty so far. Add yourself, then nudge the group.
          </p>
          <Link href="/travel/new" className="btn-primary mt-4">
            Add the first entry
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {everyone.map((p) => (
            <Link
              key={p.id}
              href={`/travel/${p.id}`}
              className="card block p-5 transition hover:border-tiger/60"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AnimalAvatar name={p.name} size={52} />
                  <div>
                    <div className="font-display text-xl font-bold text-bone">
                      {p.name}
                    </div>
                    <div className="text-sm text-bone-dim">
                      {p.city || "City not given"}
                      {p.food && ` · ${p.food}`}
                    </div>
                  </div>
                </div>
                <span
                  className={`chip ${
                    p.status === "Cancelled"
                      ? "!border-bone-dim/40 !text-bone-dim line-through"
                      : p.status === "Tentative"
                        ? "!border-amber-glow/40 !text-amber-glow"
                        : "!border-leaf/40 !text-leaf"
                  }`}
                >
                  {p.status || "Confirmed"}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg border border-jungle-800 bg-jungle-950/50 p-3">
                  <div className="text-[10px] font-semibold tracking-wider text-leaf uppercase">
                    Arriving
                  </div>
                  <div className="mt-1 text-bone">
                    {prettyDate(p.arriveDate)}
                  </div>
                  <div className="text-bone-dim">
                    {prettyTime(p.arriveTime)}
                    {p.arriveGateway && ` · ${p.arriveGateway}`}
                  </div>
                  {p.arriveMode && (
                    <div className="mt-1 text-xs text-bone-dim">
                      {p.arriveMode}
                      {p.arriveDetails && ` · ${p.arriveDetails}`}
                    </div>
                  )}
                </div>

                <div className="rounded-lg border border-jungle-800 bg-jungle-950/50 p-3">
                  <div className="text-[10px] font-semibold tracking-wider text-tiger uppercase">
                    Returning
                  </div>
                  <div className="mt-1 text-bone">
                    {prettyDate(p.returnDate)}
                  </div>
                  <div className="text-bone-dim">
                    {prettyTime(p.returnTime)}
                    {p.returnGateway && ` · ${p.returnGateway}`}
                  </div>
                  {p.returnMode && (
                    <div className="mt-1 text-xs text-bone-dim">
                      {p.returnMode}
                      {p.returnDetails && ` · ${p.returnDetails}`}
                    </div>
                  )}
                </div>
              </div>

              {(p.stayAssigned || p.stayPreference) && (
                <p className="mt-3 text-xs text-bone-dim">
                  <span className="text-amber-glow">Stay:</span>{" "}
                  {p.stayAssigned || `${p.stayPreference} (suggested)`}
                </p>
              )}
              {p.notes && (
                <p className="mt-2 line-clamp-2 text-xs text-bone-dim italic">
                  “{p.notes}”
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
