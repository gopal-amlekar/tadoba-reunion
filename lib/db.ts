import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import type {
  AuditEntry,
  CostItem,
  ItineraryItem,
  Participant,
  Safari,
} from "./types";

/**
 * Two storage backends, same API:
 *
 *  - Postgres (Neon), whenever a connection string is present. We use Neon's
 *    HTTP driver deliberately: it opens no long-lived sockets, so the
 *    connection-pool exhaustion that bites serverless deployments can't happen.
 *  - A local JSON file, when there's no connection string. This exists purely
 *    so `npm run dev` works with zero setup; it is never used on Vercel,
 *    where the filesystem is read-only and per-request anyway.
 */

const CONNECTION_STRING =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DATABASE_URL_UNPOOLED ||
  process.env.POSTGRES_URL_NON_POOLING ||
  "";

export const usingPostgres = Boolean(CONNECTION_STRING);

const FILE_PATH = path.join(process.cwd(), ".data", "db.json");

type FileShape = {
  participants: Participant[];
  audit: AuditEntry[];
  safaris?: Safari[];
  itinerary?: ItineraryItem[];
  costs?: CostItem[];
};

// ---------------------------------------------------------------- postgres --

const sql = usingPostgres ? neon(CONNECTION_STRING) : null;

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!sql) return Promise.resolve();
  // Created once per process, then memoised — no separate migration step to forget.
  schemaReady ??= (async () => {
    await sql`
      CREATE TABLE IF NOT EXISTS participants (
        id              TEXT PRIMARY KEY,
        name            TEXT NOT NULL,
        city            TEXT DEFAULT '',
        phone           TEXT DEFAULT '',
        food            TEXT DEFAULT '',
        group_id        TEXT DEFAULT '',
        group_name      TEXT DEFAULT '',
        arrive_date     TEXT DEFAULT '',
        arrive_time     TEXT DEFAULT '',
        arrive_gateway  TEXT DEFAULT '',
        arrive_mode     TEXT DEFAULT '',
        arrive_details  TEXT DEFAULT '',
        return_date     TEXT DEFAULT '',
        return_time     TEXT DEFAULT '',
        return_gateway  TEXT DEFAULT '',
        return_mode     TEXT DEFAULT '',
        return_details  TEXT DEFAULT '',
        stay_preference TEXT DEFAULT '',
        notes           TEXT DEFAULT '',
        paid            NUMERIC DEFAULT 0,
        paid_note       TEXT DEFAULT '',
        status          TEXT DEFAULT 'Confirmed',
        created_at      TIMESTAMPTZ DEFAULT now(),
        updated_at      TIMESTAMPTZ DEFAULT now(),
        updated_by      TEXT DEFAULT ''
      )
    `;
    // Added after the first deploy, so existing tables need them backfilled.
    // The dropped logistics columns (stay_assigned, pre_night_stay,
    // vehicle_group, admin_notes) are left alone where they already exist —
    // they all default to '', so nothing here has to know about them.
    await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS group_id TEXT DEFAULT ''`;
    await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS group_name TEXT DEFAULT ''`;
    await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS paid NUMERIC DEFAULT 0`;
    await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS paid_note TEXT DEFAULT ''`;
    await sql`
      CREATE TABLE IF NOT EXISTS safaris (
        id         TEXT PRIMARY KEY,
        slot       TEXT NOT NULL,
        time       TEXT DEFAULT '',
        note       TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS itinerary (
        id         TEXT PRIMARY KEY,
        date       TEXT DEFAULT '',
        time       TEXT DEFAULT '',
        title      TEXT DEFAULT '',
        detail     TEXT DEFAULT '',
        created_at TIMESTAMPTZ DEFAULT now()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS costs (
        id             TEXT PRIMARY KEY,
        label          TEXT DEFAULT '',
        amount         NUMERIC DEFAULT 0,
        note           TEXT DEFAULT '',
        applies_to_all BOOLEAN DEFAULT true,
        -- Participant ids, comma separated. They're UUIDs, so there is nothing
        -- to escape, and a join table would be three queries for one small list.
        member_ids     TEXT DEFAULT '',
        created_at     TIMESTAMPTZ DEFAULT now()
      )
    `;
    await sql`
      CREATE TABLE IF NOT EXISTS audit_log (
        id               SERIAL PRIMARY KEY,
        participant_id   TEXT,
        participant_name TEXT,
        action           TEXT,
        changed_by       TEXT,
        summary          TEXT,
        at               TIMESTAMPTZ DEFAULT now()
      )
    `;
  })().catch((err) => {
    schemaReady = null; // let the next request retry instead of wedging forever
    throw err;
  });
  return schemaReady;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToParticipant(r: any): Participant {
  return {
    id: r.id,
    name: r.name ?? "",
    city: r.city ?? "",
    phone: r.phone ?? "",
    food: r.food ?? "",
    groupId: r.group_id ?? "",
    groupName: r.group_name ?? "",
    arriveDate: r.arrive_date ?? "",
    arriveTime: r.arrive_time ?? "",
    arriveGateway: r.arrive_gateway ?? "",
    arriveMode: r.arrive_mode ?? "",
    arriveDetails: r.arrive_details ?? "",
    returnDate: r.return_date ?? "",
    returnTime: r.return_time ?? "",
    returnGateway: r.return_gateway ?? "",
    returnMode: r.return_mode ?? "",
    returnDetails: r.return_details ?? "",
    stayPreference: r.stay_preference ?? "",
    notes: r.notes ?? "",
    // NUMERIC comes back from the driver as a string, so it needs coercing or
    // every sum on the money page turns into string concatenation.
    paid: Number(r.paid ?? 0) || 0,
    paidNote: r.paid_note ?? "",
    status: r.status ?? "Confirmed",
    createdAt: new Date(r.created_at ?? Date.now()).toISOString(),
    updatedAt: new Date(r.updated_at ?? Date.now()).toISOString(),
    updatedBy: r.updated_by ?? "",
  };
}

function rowToAudit(r: any): AuditEntry {
  return {
    id: r.id,
    participantId: r.participant_id ?? "",
    participantName: r.participant_name ?? "",
    action: r.action ?? "updated",
    changedBy: r.changed_by ?? "",
    summary: r.summary ?? "",
    at: new Date(r.at ?? Date.now()).toISOString(),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// -------------------------------------------------------------- json file ---

async function readFile(): Promise<FileShape> {
  try {
    return JSON.parse(await fs.readFile(FILE_PATH, "utf8")) as FileShape;
  } catch {
    return { participants: [], audit: [] };
  }
}

async function writeFile(data: FileShape): Promise<void> {
  await fs.mkdir(path.dirname(FILE_PATH), { recursive: true });
  await fs.writeFile(FILE_PATH, JSON.stringify(data, null, 2), "utf8");
}

// ------------------------------------------------------------------- api ----

export async function listParticipants(): Promise<Participant[]> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT * FROM participants ORDER BY created_at ASC`;
    return rows.map(rowToParticipant);
  }
  const data = await readFile();
  return data.participants;
}

export async function getParticipant(id: string): Promise<Participant | null> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT * FROM participants WHERE id = ${id}`;
    return rows.length ? rowToParticipant(rows[0]) : null;
  }
  const data = await readFile();
  return data.participants.find((p) => p.id === id) ?? null;
}

export async function saveParticipant(
  p: Participant,
  changedBy: string,
): Promise<void> {
  const existing = await getParticipant(p.id);
  const action = existing ? "updated" : "created";
  const summary = existing ? describeChanges(existing, p) : "Added to the list";
  const now = new Date().toISOString();
  const record: Participant = {
    ...p,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    updatedBy: changedBy,
  };

  if (sql) {
    await ensureSchema();
    await sql`
      INSERT INTO participants (
        id, name, city, phone, food, group_id, group_name,
        arrive_date, arrive_time, arrive_gateway, arrive_mode, arrive_details,
        return_date, return_time, return_gateway, return_mode, return_details,
        stay_preference, notes, paid, paid_note,
        status, created_at, updated_at, updated_by
      ) VALUES (
        ${record.id}, ${record.name}, ${record.city}, ${record.phone},
        ${record.food}, ${record.groupId}, ${record.groupName},
        ${record.arriveDate}, ${record.arriveTime}, ${record.arriveGateway},
        ${record.arriveMode}, ${record.arriveDetails},
        ${record.returnDate}, ${record.returnTime}, ${record.returnGateway},
        ${record.returnMode}, ${record.returnDetails},
        ${record.stayPreference}, ${record.notes},
        ${record.paid}, ${record.paidNote},
        ${record.status},
        ${record.createdAt}, ${record.updatedAt}, ${record.updatedBy}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, city = EXCLUDED.city, phone = EXCLUDED.phone,
        food = EXCLUDED.food,
        group_id = EXCLUDED.group_id, group_name = EXCLUDED.group_name,
        arrive_date = EXCLUDED.arrive_date, arrive_time = EXCLUDED.arrive_time,
        arrive_gateway = EXCLUDED.arrive_gateway, arrive_mode = EXCLUDED.arrive_mode,
        arrive_details = EXCLUDED.arrive_details,
        return_date = EXCLUDED.return_date, return_time = EXCLUDED.return_time,
        return_gateway = EXCLUDED.return_gateway, return_mode = EXCLUDED.return_mode,
        return_details = EXCLUDED.return_details,
        stay_preference = EXCLUDED.stay_preference, notes = EXCLUDED.notes,
        paid = EXCLUDED.paid, paid_note = EXCLUDED.paid_note,
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at, updated_by = EXCLUDED.updated_by
    `;
    await sql`
      INSERT INTO audit_log (participant_id, participant_name, action, changed_by, summary, at)
      VALUES (${record.id}, ${record.name}, ${action}, ${changedBy}, ${summary}, ${now})
    `;
    return;
  }

  const data = await readFile();
  const idx = data.participants.findIndex((x) => x.id === record.id);
  if (idx >= 0) data.participants[idx] = record;
  else data.participants.push(record);
  data.audit.push({
    id: data.audit.length + 1,
    participantId: record.id,
    participantName: record.name,
    action,
    changedBy,
    summary,
    at: now,
  });
  await writeFile(data);
}

export async function deleteParticipant(
  id: string,
  changedBy: string,
): Promise<void> {
  const existing = await getParticipant(id);
  if (!existing) return;
  const now = new Date().toISOString();

  if (sql) {
    await ensureSchema();
    await sql`DELETE FROM participants WHERE id = ${id}`;
    await sql`
      INSERT INTO audit_log (participant_id, participant_name, action, changed_by, summary, at)
      VALUES (${id}, ${existing.name}, 'deleted', ${changedBy}, 'Removed from the list', ${now})
    `;
    return;
  }

  const data = await readFile();
  data.participants = data.participants.filter((p) => p.id !== id);
  data.audit.push({
    id: data.audit.length + 1,
    participantId: id,
    participantName: existing.name,
    action: "deleted",
    changedBy,
    summary: "Removed from the list",
    at: now,
  });
  await writeFile(data);
}

export async function listAudit(limit = 100): Promise<AuditEntry[]> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT * FROM audit_log ORDER BY at DESC, id DESC LIMIT ${limit}`;
    return rows.map(rowToAudit);
  }
  const data = await readFile();
  return [...data.audit].reverse().slice(0, limit);
}

// --------------------------------------------------------------- safaris ----

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToSafari(r: any): Safari {
  return {
    id: r.id,
    slot: r.slot ?? "",
    time: r.time ?? "",
    note: r.note ?? "",
    createdAt: new Date(r.created_at ?? Date.now()).toISOString(),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export async function listSafaris(): Promise<Safari[]> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT * FROM safaris ORDER BY slot ASC, time ASC`;
    return rows.map(rowToSafari);
  }
  const data = await readFile();
  return [...(data.safaris ?? [])].sort(
    (a, b) => a.slot.localeCompare(b.slot) || a.time.localeCompare(b.time),
  );
}

export async function saveSafari(s: Safari): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`
      INSERT INTO safaris (id, slot, time, note, created_at)
      VALUES (${s.id}, ${s.slot}, ${s.time}, ${s.note}, ${s.createdAt})
      ON CONFLICT (id) DO UPDATE SET
        slot = EXCLUDED.slot, time = EXCLUDED.time, note = EXCLUDED.note
    `;
    return;
  }
  const data = await readFile();
  const list = data.safaris ?? [];
  const idx = list.findIndex((x) => x.id === s.id);
  if (idx >= 0) list[idx] = s;
  else list.push(s);
  await writeFile({ ...data, safaris: list });
}

export async function deleteSafari(id: string): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`DELETE FROM safaris WHERE id = ${id}`;
    return;
  }
  const data = await readFile();
  await writeFile({
    ...data,
    safaris: (data.safaris ?? []).filter((s) => s.id !== id),
  });
}

// ------------------------------------------------------------- itinerary ----

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToItinerary(r: any): ItineraryItem {
  return {
    id: r.id,
    date: r.date ?? "",
    time: r.time ?? "",
    title: r.title ?? "",
    detail: r.detail ?? "",
    createdAt: new Date(r.created_at ?? Date.now()).toISOString(),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/**
 * Day first, then time — and an item with no time sorts to the end of its day,
 * because "sometime on Sunday" belongs after everything that has an hour.
 */
function itineraryOrder(a: ItineraryItem, b: ItineraryItem): number {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  if (!a.time !== !b.time) return a.time ? -1 : 1;
  return a.time.localeCompare(b.time) || a.createdAt.localeCompare(b.createdAt);
}

export async function listItinerary(): Promise<ItineraryItem[]> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT * FROM itinerary`;
    return rows.map(rowToItinerary).sort(itineraryOrder);
  }
  const data = await readFile();
  return [...(data.itinerary ?? [])].sort(itineraryOrder);
}

export async function saveItineraryItem(item: ItineraryItem): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`
      INSERT INTO itinerary (id, date, time, title, detail, created_at)
      VALUES (${item.id}, ${item.date}, ${item.time}, ${item.title},
              ${item.detail}, ${item.createdAt})
      ON CONFLICT (id) DO UPDATE SET
        date = EXCLUDED.date, time = EXCLUDED.time,
        title = EXCLUDED.title, detail = EXCLUDED.detail
    `;
    return;
  }
  const data = await readFile();
  const list = data.itinerary ?? [];
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) list[idx] = item;
  else list.push(item);
  await writeFile({ ...data, itinerary: list });
}

export async function deleteItineraryItem(id: string): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`DELETE FROM itinerary WHERE id = ${id}`;
    return;
  }
  const data = await readFile();
  await writeFile({
    ...data,
    itinerary: (data.itinerary ?? []).filter((i) => i.id !== id),
  });
}

// ----------------------------------------------------------------- costs ----

/* eslint-disable @typescript-eslint/no-explicit-any */
function rowToCost(r: any): CostItem {
  return {
    id: r.id,
    label: r.label ?? "",
    amount: Number(r.amount ?? 0) || 0,
    note: r.note ?? "",
    appliesToAll: r.applies_to_all !== false,
    memberIds: String(r.member_ids ?? "").split(",").filter(Boolean),
    createdAt: new Date(r.created_at ?? Date.now()).toISOString(),
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Entry order, so the list reads the way Mayuri built it. */
export async function listCosts(): Promise<CostItem[]> {
  if (sql) {
    await ensureSchema();
    const rows = await sql`SELECT * FROM costs ORDER BY created_at ASC`;
    return rows.map(rowToCost);
  }
  const data = await readFile();
  return [...(data.costs ?? [])].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );
}

export async function saveCost(item: CostItem): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`
      INSERT INTO costs (id, label, amount, note, applies_to_all, member_ids, created_at)
      VALUES (${item.id}, ${item.label}, ${item.amount}, ${item.note},
              ${item.appliesToAll}, ${item.memberIds.join(",")}, ${item.createdAt})
      ON CONFLICT (id) DO UPDATE SET
        label = EXCLUDED.label, amount = EXCLUDED.amount, note = EXCLUDED.note,
        applies_to_all = EXCLUDED.applies_to_all,
        member_ids = EXCLUDED.member_ids
    `;
    return;
  }
  const data = await readFile();
  const list = data.costs ?? [];
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx >= 0) list[idx] = item;
  else list.push(item);
  await writeFile({ ...data, costs: list });
}

export async function deleteCost(id: string): Promise<void> {
  if (sql) {
    await ensureSchema();
    await sql`DELETE FROM costs WHERE id = ${id}`;
    return;
  }
  const data = await readFile();
  await writeFile({
    ...data,
    costs: (data.costs ?? []).filter((c) => c.id !== id),
  });
}

// --------------------------------------------------------------- helpers ----

const FIELD_LABELS: Partial<Record<keyof Participant, string>> = {
  name: "name",
  city: "city",
  phone: "phone",
  food: "food preference",
  groupName: "travel group",
  arriveDate: "arrival date",
  arriveTime: "arrival time",
  arriveGateway: "arrival gateway",
  arriveMode: "arrival mode",
  arriveDetails: "arrival details",
  returnDate: "return date",
  returnTime: "return time",
  returnGateway: "return gateway",
  returnMode: "return mode",
  returnDetails: "return details",
  stayPreference: "stay preference",
  notes: "notes",
  paid: "amount received",
  paidNote: "payment note",
  status: "status",
};

/** Human-readable "what actually changed", for the audit log. */
function describeChanges(before: Participant, after: Participant): string {
  const changed = (Object.keys(FIELD_LABELS) as (keyof Participant)[])
    .filter((k) => String(before[k] ?? "") !== String(after[k] ?? ""))
    .map((k) => FIELD_LABELS[k]);
  if (!changed.length) return "Saved with no changes";
  return `Changed ${changed.join(", ")}`;
}
