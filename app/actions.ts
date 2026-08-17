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
  deleteCost,
  deleteItineraryItem,
  deleteParticipant,
  deleteSafari,
  getParticipant,
  listCosts,
  listItinerary,
  listParticipants,
  saveCost,
  saveItineraryItem,
  saveParticipant,
  saveSafari,
} from "@/lib/db";
import { looksLikeMultipleNames } from "@/lib/groups";
import { EMPTY_PARTICIPANT, type Participant } from "@/lib/types";

export type FormState = { error?: string; ok?: boolean };

function str(fd: FormData, key: string): string {
  return String(fd.get(key) ?? "").trim();
}

/** Rupees. Tolerates "₹4,500" being pasted straight out of a WhatsApp message. */
function money(fd: FormData, key: string): number {
  const n = Number(str(fd, key).replace(/[₹,\s]/g, ""));
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : 0;
}

/** A dropdown with an "Other" escape hatch: use the free-text box when picked. */
function choice(fd: FormData, key: string): string {
  const picked = str(fd, key);
  return picked === "__other" ? str(fd, `${key}Other`) : picked;
}

async function requireUnlocked(): Promise<void> {
  if (!(await getRole())) redirect("/unlock");
}

async function requireAdmin(): Promise<void> {
  if ((await getRole()) !== "admin") redirect("/unlock");
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

    // What Mayuri has received is hers to set, and this form never posts it —
    // carry it through so editing travel details can't wipe someone's payment.
    paid: existing?.paid ?? 0,
    paidNote: existing?.paidNote ?? "",
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
  revalidatePath("/itinerary");
  revalidatePath("/money");
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

// --------------------------------------------------------------- safaris ----

/** Booking the gypsies is the organiser's job, so this is admin-only. */
export async function addSafariAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();

  const slot = str(fd, "slot");
  const time = str(fd, "time");
  if (!slot) return { error: "Pick which safari this is." };
  if (!time) return { error: "Add the reporting time." };

  await saveSafari({
    id: str(fd, "id") || randomUUID(),
    slot,
    time,
    note: str(fd, "note"),
    createdAt: new Date().toISOString(),
  });

  revalidateAll();
  return { ok: true };
}

export async function removeSafariAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (id) await deleteSafari(id);
  revalidateAll();
}

// ------------------------------------------------------------- itinerary ----

/** Add a line to the programme, or edit one — the form posts an id either way. */
export async function saveItineraryAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();

  const date = str(fd, "date");
  const title = str(fd, "title");
  if (!date) return { error: "Pick which day this happens on." };
  if (!title) return { error: "Give it a name — 'Convoy leaves Nagpur'." };

  const id = str(fd, "id");
  const existing = id ? (await listItinerary()).find((i) => i.id === id) : null;

  await saveItineraryItem({
    id: id || randomUUID(),
    date,
    time: str(fd, "time"),
    title,
    detail: str(fd, "detail"),
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  });

  revalidateAll();
  return { ok: true };
}

export async function removeItineraryAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (id) await deleteItineraryItem(id);
  revalidateAll();
}

// ----------------------------------------------------------------- costs ----

/**
 * A cost is a rate per person plus who it applies to. "Everyone" is stored as a
 * flag rather than as the current list of ids, so somebody joining later is
 * charged for it automatically instead of quietly slipping through.
 */
export async function saveCostAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();

  const label = str(fd, "label");
  if (!label) return { error: "Name the cost — 'Safari seat', 'Resort'." };

  const amount = money(fd, "amount");
  if (amount <= 0) return { error: "Put in the amount per person." };

  const appliesToAll = str(fd, "appliesTo") !== "some";
  const memberIds = appliesToAll
    ? []
    : fd.getAll("memberIds").map(String).filter(Boolean);

  if (!appliesToAll && memberIds.length === 0) {
    return { error: "Tick at least one person, or set it to everyone." };
  }

  const id = str(fd, "id");
  const existing = id ? (await listCosts()).find((c) => c.id === id) : null;

  await saveCost({
    id: id || randomUUID(),
    label,
    amount,
    note: str(fd, "note"),
    appliesToAll,
    memberIds,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  });

  revalidateAll();
  return { ok: true };
}

export async function removeCostAction(fd: FormData): Promise<void> {
  await requireAdmin();
  const id = str(fd, "id");
  if (id) await deleteCost(id);
  revalidateAll();
}

// -------------------------------------------------------------- payments ----

/**
 * What has come in from one person. It's a running total rather than a list of
 * receipts — Mayuri is reconciling a phone full of UPI messages, and one number
 * plus a note is what she actually keeps.
 */
export async function recordPaymentAction(
  _prev: FormState,
  fd: FormData,
): Promise<FormState> {
  await requireAdmin();

  const existing = await getParticipant(str(fd, "id"));
  if (!existing) return { error: "That person is no longer on the list." };

  await saveParticipant(
    {
      ...existing,
      paid: money(fd, "paid"),
      paidNote: str(fd, "paidNote"),
    },
    (await getWho()) || "Organiser",
  );

  revalidateAll();
  return { ok: true };
}
