import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Deliberately simple: one shared password for the whole group, plus a second
 * one for Mayuri. Anyone who is in can add or edit anyone's entry — that's the
 * point, so someone can fill the form in on behalf of a friend. The audit log
 * is what keeps that honest, not per-user accounts.
 */

export type Role = "guest" | "admin";

const COOKIE = "gtg_session";
const NAME_COOKIE = "gtg_who";

/**
 * Fallbacks only — these are what you get with no env vars set, so they're for
 * `npm run dev`. Anything deployed reads the real ones from the environment;
 * a default sitting in the repo is not a password.
 */
const SITE_PASSWORD = process.env.SITE_PASSWORD || "tadoba2026";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "mayuri";
const SECRET = process.env.SESSION_SECRET || "change-me-in-vercel-env-vars";

function sign(role: Role): string {
  const mac = createHmac("sha256", SECRET).update(role).digest("hex");
  return `${role}.${mac}`;
}

function verify(token: string | undefined): Role | null {
  if (!token) return null;
  const [role, mac] = token.split(".");
  if (role !== "guest" && role !== "admin") return null;
  const expected = createHmac("sha256", SECRET).update(role).digest("hex");
  if (!mac || mac.length !== expected.length) return null;
  if (!timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  return role;
}

/** Constant-time password comparison, tolerant of differing lengths. */
function passwordMatches(given: string, expected: string): boolean {
  const a = createHmac("sha256", SECRET).update(given).digest();
  const b = createHmac("sha256", SECRET).update(expected).digest();
  return timingSafeEqual(a, b);
}

export function checkPassword(given: string): Role | null {
  const cleaned = given.trim();
  if (!cleaned) return null;
  if (passwordMatches(cleaned, ADMIN_PASSWORD)) return "admin";
  if (passwordMatches(cleaned, SITE_PASSWORD)) return "guest";
  return null;
}

export async function getRole(): Promise<Role | null> {
  const store = await cookies();
  return verify(store.get(COOKIE)?.value);
}

export async function isUnlocked(): Promise<boolean> {
  return (await getRole()) !== null;
}

export async function isAdmin(): Promise<boolean> {
  return (await getRole()) === "admin";
}

export async function startSession(role: Role): Promise<void> {
  const store = await cookies();
  store.set(COOKIE, sign(role), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180, // comfortably past November
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/**
 * The name of whoever is at the keyboard. Not a security control — it just
 * labels the audit log so "who entered this?" has an answer.
 */
export async function getWho(): Promise<string> {
  const store = await cookies();
  return store.get(NAME_COOKIE)?.value ?? "";
}

export async function setWho(name: string): Promise<void> {
  const store = await cookies();
  store.set(NAME_COOKIE, name.slice(0, 60), {
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 180,
  });
}
