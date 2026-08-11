"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  checkPassword,
  endSession,
  getRole,
  getWho,
  setWho,
  startSession,
} from "@/lib/auth";
import { deleteParticipant, getParticipant, saveParticipant } from "@/lib/db";
import type { Participant } from "@/lib/types";

export type FormState = { error?: string; ok?: boolean };

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

function num(fd: FormData, key: string): number {
  const n = Number(str(fd, key));
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : 0;
}

/** A dropdown with an "Other" escape hatch: use the free-text box when picked. */
function choice(fd: FormData, key: string): string {
  const picked = str(fd, key);
  return picked === "__other" ? str(fd, `${key}Other`) : picked;
}

async function requireUnlocked(): Promise<void> {
  if (!(await getRole())) redirect("/unlock");
}

// ------------------------------------------------------------------ auth ----

export async function unlockAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  const role = checkPassword(str(fd, "password"));
  if (!role) return { error: "That password doesn't match. Ask Mayuri on the group." };

  const who = str(fd, "who");
  if (who) await setWho(who);
  await startSession(role);
  redirect(role === "admin" ? "/admin" : "/travel");
}

export async function lockAction(): Promise<void> {
  await endSession();
  redirect("/");
}

// ---------------------------------------------------------- participants ----

export async function saveParticipantAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireUnlocked();

  const name = str(fd, "name");
  if (!name) return { error: "Please enter a name." };

  const id = str(fd, "id") || randomUUID();
  const existing = await getParticipant(id);

  const who = str(fd, "who") || (await getWho()) || name;
  if (str(fd, "who")) await setWho(str(fd, "who"));

  const participant: Participant = {
    id,
    name,
    city: choice(fd, "city"),
    phone: str(fd, "phone"),
    guestsAdults: num(fd, "guestsAdults"),
    guestsKids: num(fd, "guestsKids"),
    food: str(fd, "food"),

    arriveDate: choice(fd, "arriveDate"),
    arriveTime: str(fd, "arriveTime"),
    arriveGateway: str(fd, "arriveGateway"),
    arriveMode: str(fd, "arriveMode"),
    arriveDetails: str(fd, "arriveDetails"),

    returnDate: choice(fd, "returnDate"),
    returnTime: str(fd, "returnTime"),
    returnGateway: str(fd, "returnGateway"),
    returnMode: str(fd, "returnMode"),
    returnDetails: str(fd, "returnDetails"),

    stayPreference: str(fd, "stayPreference"),
    notes: str(fd, "notes"),

    // Organiser-only fields are never posted by the guest form, so preserve
    // whatever Mayuri has already set instead of blanking it.
    stayAssigned: existing?.stayAssigned ?? "",
    preNightStay: existing?.preNightStay ?? "",
    vehicleGroup: existing?.vehicleGroup ?? "",
    adminNotes: existing?.adminNotes ?? "",
    status: str(fd, "status") || existing?.status || "Confirmed",

    createdAt: existing?.createdAt ?? new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    updatedBy: who,
  };

  await saveParticipant(participant, who);
  revalidatePath("/");
  revalidatePath("/travel");
  revalidatePath("/admin");
  redirect(`/travel?saved=${encodeURIComponent(name)}`);
}

export async function deleteParticipantAction(fd: FormData): Promise<void> {
  await requireUnlocked();
  const id = str(fd, "id");
  const who = (await getWho()) || "someone";
  if (id) await deleteParticipant(id, who);
  revalidatePath("/");
  revalidatePath("/travel");
  revalidatePath("/admin");
  redirect("/travel");
}

// ----------------------------------------------------------------- admin ----

/** Mayuri's per-row planning fields: stay, vehicle group, notes, status. */
export async function adminUpdateAction(fd: FormData): Promise<void> {
  if ((await getRole()) !== "admin") redirect("/unlock");

  const id = str(fd, "id");
  const existing = await getParticipant(id);
  if (!existing) return;

  const who = (await getWho()) || "Organiser";
  await saveParticipant(
    {
      ...existing,
      stayAssigned: str(fd, "stayAssigned"),
      preNightStay: str(fd, "preNightStay"),
      vehicleGroup: str(fd, "vehicleGroup"),
      adminNotes: str(fd, "adminNotes"),
      status: str(fd, "status") || existing.status,
    },
    who,
  );
  revalidatePath("/admin");
  revalidatePath("/travel");
  revalidatePath("/");
}
