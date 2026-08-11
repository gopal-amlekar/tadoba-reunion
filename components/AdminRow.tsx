import Link from "next/link";
import AnimalAvatar from "@/components/AnimalAvatar";
import { adminUpdateAction } from "@/app/actions";
import { MAIN_DAY, prettyDate, prettyStamp, prettyTime, STATUSES } from "@/lib/event";
import { headcount, type Participant } from "@/lib/types";

/**
 * One participant as Mayuri sees them: their travel facts read-only on the
 * left, her four planning fields editable on the right.
 */
export default function AdminRow({
  p,
  stayOptions,
  preNightOptions,
  vehicleOptions,
}: {
  p: Participant;
  stayOptions: string[];
  preNightOptions: string[];
  vehicleOptions: string[];
}) {
  // Only people landing before the main day need a bed for the night before.
  const arrivesEarly = Boolean(p.arriveDate && p.arriveDate < MAIN_DAY);
  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <AnimalAvatar name={p.name} size={46} />
          <div>
          <Link
            href={`/travel/${p.id}`}
            className="font-display text-xl font-bold text-bone hover:text-tiger"
          >
            {p.name}
          </Link>
          <div className="text-sm text-bone-dim">
            {p.city || "City not given"}
            {headcount(p) > 1 &&
              ` · ${headcount(p)} heads (${1 + p.guestsAdults} adult${
                1 + p.guestsAdults > 1 ? "s" : ""
              }${p.guestsKids ? `, ${p.guestsKids} kid${p.guestsKids > 1 ? "s" : ""}` : ""})`}
            {p.food && ` · ${p.food}`}
            {p.phone && ` · ${p.phone}`}
          </div>
          </div>
        </div>
        <span
          className={`chip ${
            p.status === "Cancelled"
              ? "!border-bone-dim/40 !text-bone-dim"
              : p.status === "Tentative"
                ? "!border-amber-glow/40 !text-amber-glow"
                : "!border-leaf/40 !text-leaf"
          }`}
        >
          {p.status || "Confirmed"}
        </span>
      </div>

      <div className="mt-3 grid gap-2 text-xs text-bone-dim sm:grid-cols-2">
        <div>
          <span className="text-leaf">In</span> {prettyDate(p.arriveDate)}{" "}
          {prettyTime(p.arriveTime)} · {p.arriveGateway || "gateway TBD"} ·{" "}
          {p.arriveMode || "mode TBD"}
          {p.arriveDetails && ` · ${p.arriveDetails}`}
        </div>
        <div>
          <span className="text-tiger">Out</span> {prettyDate(p.returnDate)}{" "}
          {prettyTime(p.returnTime)} · {p.returnGateway || "gateway TBD"} ·{" "}
          {p.returnMode || "mode TBD"}
          {p.returnDetails && ` · ${p.returnDetails}`}
        </div>
      </div>

      {(p.stayPreference || p.notes) && (
        <div className="mt-3 space-y-1 rounded-lg border border-jungle-800 bg-jungle-950/50 p-3 text-xs">
          {p.stayPreference && (
            <p className="text-bone-dim">
              <span className="text-amber-glow">Their stay suggestion:</span>{" "}
              {p.stayPreference}
            </p>
          )}
          {p.notes && (
            <p className="text-bone-dim italic">“{p.notes}”</p>
          )}
        </div>
      )}

      <form
        action={adminUpdateAction}
        className="mt-4 grid gap-3 border-t border-jungle-800 pt-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <input type="hidden" name="id" value={p.id} />

        <div>
          <label className="label" htmlFor={`stay-${p.id}`}>
            Tadoba stay
          </label>
          <input
            id={`stay-${p.id}`}
            name="stayAssigned"
            defaultValue={p.stayAssigned}
            list="stay-options"
            placeholder="Resort / room"
            className="field !py-2 text-sm"
          />
        </div>

        <div>
          <label className="label" htmlFor={`prenight-${p.id}`}>
            Night before
          </label>
          <input
            id={`prenight-${p.id}`}
            name="preNightStay"
            defaultValue={p.preNightStay}
            list="prenight-options"
            // readOnly rather than disabled: a disabled input posts nothing, which
            // would silently wipe a booking if someone edits their arrival date.
            readOnly={!arrivesEarly}
            placeholder={
              arrivesEarly
                ? `Hotel in ${p.arriveGateway || "arrival city"}`
                : "Not needed — arrives on the day"
            }
            className={`field !py-2 text-sm ${
              arrivesEarly ? "" : "cursor-not-allowed opacity-40"
            }`}
          />
        </div>

        <div>
          <label className="label" htmlFor={`vehicle-${p.id}`}>
            Vehicle group
          </label>
          <input
            id={`vehicle-${p.id}`}
            name="vehicleGroup"
            defaultValue={p.vehicleGroup}
            list="vehicle-options"
            placeholder="e.g. Nagpur TT-1"
            className="field !py-2 text-sm"
          />
        </div>

        <div>
          <label className="label" htmlFor={`status-${p.id}`}>
            Status
          </label>
          <select
            id={`status-${p.id}`}
            name="status"
            defaultValue={p.status || "Confirmed"}
            className="field !py-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label" htmlFor={`notes-${p.id}`}>
            Your notes
          </label>
          <input
            id={`notes-${p.id}`}
            name="adminNotes"
            defaultValue={p.adminNotes}
            placeholder="Private to you"
            className="field !py-2 text-sm"
          />
        </div>

        <div className="sm:col-span-2 lg:col-span-5">
          <button type="submit" className="btn-ghost !py-2 text-sm">
            Save
          </button>
          <span className="ml-3 text-xs text-bone-dim">
            Updated {prettyStamp(p.updatedAt)}
            {p.updatedBy && ` by ${p.updatedBy}`}
          </span>
        </div>
      </form>

      {/* Shared suggestion lists so repeat values are one keystroke. */}
      <datalist id="stay-options">
        {stayOptions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <datalist id="prenight-options">
        {preNightOptions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <datalist id="vehicle-options">
        {vehicleOptions.map((v) => (
          <option key={v} value={v} />
        ))}
      </datalist>
    </div>
  );
}
