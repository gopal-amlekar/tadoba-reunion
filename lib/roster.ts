import type { Participant } from "./types";

/** The headline counts, for the pages that just want "how many, of what". */
export type Totals = {
  entries: number;
  confirmed: number;
  tentative: number;
  cancelled: number;
  food: Record<string, number>;
  missingTravel: number;
};

export function totals(people: Participant[]): Totals {
  const active = people.filter((p) => p.status !== "Cancelled");
  const food: Record<string, number> = {};

  for (const p of active) {
    const key = p.food || "Not given";
    food[key] = (food[key] ?? 0) + 1;
  }

  return {
    entries: active.length,
    confirmed: people.filter((p) => p.status === "Confirmed").length,
    tentative: people.filter((p) => p.status === "Tentative").length,
    cancelled: people.filter((p) => p.status === "Cancelled").length,
    food,
    missingTravel: active.filter((p) => !p.arriveDate || !p.returnDate).length,
  };
}
