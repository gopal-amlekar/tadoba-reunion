"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { removeCostAction, saveCostAction, type FormState } from "@/app/actions";
import { formatMoney } from "@/lib/event";
import { costHeads, payers } from "@/lib/money";
import type { CostItem, Participant } from "@/lib/types";

/**
 * What the trip costs. Each line is one whole bill, divided between the people
 * it applies to — so "the safari is only for the eighteen who booked" needs no
 * arithmetic from Mayuri, just a ticked list.
 *
 * Lines tied to a programme entry get their name and their total from it. The
 * rest are the extras that belong to no particular event: tips, water, a cake.
 */

const initial: FormState = {};

function CostForm({
  item,
  people,
  onSaved,
}: {
  item?: CostItem;
  people: Participant[];
  onSaved?: () => void;
}) {
  const [state, action, pending] = useActionState(saveCostAction, initial);
  const [everyone, setEveryone] = useState(item ? item.appliesToAll : true);
  const form = useRef<HTMLFormElement>(null);
  const fromProgramme = Boolean(item?.itineraryId);

  useEffect(() => {
    if (!state.ok) return;
    if (item) onSaved?.();
    else {
      form.current?.reset();
      setEveryone(true);
    }
  }, [state, item, onSaved]);

  return (
    <form ref={form} action={action} className="space-y-3">
      {item && <input type="hidden" name="id" value={item.id} />}

      <div className="grid gap-3 sm:grid-cols-[1.6fr_0.9fr_1.8fr]">
        <div>
          <label className="label">What for</label>
          {fromProgramme ? (
            <>
              {/* Named after its programme entry, so renaming happens there. */}
              <input type="hidden" name="label" value={item!.label} />
              <p className="py-2 text-sm font-semibold text-bone">
                {item!.label}
              </p>
            </>
          ) : (
            <input
              name="label"
              defaultValue={item?.label ?? ""}
              placeholder="Tips, water, snacks"
              className="field !py-2 text-sm"
            />
          )}
        </div>
        <div>
          <label className="label">Total — whole group</label>
          <input
            name="total"
            inputMode="decimal"
            defaultValue={item?.total ? String(item.total) : ""}
            placeholder="8000"
            className="field !py-2 text-sm"
          />
        </div>
        <div>
          <label className="label">Note (optional)</label>
          <input
            name="note"
            defaultValue={item?.note ?? ""}
            placeholder="Guides, gate staff, a crate of water"
            className="field !py-2 text-sm"
          />
        </div>
      </div>

      <fieldset>
        <legend className="label">Who splits it</legend>
        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="appliesTo"
              value="all"
              checked={everyone}
              onChange={() => setEveryone(true)}
              className="accent-tiger"
            />
            Everyone
            <span className="text-bone-dim">
              — including anyone who joins later
            </span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="appliesTo"
              value="some"
              checked={!everyone}
              onChange={() => setEveryone(false)}
              className="accent-tiger"
            />
            Only these people
          </label>
        </div>

        {!everyone && (
          <div className="mt-3 grid max-h-64 gap-x-4 gap-y-1.5 overflow-y-auto rounded-xl border border-jungle-700 bg-jungle-950/60 p-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {people.length === 0 ? (
              <p className="text-bone-dim">Nobody on the list yet.</p>
            ) : (
              people.map((p) => (
                <label key={p.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="memberIds"
                    value={p.id}
                    defaultChecked={item?.memberIds.includes(p.id) ?? false}
                    className="accent-tiger"
                  />
                  <span className="truncate">{p.name || "Unnamed"}</span>
                </label>
              ))
            )}
          </div>
        )}
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn-primary !py-2 text-sm">
          {pending ? "Saving…" : item ? "Save changes" : "Add this cost"}
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

function CostRow({
  item,
  people,
  canEdit,
}: {
  item: CostItem;
  people: Participant[];
  canEdit: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const heads = costHeads(item, people);
  const each = heads > 0 ? Math.round(item.total / heads) : 0;

  if (editing) {
    return (
      <li className="border-t border-jungle-800 p-4">
        <CostForm
          item={item}
          people={payers(people)}
          onSaved={() => setEditing(false)}
        />
      </li>
    );
  }

  return (
    <li className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-jungle-800 px-4 py-3 sm:grid-cols-[2fr_1fr_1fr_1fr]">
      <div className="col-span-2 sm:col-span-1">
        <span className="font-semibold text-bone">{item.label}</span>
        {item.itineraryId && (
          <Link
            href="/itinerary"
            className="ml-2 text-xs text-leaf/80 hover:underline"
          >
            from the programme
          </Link>
        )}
        {item.note && (
          <span className="block text-xs text-bone-dim">{item.note}</span>
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
            <form action={removeCostAction} className="inline">
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

      <div className="font-display font-bold text-bone sm:text-right">
        {formatMoney(item.total)}
      </div>

      <div
        className={`text-sm sm:text-right ${
          heads === 0
            ? "text-tiger"
            : item.appliesToAll
              ? "text-bone-dim"
              : "text-leaf"
        }`}
      >
        {heads === 0
          ? "nobody yet"
          : item.appliesToAll
            ? `Everyone · ${heads}`
            : `${heads} ${heads === 1 ? "person" : "people"}`}
      </div>

      <div className="text-sm sm:text-right">
        {heads === 0 ? (
          <span className="text-bone-dim">—</span>
        ) : (
          <>
            <span className="text-tiger">{formatMoney(each)}</span>
            <span className="text-xs text-bone-dim"> each</span>
          </>
        )}
      </div>
    </li>
  );
}

export default function CostBoard({
  costs,
  people,
  canEdit,
}: {
  costs: CostItem[];
  people: Participant[];
  canEdit: boolean;
}) {
  // Cancelled people can't be charged, so they're not offered as payers either.
  const attending = payers(people);
  const grandTotal = costs.reduce((sum, c) => sum + c.total, 0);

  return (
    <div>
      {costs.length === 0 ? (
        <div className="card border-dashed p-8 text-center text-bone-dim">
          No costs entered yet.
          {canEdit ? (
            <>
              {" "}
              Put an estimate on a{" "}
              <Link href="/itinerary" className="text-tiger underline">
                programme entry
              </Link>
              , or add an extra below.
            </>
          ) : (
            " Mayuri will put the numbers up once the bookings are firm."
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden px-4 pt-3 pb-1 text-xs font-semibold tracking-wider text-leaf/70 uppercase sm:grid sm:grid-cols-[2fr_1fr_1fr_1fr] sm:gap-x-4">
            <span>What for</span>
            <span className="text-right">Whole bill</span>
            <span className="text-right">Split between</span>
            <span className="text-right">Works out at</span>
          </div>
          <ul>
            {costs.map((c) => (
              <CostRow key={c.id} item={c} people={people} canEdit={canEdit} />
            ))}
          </ul>
          <div className="flex justify-between gap-4 border-t border-jungle-700 bg-jungle-950/40 px-4 py-3">
            <span className="font-semibold text-bone">Whole trip</span>
            <span className="font-display text-lg font-bold text-bone">
              {formatMoney(grandTotal)}
            </span>
          </div>
        </div>
      )}

      {canEdit && (
        <div className="no-print card mt-6 p-5">
          <h3 className="font-display text-lg font-bold text-bone">
            ✎ Add an extra
          </h3>
          <p className="mt-1 mb-4 text-sm text-bone-dim">
            For the things that belong to no particular event — tips, water,
            snacks for the drive, a cake. Anything tied to something on the{" "}
            <Link href="/itinerary" className="text-tiger underline">
              programme
            </Link>{" "}
            is better added there, so the two stay together.
          </p>
          <CostForm people={attending} />
        </div>
      )}
    </div>
  );
}
