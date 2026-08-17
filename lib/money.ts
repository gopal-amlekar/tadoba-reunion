import type { CostItem, Participant } from "./types";

/**
 * The money side of the trip, all of it derived.
 *
 * Costs are per-head rates rather than lump sums, so a person's share is a
 * plain sum of the rates that apply to them — no division, no rounding, and
 * nobody's number moves because somebody else joined late. Only what Mayuri
 * types is stored: the rates, who each one applies to, and what has come in.
 */

/** Cancelled people neither pay nor count towards an "everyone" cost. */
export function payers(people: Participant[]): Participant[] {
  return people.filter((p) => p.status !== "Cancelled");
}

export function paysFor(item: CostItem, person: Participant): boolean {
  return item.appliesToAll || item.memberIds.includes(person.id);
}

/** How many still-attending people a cost is charged to. */
export function costHeads(item: CostItem, people: Participant[]): number {
  return payers(people).filter((p) => paysFor(item, p)).length;
}

export type ShareLine = { item: CostItem; amount: number };

export type Ledger = {
  person: Participant;
  /** The cost items that apply to them, in the order they were entered. */
  lines: ShareLine[];
  share: number;
  paid: number;
  /** Positive: still to pay. Negative: paid more than their share. */
  balance: number;
};

export function ledgerFor(person: Participant, costs: CostItem[]): Ledger {
  const lines = costs
    .filter((item) => paysFor(item, person))
    .map((item) => ({ item, amount: item.amount }));
  const share = lines.reduce((sum, l) => sum + l.amount, 0);
  const paid = person.paid || 0;
  return { person, lines, share, paid, balance: share - paid };
}

/** Everyone's ledger, biggest outstanding first — that's the chasing list. */
export function ledger(people: Participant[], costs: CostItem[]): Ledger[] {
  return payers(people)
    .map((p) => ledgerFor(p, costs))
    .sort((a, b) => b.balance - a.balance || a.person.name.localeCompare(b.person.name));
}

export type MoneySummary = {
  perItem: Array<{ item: CostItem; heads: number; total: number }>;
  headcount: number;
  /** What the trip costs in total, once every rate is multiplied out. */
  expected: number;
  received: number;
  /** Sum of what people still owe — not expected − received, because an
   *  overpayment by one person must not hide someone else's shortfall. */
  outstanding: number;
  overpaid: number;
  settled: number;
};

export function moneySummary(
  people: Participant[],
  costs: CostItem[],
): MoneySummary {
  const attending = payers(people);
  const perItem = costs.map((item) => {
    const heads = costHeads(item, people);
    return { item, heads, total: heads * item.amount };
  });
  const books = attending.map((p) => ledgerFor(p, costs));

  return {
    perItem,
    headcount: attending.length,
    expected: perItem.reduce((sum, r) => sum + r.total, 0),
    received: books.reduce((sum, b) => sum + b.paid, 0),
    outstanding: books.reduce((sum, b) => sum + Math.max(0, b.balance), 0),
    overpaid: books.reduce((sum, b) => sum + Math.max(0, -b.balance), 0),
    settled: books.filter((b) => b.share > 0 && b.balance <= 0).length,
  };
}
