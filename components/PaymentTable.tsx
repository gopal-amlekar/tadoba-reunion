"use client";

import { useActionState, useEffect, useState } from "react";
import { recordPaymentAction, type FormState } from "@/app/actions";
import { formatMoney } from "@/lib/event";
import type { Ledger } from "@/lib/money";

/**
 * Share, received, balance — one line per person, open to the whole group.
 * Showing everyone's balance to everyone is the point: it's how a group of
 * friends settles up without Mayuri sending twenty-six separate reminders.
 */

const initial: FormState = {};

function balanceLabel(balance: number): { text: string; tone: string } {
  if (Math.abs(balance) < 0.005) return { text: "Settled ✓", tone: "text-leaf" };
  if (balance > 0)
    return { text: `${formatMoney(balance)} to pay`, tone: "text-tiger" };
  return {
    text: `${formatMoney(-balance)} back`,
    tone: "text-amber-glow",
  };
}

function PaymentRow({
  book,
  canEdit,
  isYou,
}: {
  book: Ledger;
  canEdit: boolean;
  isYou: boolean;
}) {
  const [state, action, pending] = useActionState(recordPaymentAction, initial);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (state.ok) setEditing(false);
  }, [state]);

  const { text, tone } = balanceLabel(book.balance);

  return (
    <li
      className={`border-t border-jungle-800 px-4 py-3 ${
        isYou ? "bg-tiger/5" : ""
      }`}
    >
      <div className="grid grid-cols-2 items-baseline gap-x-4 gap-y-1 sm:grid-cols-[2fr_1fr_1fr_1.3fr]">
        <div className="col-span-2 sm:col-span-1">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="text-left font-semibold text-bone hover:text-tiger"
          >
            {book.person.name || "Unnamed"}
            <span className="ml-2 text-xs font-normal text-bone-dim">
              {open ? "▴" : "▾"}
            </span>
          </button>
          {isYou && (
            <span className="ml-2 text-xs text-tiger">that&apos;s you</span>
          )}
          {book.person.status === "Tentative" && (
            <span className="ml-2 text-xs text-amber-glow">maybe</span>
          )}
        </div>

        <div className="text-sm sm:text-right">
          <span className="text-bone-dim sm:hidden">Share </span>
          <span className="text-bone">{formatMoney(book.share)}</span>
        </div>

        <div className="text-sm sm:text-right">
          <span className="text-bone-dim sm:hidden">Paid </span>
          <span className={book.paid > 0 ? "text-leaf" : "text-bone-dim"}>
            {formatMoney(book.paid)}
          </span>
        </div>

        <div className={`col-span-2 text-sm font-semibold sm:col-span-1 sm:text-right ${tone}`}>
          {text}
        </div>
      </div>

      {open && (
        <div className="mt-3 rounded-xl border border-jungle-800 bg-jungle-950/50 p-3 text-sm">
          {book.lines.length === 0 ? (
            <p className="text-bone-dim">
              Nothing charged to {book.person.name || "them"} yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {book.lines.map((l) => (
                <li key={l.item.id} className="flex justify-between gap-4">
                  <span className="text-bone-dim">{l.item.label}</span>
                  <span className="text-bone">{formatMoney(l.amount)}</span>
                </li>
              ))}
              <li className="flex justify-between gap-4 border-t border-jungle-800 pt-1 font-semibold">
                <span className="text-bone">Their share</span>
                <span className="text-bone">{formatMoney(book.share)}</span>
              </li>
            </ul>
          )}
          {book.person.paidNote && (
            <p className="mt-2 border-t border-jungle-800 pt-2 text-xs text-bone-dim">
              <span className="text-leaf">Received:</span>{" "}
              {book.person.paidNote}
            </p>
          )}
        </div>
      )}

      {canEdit &&
        (editing ? (
          <form action={action} className="no-print mt-3 space-y-2">
            <input type="hidden" name="id" value={book.person.id} />
            <div className="grid gap-2 sm:grid-cols-[0.8fr_2fr_auto]">
              <input
                name="paid"
                inputMode="decimal"
                defaultValue={book.paid ? String(book.paid) : ""}
                placeholder="Total received"
                aria-label={`Total received from ${book.person.name}`}
                className="field !py-1.5 text-sm"
              />
              <input
                name="paidNote"
                defaultValue={book.person.paidNote}
                placeholder="UPI 12 Oct ₹3000 + cash ₹1500"
                aria-label={`Payment note for ${book.person.name}`}
                className="field !py-1.5 text-sm"
              />
              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={pending}
                  className="btn-primary !py-1.5 text-sm"
                >
                  {pending ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="text-sm text-bone-dim underline hover:text-tiger"
                >
                  Cancel
                </button>
              </div>
            </div>
            {state.error && (
              <p className="text-sm text-tiger-light">{state.error}</p>
            )}
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="no-print mt-2 text-xs text-bone-dim underline hover:text-tiger"
          >
            {book.paid > 0 ? "Update what's received" : "Record a payment"}
          </button>
        ))}
    </li>
  );
}

export default function PaymentTable({
  books,
  canEdit,
  you,
}: {
  books: Ledger[];
  canEdit: boolean;
  /** The name typed at the unlock screen, so people can find their own line. */
  you: string;
}) {
  if (books.length === 0) {
    return (
      <div className="card border-dashed p-8 text-center text-bone-dim">
        Nobody on the list yet.
      </div>
    );
  }

  const yours = you.trim().toLowerCase();

  return (
    <div className="card overflow-hidden">
      <div className="hidden px-4 pt-3 pb-1 text-xs font-semibold tracking-wider text-leaf/70 uppercase sm:grid sm:grid-cols-[2fr_1fr_1fr_1.3fr] sm:gap-x-4">
        <span>Who</span>
        <span className="text-right">Their share</span>
        <span className="text-right">Received</span>
        <span className="text-right">Balance</span>
      </div>
      <ul>
        {books.map((b) => (
          <PaymentRow
            key={b.person.id}
            book={b}
            canEdit={canEdit}
            isYou={
              yours.length > 0 && b.person.name.trim().toLowerCase() === yours
            }
          />
        ))}
      </ul>
    </div>
  );
}
