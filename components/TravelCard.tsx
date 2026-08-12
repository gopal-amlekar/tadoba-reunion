import Link from "next/link";
import AnimalAvatar from "@/components/AnimalAvatar";
import { prettyDate, prettyTime } from "@/lib/event";
import type { Participant } from "@/lib/types";

/** One person's travel details, as shown on the travel list. */
export default function TravelCard({
  p,
  showGroup = true,
}: {
  p: Participant;
  showGroup?: boolean;
}) {
  return (
    <Link
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
            {showGroup && p.groupName && (
              <div className="mt-0.5 text-xs text-leaf">👥 {p.groupName}</div>
            )}
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
          <div className="mt-1 text-bone">{prettyDate(p.arriveDate)}</div>
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
          <div className="mt-1 text-bone">{prettyDate(p.returnDate)}</div>
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
  );
}
