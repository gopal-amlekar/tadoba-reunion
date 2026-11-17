/**
 * Single source of truth for the get-together itself.
 * Change it here and the whole site follows.
 */
export const EVENT = {
  name: "Tadoba Reunion",
  year: 2026,
  venue: "Tadoba-Andhari Tiger Reserve",
  mainDays: "20–22 November 2026",
  /** Countdown target: the first arrivals in Nagpur on the 20th, 9am IST. */
  startsAt: "2026-11-20T09:00:00+05:30",
} as const;
