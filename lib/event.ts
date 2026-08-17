/**
 * Single source of truth for everything about the get-together itself.
 * Change it here and the whole site follows.
 */

export const EVENT = {
  name: "Tadoba Reunion",
  year: 2026,
  tagline: "The class is back — in the wild.",
  venue: "Tadoba-Andhari Tiger Reserve",
  mainDays: "21 & 22 November 2026",
  organiser: "Mayuri",
  /** Used for the countdown — first main day, 9am IST. */
  startsAt: "2026-11-21T09:00:00+05:30",
} as const;

/** Arrivals happen on the 20th or 21st; returns on the 22nd, sometimes later. */
export const ARRIVAL_DATES = [
  { value: "2026-11-20", label: "Fri 20 Nov (a day early)" },
  { value: "2026-11-21", label: "Sat 21 Nov (main day)" },
  { value: "2026-11-22", label: "Sun 22 Nov (late joiner)" },
] as const;

export const RETURN_DATES = [
  { value: "2026-11-22", label: "Sun 22 Nov (most people)" },
  { value: "2026-11-23", label: "Mon 23 Nov (extra day)" },
  { value: "2026-11-24", label: "Tue 24 Nov (extended stay)" },
] as const;

/** Where friends are travelling in from. */
export const CITIES = [
  "Beed",
  "Solapur",
  "Pune",
  "Aurangabad",
  "Ahmedabad",
  "Mumbai",
  "Nagpur",
  "Chandrapur",
] as const;

export const STATUSES = ["Confirmed", "Tentative", "Cancelled"] as const;

/**
 * The days the programme can have entries on — the evening people trickle in,
 * the two main days, and the morning the stragglers leave.
 */
export const PROGRAMME_DAYS = [
  { value: "2026-11-20", label: "Fri 20 Nov", sub: "the day before" },
  { value: "2026-11-21", label: "Sat 21 Nov", sub: "day one" },
  { value: "2026-11-22", label: "Sun 22 Nov", sub: "day two" },
  { value: "2026-11-23", label: "Mon 23 Nov", sub: "for anyone staying on" },
] as const;

export function programmeDay(value: string) {
  return PROGRAMME_DAYS.find((d) => d.value === value);
}

/** Everything the group does happens on Indian time, wherever the server runs. */
export const TZ = "Asia/Kolkata";

/**
 * A calendar date carries no time zone, so it must be built AND formatted in
 * the same one. Anchoring to UTC on both sides keeps "2026-11-21" reading as
 * 21 Nov on a Vercel server running UTC as well as on a laptop in IST —
 * formatting in server-local time silently shifted every date back a day.
 */
export function prettyDate(date: string | null | undefined): string {
  if (!date) return "Date not given";
  const d = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

/** A real instant (created/updated stamps), shown in IST for the organisers. */
export function prettyStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TZ,
  });
}

/**
 * Programme times are stored as 24-hour "HH:MM" because that string sorts
 * correctly. Nobody in the group should have to read it in that form, so every
 * screen goes through this and talks in AM/PM.
 */
export function prettyTime(time: string | null | undefined): string {
  if (!time) return "—";
  const [h, m] = time.split(":").map(Number);
  if (!Number.isInteger(h) || h < 0 || h > 23) return time;
  if (!Number.isInteger(m) || m < 0 || m > 59) return time;
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/**
 * Rupees, grouped the Indian way — 1,66,200 rather than 166,200. Paise are
 * kept if someone enters them but never padded on, because nobody splits a
 * resort bill to two decimal places.
 */
export function formatMoney(amount: number): string {
  const n = Number.isFinite(amount) ? amount : 0;
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
}
