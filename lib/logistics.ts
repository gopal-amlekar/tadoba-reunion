import { EVENT, MAIN_DAY, SLOTS, prettyDate, slotFor } from "./event";
import { headcount, type Participant } from "./types";

/**
 * The whole point of the admin page: turn 30 individual rows into the handful
 * of decisions Mayuri actually has to make — how many vehicles, from where,
 * at what time, and how many beds and plates.
 */

export type Run = {
  date: string;
  gateway: string;
  slot: string;
  people: Participant[];
  heads: number;
};

const SLOT_ORDER = new Map<string, number>(
  SLOTS.map((s, i) => [s.label as string, i]),
);
SLOT_ORDER.set("Time not given", SLOTS.length);

/** Group by date → gateway → time-of-day bucket. One group = one vehicle run. */
export function buildRuns(
  people: Participant[],
  direction: "arrive" | "return",
): Run[] {
  const active = people.filter((p) => p.status !== "Cancelled");
  const runs = new Map<string, Run>();

  for (const p of active) {
    const date = direction === "arrive" ? p.arriveDate : p.returnDate;
    const time = direction === "arrive" ? p.arriveTime : p.returnTime;
    const gatewayRaw =
      direction === "arrive" ? p.arriveGateway : p.returnGateway;

    const gateway = gatewayRaw || "Gateway not given";
    const slot = slotFor(time);
    const key = `${date || "zzz-unknown"}|${gateway}|${slot}`;

    const run = runs.get(key) ?? {
      date: date || "",
      gateway,
      slot,
      people: [],
      heads: 0,
    };
    run.people.push(p);
    run.heads += headcount(p);
    runs.set(key, run);
  }

  return [...runs.values()]
    .map((r) => ({
      ...r,
      people: r.people.sort((a, b) =>
        (direction === "arrive" ? a.arriveTime : a.returnTime).localeCompare(
          direction === "arrive" ? b.arriveTime : b.returnTime,
        ),
      ),
    }))
    .sort(
      (a, b) =>
        (a.date || "zzz").localeCompare(b.date || "zzz") ||
        a.gateway.localeCompare(b.gateway) ||
        (SLOT_ORDER.get(a.slot) ?? 99) - (SLOT_ORDER.get(b.slot) ?? 99),
    );
}

/**
 * A rough vehicle call for a run. Tempo Traveller ≈ 12 seats, Innova ≈ 6.
 * Meant as a starting point for the phone call to the travel desk, not gospel.
 */
export function suggestVehicles(heads: number): string {
  if (heads === 0) return "—";
  if (heads <= 3) return "1 sedan";
  if (heads <= 6) return "1 Innova";
  if (heads <= 12) return "1 Tempo Traveller";
  const tt = Math.floor(heads / 12);
  const rest = heads % 12;
  const extra = rest === 0 ? "" : rest <= 6 ? " + 1 Innova" : " + 1 Tempo Traveller";
  return `${tt} Tempo Traveller${tt > 1 ? "s" : ""}${extra}`;
}

/** People who drive themselves need no vehicle booked for them. */
function isSelfDriven(gateway: string): boolean {
  return gateway.toLowerCase().includes("straight to the resort");
}

/**
 * The actual road leg to arrange, written the way you'd say it on the phone:
 * "Nagpur → Tadoba", not "Nagpur, arrivals".
 */
export function legTitle(run: Run, direction: "arrive" | "return"): string {
  if (isSelfDriven(run.gateway)) {
    return direction === "arrive"
      ? "Driving straight in — no pickup"
      : "Driving out — no drop";
  }
  if (run.gateway === "Gateway not given") {
    return direction === "arrive" ? "Route not known yet" : "Route not known yet";
  }
  return direction === "arrive"
    ? `${run.gateway} → Tadoba`
    : `Tadoba → ${run.gateway}`;
}

export function runWhen(run: Run): string {
  return `${prettyDate(run.date)} · ${run.slot}`;
}

export function runNeedsVehicle(run: Run): boolean {
  return !isSelfDriven(run.gateway);
}

/**
 * Anyone landing before the main day sleeps somewhere in between — normally a
 * hotel at their arrival city, occasionally the resort itself. This is the list
 * Mayuri books those rooms from.
 */
export type EarlyGroup = {
  gateway: string;
  date: string;
  people: Participant[];
  heads: number;
  unplaced: number;
};

export function earlyArrivals(people: Participant[]): EarlyGroup[] {
  const early = people.filter(
    (p) =>
      p.status !== "Cancelled" &&
      p.arriveDate &&
      // ISO dates compare correctly as plain strings.
      p.arriveDate < MAIN_DAY,
  );

  const groups = new Map<string, EarlyGroup>();
  for (const p of early) {
    const gateway = p.arriveGateway || "Arrival place not given";
    const key = `${p.arriveDate}|${gateway}`;
    const g = groups.get(key) ?? {
      gateway,
      date: p.arriveDate,
      people: [],
      heads: 0,
      unplaced: 0,
    };
    g.people.push(p);
    g.heads += headcount(p);
    if (!p.preNightStay) g.unplaced += 1;
    groups.set(key, g);
  }

  return [...groups.values()]
    .map((g) => ({
      ...g,
      people: g.people.sort((a, b) => a.arriveTime.localeCompare(b.arriveTime)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.gateway.localeCompare(b.gateway));
}

/** Total beds needed for the pre-event night, for a quick sanity check. */
export function earlyNightHeads(people: Participant[]): number {
  return earlyArrivals(people).reduce((n, g) => n + g.heads, 0);
}

export const VENUE_SHORT = EVENT.venue.split("-")[0].trim();

export type Totals = {
  entries: number;
  heads: number;
  adults: number;
  kids: number;
  confirmed: number;
  tentative: number;
  cancelled: number;
  food: Record<string, number>;
  unassignedStay: number;
  missingTravel: number;
};

export function totals(people: Participant[]): Totals {
  const active = people.filter((p) => p.status !== "Cancelled");
  const food: Record<string, number> = {};

  for (const p of active) {
    const key = p.food || "Not given";
    // Food counts are per plate, so the whole family counts, not just the member.
    food[key] = (food[key] ?? 0) + headcount(p);
  }

  return {
    entries: active.length,
    heads: active.reduce((n, p) => n + headcount(p), 0),
    adults: active.reduce((n, p) => n + 1 + (p.guestsAdults || 0), 0),
    kids: active.reduce((n, p) => n + (p.guestsKids || 0), 0),
    confirmed: people.filter((p) => p.status === "Confirmed").length,
    tentative: people.filter((p) => p.status === "Tentative").length,
    cancelled: people.filter((p) => p.status === "Cancelled").length,
    food,
    unassignedStay: active.filter((p) => !p.stayAssigned).length,
    missingTravel: active.filter((p) => !p.arriveDate || !p.returnDate).length,
  };
}

/** Group by the stay Mayuri has assigned, with everyone unplaced in one bucket. */
export function byStay(people: Participant[]): Array<{
  stay: string;
  people: Participant[];
  heads: number;
}> {
  const groups = new Map<string, Participant[]>();
  for (const p of people.filter((x) => x.status !== "Cancelled")) {
    const key = p.stayAssigned || "Not assigned yet";
    groups.set(key, [...(groups.get(key) ?? []), p]);
  }
  return [...groups.entries()]
    .map(([stay, list]) => ({
      stay,
      people: list,
      heads: list.reduce((n, p) => n + headcount(p), 0),
    }))
    .sort((a, b) =>
      a.stay === "Not assigned yet"
        ? 1
        : b.stay === "Not assigned yet"
          ? -1
          : a.stay.localeCompare(b.stay),
    );
}
