"use client";

import { useActionState } from "react";
import {
  addSafariAction,
  removeSafariAction,
  type FormState,
} from "@/app/actions";
import { SAFARI_SLOTS, prettyTime, safariSlot } from "@/lib/event";
import type { Safari } from "@/lib/types";

const initial: FormState = {};

export default function SafariEditor({ safaris }: { safaris: Safari[] }) {
  const [state, action, pending] = useActionState(addSafariAction, initial);

  // Both slots booked already? Then adding another is almost certainly a slip.
  const bookedSlots = new Set(safaris.map((s) => s.slot));

  return (
    <div className="card p-5">
      <h2 className="font-display text-2xl font-bold text-tiger">
        🐅 Safari booking
      </h2>
      <p className="mt-1 text-sm text-bone-dim">
        Set the reporting time for each drive. Everyone sees this on the plan as
        soon as you save it.
      </p>

      {safaris.length > 0 && (
        <ul className="mt-4 space-y-2">
          {safaris.map((s) => (
            <li
              key={s.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-jungle-800 bg-jungle-950/50 px-3 py-2"
            >
              <div className="text-sm">
                <span className="font-semibold text-bone">
                  {safariSlot(s.slot)?.short ?? s.slot}
                </span>
                <span className="text-tiger"> · {prettyTime(s.time)}</span>
                {s.note && (
                  <span className="text-bone-dim"> · {s.note}</span>
                )}
              </div>
              <form action={removeSafariAction}>
                <input type="hidden" name="id" value={s.id} />
                <button
                  type="submit"
                  className="text-xs text-bone-dim underline hover:text-tiger"
                >
                  Remove
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      <form action={action} className="mt-4 border-t border-jungle-800 pt-4">
        <div className="grid gap-3 sm:grid-cols-[1.4fr_0.8fr_2fr_auto]">
          <div>
            <label className="label" htmlFor="safari-slot">
              Which drive
            </label>
            <select
              id="safari-slot"
              name="slot"
              defaultValue=""
              className="field !py-2 text-sm"
            >
              <option value="">— choose —</option>
              {SAFARI_SLOTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                  {bookedSlots.has(s.value) ? " (already set)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label" htmlFor="safari-time">
              Report at
            </label>
            <input
              id="safari-time"
              name="time"
              type="time"
              className="field !py-2 text-sm"
            />
          </div>

          <div>
            <label className="label" htmlFor="safari-note">
              Note (optional)
            </label>
            <input
              id="safari-note"
              name="note"
              placeholder="Moharli gate · 4 gypsies booked"
              className="field !py-2 text-sm"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={pending}
              className="btn-primary !py-2 text-sm"
            >
              {pending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {state.error && (
          <p className="mt-2 text-sm text-tiger-light">{state.error}</p>
        )}
      </form>
    </div>
  );
}
