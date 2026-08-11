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

/**
 * The main day everyone must be at the resort by. Anyone arriving before this
 * needs a bed for the night in between — usually at their arrival city.
 */
export const MAIN_DAY = "2026-11-21";

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

/** The two realistic gateways to Tadoba, plus the drive-straight-in case. */
export const GATEWAYS = [
  "Nagpur",
  "Chandrapur",
  "Straight to the resort",
  "Not decided yet",
] as const;

export const MODES = [
  "Train",
  "Flight",
  "Bus",
  "Own car",
  "Cab / taxi",
  "Not decided yet",
] as const;

export const FOOD_PREFERENCES = ["Veg", "Non-veg"] as const;

export const STATUSES = ["Confirmed", "Tentative", "Cancelled"] as const;

/**
 * Time-of-day buckets used to group arrivals into pickup runs.
 * A vehicle is planned per bucket per gateway.
 */
export const SLOTS = [
  { label: "Early morning", from: 0, to: 8 },
  { label: "Morning", from: 8, to: 12 },
  { label: "Afternoon", from: 12, to: 16 },
  { label: "Evening", from: 16, to: 20 },
  { label: "Night", from: 20, to: 24 },
] as const;

export function slotFor(time: string | null | undefined): string {
  if (!time) return "Time not given";
  const hour = Number(time.split(":")[0]);
  if (Number.isNaN(hour)) return "Time not given";
  return SLOTS.find((s) => hour >= s.from && hour < s.to)?.label ?? "Time not given";
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

export function prettyTime(time: string | null | undefined): string {
  if (!time) return "—";
  const [h, m] = time.split(":").map(Number);
  if (Number.isNaN(h)) return time;
  const suffix = h < 12 ? "AM" : "PM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m ?? 0).padStart(2, "0")} ${suffix}`;
}
