import type { CostItem, Participant } from "./types";

/**
 * The money side of the trip, all of it derived. Only what Mayuri types is
 * stored: each bill, who it applies to, and what has come in.
 *
 * Every cost is a total to be divided, so two things follow. A person's share
 * moves whenever the group does — one late joiner re-divides every cost they
 * are part of. And a bill rarely divides cleanly, so the split has to be
 * allocated rather than simply rounded; see `splitOf`.
 */

/** Cancelled people neither pay nor count towards an "everyone" cost. */
export function payers(people: Participant[]): Participant[] {
  return people.filter((p) => p.status !== "Cancelled");
}

export function paysFor(item: CostItem, person: Participant): boolean {
  return item.appliesToAll || item.memberIds.includes(person.id);
}

/** The people a cost is charged to, in a stable order. */
export function payersOf(item: CostItem, people: Participant[]): Participant[] {
  return payers(people)
    .filter((p) => paysFor(item, p))
    .sort((a, b) => a.id.localeCompare(b.id));
}

export function costHeads(item: CostItem, people: Participant[]): number {
  return payersOf(item, people).length;
}

/**
 * How one bill divides, in whole rupees, per person id.
 *
 * ₹8,000 between 26 people is ₹307.69 each, and 26 × ₹308 is ₹8,008 — round
 * every share the same way and the column stops adding up to the bill. So the
 * remainder is handed out a rupee at a time instead: eighteen people pay ₹308
 * and eight pay ₹307, which comes to exactly ₹8,000.
 *
 * Who absorbs the extra rupee is decided by participant id — arbitrary, but
 * stable, so a share doesn't jump around between page loads.
 */
export function splitOf(
  item: CostItem,
  people: Participant[],
): Map<string, number> {
  const share = new Map<string, number>();
  const paying = payersOf(item, people);
  if (paying.length === 0) return share;

  const total = Math.round(item.total);
  const base = Math.floor(total / paying.length);
  let remainder = total - base * paying.length;

  for (const p of paying) {
    share.set(p.id, base + (remainder > 0 ? 1 : 0));
    if (remainder > 0) remainder -= 1;
  }
  return share;
}

export type ShareLine = { item: CostItem; amount: number };

export type Ledger = {
  person: Participant;
  /** The costs charged to them, in the order the costs were entered. */
  lines: ShareLine[];
  share: number;
  paid: number;
  /** Positive: still to pay. Negative: paid more than their share. */
  balance: number;
};

/**
 * Everyone's ledger, biggest outstanding first — that's the chasing list.
 * The splits are computed once per cost rather than per person: each one needs
 * the whole group to divide the bill, so doing it per person would repeat the
 * same division for all twenty-six of them.
 */
export function ledger(people: Participant[], costs: CostItem[]): Ledger[] {
  const splits = costs.map((item) => ({ item, split: splitOf(item, people) }));

  return payers(people)
    .map((person) => {
      const lines: ShareLine[] = [];
      for (const { item, split } of splits) {
        const amount = split.get(person.id);
        if (amount !== undefined) lines.push({ item, amount });
      }
      const share = lines.reduce((sum, l) => sum + l.amount, 0);
      const paid = person.paid || 0;
      return { person, lines, share, paid, balance: share - paid };
    })
    .sort(
      (a, b) => b.balance - a.balance || a.person.name.localeCompare(b.person.name),
    );
}

export function ledgerFor(person: Participant, people: Participant[], costs: CostItem[]): Ledger {
  const found = ledger(people, costs).find((b) => b.person.id === person.id);
  return (
    found ?? { person, lines: [], share: 0, paid: person.paid || 0, balance: -(person.paid || 0) }
  );
}

export type MoneySummary = {
  perItem: Array<{
    item: CostItem;
    heads: number;
    /** What one person pays, for display. Individuals may differ by a rupee. */
    each: number;
  }>;
  headcount: number;
  /**
   * The total of every bill that has somebody to pay it, so this always equals
   * the sum of everyone's shares.
   */
  expected: number;
  /** Bills charged to nobody yet. Nobody owes them, so they'd silently vanish. */
  unallocated: number;
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
    return {
      item,
      heads,
      each: heads > 0 ? Math.round(item.total / heads) : 0,
    };
  });
  const books = ledger(people, costs);

  return {
    perItem,
    headcount: attending.length,
    expected: books.reduce((sum, b) => sum + b.share, 0),
    unallocated: perItem
      .filter((r) => r.heads === 0)
      .reduce((sum, r) => sum + Math.round(r.item.total), 0),
    received: books.reduce((sum, b) => sum + b.paid, 0),
    outstanding: books.reduce((sum, b) => sum + Math.max(0, b.balance), 0),
    overpaid: books.reduce((sum, b) => sum + Math.max(0, -b.balance), 0),
    settled: books.filter((b) => b.share > 0 && b.balance <= 0).length,
  };
}
