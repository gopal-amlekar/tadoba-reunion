"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import {
  removeItineraryAction,
  saveItineraryAction,
  type FormState,
} from "@/app/actions";
import {
  PROGRAMME_DAYS,
  formatMoney,
  prettyDate,
  prettyTime,
  programmeDay,
} from "@/lib/event";
import type { ItineraryItem } from "@/lib/types";

/**
 * The programme, day by day. Everyone reads it; Mayuri gets the same page with
 * the editing controls folded in, so there is no second copy of the itinerary
 * living on an admin screen that can drift out of step with this one.
 *
 * Order is derived from date and time rather than stored, so moving something
 * an hour later is just editing its time — there is no separate ordering to
 * keep in sync.
 */

/** What an entry costs, already divided. Computed on the server. */
export type EntryCost = {
  total: number;
  /** What one person pays. Individuals can differ by a rupee; see splitOf. */
  each: number;
  heads: number;
};

const initial: FormState = {};

function CostTag({ cost }: { cost: EntryCost }) {
  return (
    <span className="shrink-0 text-right text-xs whitespace-nowrap">
      <span className="text-amber-glow">{formatMoney(cost.total)}</span>
      {cost.heads > 0 ? (
        <span className="text-bone-dim"> · {formatMoney(cost.each)} each</span>
      ) : (
        <span className="text-tiger"> · nobody charged yet</span>
      )}
    </span>
  );
}

function ItineraryForm({
  item,
  cost,
  onSaved,
}: {
  item?: ItineraryItem;
  cost?: EntryCost;
  onSaved?: () => void;
}) {
  const [state, action, pending] = useActionState(saveItineraryAction, initial);
  const form = useRef<HTMLFormElement>(null);

  // Depends on the whole state object, not state.ok: adding two entries in a
  // row returns `true` both times, and only the fresh object tells them apart.
  useEffect(() => {
    if (!state.ok) return;
    if (item) onSaved?.();
    else form.current?.reset();
  }, [state, item, onSaved]);

  return (
    <form ref={form} action={action} className="space-y-3">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="grid gap-3 sm:grid-cols-[1.3fr_0.8fr_2fr]">
        <div>
          <label className="label">Day</label>
          <select
            name="date"
            defaultValue={item?.date ?? ""}
            className="field !py-2 text-sm"
          >
            <option value="">— choose —</option>
            {PROGRAMME_DAYS.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label} · {d.sub}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Time</label>
          <input
            name="time"
            type="time"
            defaultValue={item?.time ?? ""}
            className="field !py-2 text-sm"
          />
        </div>

        <div>
          <label className="label">What happens</label>
          <input
            name="title"
            defaultValue={item?.title ?? ""}
            placeholder="Convoy leaves Nagpur"
            className="field !py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[2.5fr_1fr]">
        <div>
          <label className="label">Detail (optional)</label>
          <input
            name="detail"
            defaultValue={item?.detail ?? ""}
            placeholder="Be in the hotel lobby by 8:45 — we leave on the dot."
            className="field !py-2 text-sm"
          />
        </div>
        <div>
          <label className="label">Est. cost — whole group</label>
          <input
            name="cost"
            inputMode="decimal"
            defaultValue={cost ? String(cost.total) : ""}
            placeholder="8000"
            className="field !py-2 text-sm"
          />
        </div>
      </div>

      <p className="text-xs text-bone-dim">
        The cost is the total for everybody together, not per head — it gets
        divided on the{" "}
        <Link href="/money" className="text-tiger underline">
          money page
        </Link>
        , where you can also narrow it to just some people. Leave it empty for
        anything free; clear it to drop the cost again.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary !py-2 text-sm">
          {pending ? "Saving…" : item ? "Save changes" : "Add to the programme"}
        </button>
        {item && (
          <button
            type="button"
            onClick={onSaved}
            className="text-sm text-bone-dim underline hover:text-tiger"
          >
            Cancel
          </button>
        )}
        {state.error && (
          <span className="text-sm text-tiger-light">{state.error}</span>
        )}
      </div>
    </form>
  );
}

function Row({
  item,
  cost,
  canEdit,
}: {
  item: ItineraryItem;
  cost?: EntryCost;
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="rounded-xl border border-tiger/40 bg-jungle-950/60 p-4">
        <ItineraryForm
          item={item}
          cost={cost}
          onSaved={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="grid grid-cols-[5.5rem_1fr] gap-3 border-l-2 border-jungle-700 py-2.5 pl-4">
      <span
        className={`font-display text-sm font-semibold ${
          item.time ? "text-tiger" : "text-bone-dim/60"
        }`}
      >
        {item.time ? prettyTime(item.time) : "any time"}
      </span>
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <span className="font-semibold text-bone">{item.title}</span>
          {cost && <CostTag cost={cost} />}
        </div>
        {item.detail && (
          <p className="mt-0.5 text-sm text-bone-dim">{item.detail}</p>
        )}
        {canEdit && (
          <span className="no-print mt-1 flex gap-3 text-xs">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="text-bone-dim underline hover:text-tiger"
            >
              Edit
            </button>
            <form action={removeItineraryAction} className="inline">
              <input type="hidden" name="id" value={item.id} />
              <button
                type="submit"
                className="text-bone-dim underline hover:text-tiger"
              >
                Remove
              </button>
            </form>
          </span>
        )}
      </div>
    </li>
  );
}

export default function ItineraryBoard({
  items,
  costs,
  canEdit,
}: {
  items: ItineraryItem[];
  /** Keyed by itinerary id — only entries that cost something appear. */
  costs: Record<string, EntryCost>;
  canEdit: boolean;
}) {
  // Items arrive already sorted, so the first sighting of each date is also
  // the order the days should appear in.
  const days = [...new Set(items.map((i) => i.date))];

  return (
    <div>
      {days.length === 0 ? (
        <div className="card border-dashed p-8 text-center text-bone-dim">
          The programme isn&apos;t up yet.
          {canEdit
            ? " Add the first thing below and the whole group will see it."
            : " Mayuri is still working it out — check back."}
        </div>
      ) : (
        <div className="space-y-8">
          {days.map((date) => {
            const day = programmeDay(date);
            return (
              <section key={date}>
                <h2 className="flex flex-wrap items-baseline gap-x-3 border-b border-jungle-800 pb-2 font-display text-2xl font-bold text-leaf">
                  {day?.label ?? prettyDate(date)}
                  {day && (
                    <span className="text-sm font-normal text-bone-dim">
                      {day.sub}
                    </span>
                  )}
                </h2>
                <ul className="mt-3">
                  {items
                    .filter((i) => i.date === date)
                    .map((i) => (
                      <Row
                        key={i.id}
                        item={i}
                        cost={costs[i.id]}
                        canEdit={canEdit}
                      />
                    ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {canEdit && (
        <div className="no-print card mt-10 p-5">
          <h3 className="font-display text-lg font-bold text-bone">
            ✎ Add to the programme
          </h3>
          <p className="mt-1 mb-4 text-sm text-bone-dim">
            Everyone sees this the moment you save. Entries sort themselves by
            day and time, so to move something just change its time.
          </p>
          <ItineraryForm />
        </div>
      )}
    </div>
  );
}
