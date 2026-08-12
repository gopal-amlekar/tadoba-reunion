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
import {
  deleteParticipant,
  getParticipant,
  listParticipants,
  saveParticipant,
} from "@/lib/db";
import { looksLikeMultipleNames } from "@/lib/groups";
import { EMPTY_PARTICIPANT, type Participant } from "@/lib/types";

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
    food: str(fd, "food"),

    // Group membership is managed on /groups, never posted by this form —
    // carry it through so editing travel details can't drop someone out.
    groupId: existing?.groupId ?? "",
    groupName: existing?.groupName ?? "",

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

// ---------------------------------------------------------------- groups ----

function revalidateAll(): void {
  revalidatePath("/");
  revalidatePath("/travel");
  revalidatePath("/plan");
  revalidatePath("/admin");
  revalidatePath("/groups");
}

/** Start a group. The person creating it can be its first member. */
export async function createGroupAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireUnlocked();

  const name = str(fd, "groupName");
  if (!name) return { error: "Give the group a name first." };

  const groupId = randomUUID();
  const firstId = str(fd, "firstMemberId");
  const who = (await getWho()) || "someone";

  if (firstId) {
    const p = await getParticipant(firstId);
    if (p) await saveParticipant({ ...p, groupId, groupName: name }, who);
  }

  revalidateAll();
  redirect(`/groups?open=${groupId}`);
}

/**
 * Add exactly one person to a group — either an existing entry picked from the
 * list, or a brand-new name which gets enrolled as a guest on the spot.
 */
export async function addGroupMemberAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireUnlocked();

  const groupId = str(fd, "groupId");
  const groupName = str(fd, "groupName");
  if (!groupId) return { error: "That group no longer exists." };

  const who = (await getWho()) || "someone";
  const existingId = str(fd, "memberId");
  const typedName = str(fd, "newName");

  if (existingId) {
    const p = await getParticipant(existingId);
    if (!p) return { error: "Could not find that person." };
    await saveParticipant({ ...p, groupId, groupName }, who);
    revalidateAll();
    return { ok: true };
  }

  if (!typedName) {
    return { error: "Pick someone from the list, or type one new name." };
  }

  if (looksLikeMultipleNames(typedName)) {
    return {
      error:
        "That looks like more than one name. Please add one person at a time.",
    };
  }

  // Someone who hasn't filled the form yet still needs to exist on the list,
  // so create a bare entry they (or anyone) can complete later.
  const now = new Date().toISOString();
  await saveParticipant(
    {
      ...EMPTY_PARTICIPANT,
      id: randomUUID(),
      name: typedName,
      groupId,
      groupName,
      createdAt: now,
      updatedAt: now,
      updatedBy: who,
    },
    who,
  );

  revalidateAll();
  return { ok: true };
}

export async function removeGroupMemberAction(fd: FormData): Promise<void> {
  await requireUnlocked();
  const id = str(fd, "id");
  const p = await getParticipant(id);
  if (p) {
    await saveParticipant({ ...p, groupId: "", groupName: "" }, (await getWho()) || "someone");
  }
  revalidateAll();
}

export async function renameGroupAction(fd: FormData): Promise<void> {
  await requireUnlocked();
  const groupId = str(fd, "groupId");
  const name = str(fd, "groupName");
  if (!groupId || !name) return;

  const who = (await getWho()) || "someone";
  for (const p of (await listParticipants()).filter((x) => x.groupId === groupId)) {
    await saveParticipant({ ...p, groupName: name }, who);
  }
  revalidateAll();
}

/** Dissolve a group. The people stay on the list, just no longer tied together. */
export async function disbandGroupAction(fd: FormData): Promise<void> {
  await requireUnlocked();
  const groupId = str(fd, "groupId");
  if (!groupId) return;

  const who = (await getWho()) || "someone";
  for (const p of (await listParticipants()).filter((x) => x.groupId === groupId)) {
    await saveParticipant({ ...p, groupId: "", groupName: "" }, who);
  }
  revalidateAll();
  redirect("/groups");
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
