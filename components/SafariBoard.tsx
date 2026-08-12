import { prettyTime, safariSlot } from "@/lib/event";
import type { Safari } from "@/lib/types";

/**
 * The safari times, shown to everyone. This is the one thing on the site people
 * will check on the morning itself, so it leads the plan rather than sitting
 * at the bottom with the logistics.
 */
export default function SafariBoard({ safaris }: { safaris: Safari[] }) {
  if (safaris.length === 0) {
    return (
      <div className="card border-dashed p-5">
        <h2 className="font-display text-xl font-bold text-bone-dim">
          🐅 Safari times
        </h2>
        <p className="mt-1 text-sm text-bone-dim">
          Not booked yet. Mayuri will put the reporting times here once the
          gypsies are confirmed.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-tiger/40 bg-tiger/5 p-5">
      <h2 className="font-display text-xl font-bold text-tiger">
        🐅 Safari times
      </h2>
      <p className="mt-1 text-sm text-bone-dim">
        Reporting times at the gate — the gypsies leave on the dot, so be early.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {safaris.map((s) => {
          const slot = safariSlot(s.slot);
          return (
            <div
              key={s.id}
              className="rounded-xl border border-jungle-700 bg-jungle-950/60 p-4"
            >
              <div className="font-display text-sm font-semibold tracking-wide text-leaf uppercase">
                {slot?.short ?? s.slot}
              </div>
              <div className="mt-1 font-display text-3xl font-bold text-bone">
                {prettyTime(s.time)}
              </div>
              {s.note && (
                <p className="mt-2 text-sm text-bone-dim">{s.note}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
