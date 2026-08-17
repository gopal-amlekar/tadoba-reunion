import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { prettyTime } from "./event";
import type { AuditEntry, CostItem, ItineraryItem, Participant } from "./types";

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
        arrive_details  TEXT DEFAULT '',
        return_date     TEXT DEFAULT '',
        return_details  TEXT DEFAULT '',
        notes           TEXT DEFAULT '',
        -- Retired: the form no longer asks for a time, gateway or mode, and
        -- nothing reads these. They stay declared so foldLegacyTravel() below
        -- can find and empty whatever a live database already holds.
        arrive_time     TEXT DEFAULT '',
        arrive_gateway  TEXT DEFAULT '',
        arrive_mode     TEXT DEFAULT '',
        return_time     TEXT DEFAULT '',
        return_gateway  TEXT DEFAULT '',
        return_mode     TEXT DEFAULT '',
        stay_preference TEXT DEFAULT '',
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
        -- The whole bill, not a per-head rate. Still named amount from when it
        -- was the latter; the column is kept so no data has to move.
        amount         NUMERIC DEFAULT 0,
        note           TEXT DEFAULT '',
        applies_to_all BOOLEAN DEFAULT true,
        -- Participant ids, comma separated. They're UUIDs, so there is nothing
        -- to escape, and a join table would be three queries for one small list.
        member_ids     TEXT DEFAULT '',
        -- The programme entry this belongs to, if any.
        itinerary_id   TEXT DEFAULT '',
        created_at     TIMESTAMPTZ DEFAULT now()
      )
    `;
    await sql`ALTER TABLE costs ADD COLUMN IF NOT EXISTS itinerary_id TEXT DEFAULT ''`;
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
    arriveDetails: r.arrive_details ?? "",
    returnDate: r.return_date ?? "",
    returnDetails: r.return_details ?? "",
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

// ------------------------------------------------- legacy travel fold-in ----

/**
 * The form used to ask for arrival and return time, gateway and mode as
 * separate fields. It now asks for a date and one free-text note per direction,
 * so the old answers are folded into that note rather than orphaned in columns
 * nothing reads.
 *
 * It runs once per process, before the first read, and empties the old columns
 * as it goes — that emptying is what makes it safe to repeat. Fold without
 * clearing and the second run would append the same time and gateway again.
 */
let foldReady: Promise<void> | null = null;

/**
 * The retired fields, in the JSON file's spelling. Postgres uses snake_case and
 * names them inline in the query below, where they have to be literals anyway.
 */
const LEGACY_JSON = [
  "arriveTime",
  "arriveGateway",
  "arriveMode",
  "returnTime",
  "returnGateway",
  "returnMode",
  "stayPreference",
];

/** "14:30" + "Nagpur" + "Flight" + "6E-234" → "2:30 PM · Nagpur · Flight · 6E-234". */
function joinLegacy(
  time: string,
  gateway: string,
  mode: string,
  existing: string,
): string {
  return [time ? prettyTime(time) : "", gateway, mode, existing]
    .map((part) => String(part ?? "").trim())
    .filter(Boolean)
    .join(" · ");
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function foldOne(r: any): {
  arriveDetails: string;
  returnDetails: string;
  notes: string;
} {
  const stay = String(r.stay_preference ?? "").trim();
  return {
    arriveDetails: joinLegacy(
      r.arrive_time,
      r.arrive_gateway,
      r.arrive_mode,
      r.arrive_details,
    ),
    returnDetails: joinLegacy(
      r.return_time,
      r.return_gateway,
      r.return_mode,
      r.return_details,
    ),
    // A stay preference is a note now, so it joins the general one rather than
    // being dropped on the floor.
    notes: [String(r.notes ?? "").trim(), stay ? `Stay: ${stay}` : ""]
      .filter(Boolean)
      .join(" · "),
  };
}

function hasAny(r: any, keys: string[]): boolean {
  return keys.some((k) => String(r[k] ?? "").trim() !== "");
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function foldLegacyTravel(): Promise<void> {
  foldReady ??= (async () => {
    if (sql) {
      await ensureSchema();
      const rows = await sql`
        SELECT id, arrive_time, arrive_gateway, arrive_mode, arrive_details,
               return_time, return_gateway, return_mode, return_details,
               stay_preference, notes
        FROM participants
        WHERE coalesce(arrive_time, '') <> '' OR coalesce(arrive_gateway, '') <> ''
           OR coalesce(arrive_mode, '') <> '' OR coalesce(return_time, '') <> ''
           OR coalesce(return_gateway, '') <> '' OR coalesce(return_mode, '') <> ''
           OR coalesce(stay_preference, '') <> ''
      `;
      for (const r of rows) {
        const f = foldOne(r);
        await sql`
          UPDATE participants SET
            arrive_details = ${f.arriveDetails},
            return_details = ${f.returnDetails},
            notes = ${f.notes},
            arrive_time = '', arrive_gateway = '', arrive_mode = '',
            return_time = '', return_gateway = '', return_mode = '',
            stay_preference = ''
          WHERE id = ${r.id}
        `;
      }
      return;
    }

    const data = await readFile();
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const list = data.participants as any[];
    if (!list.some((p) => hasAny(p, LEGACY_JSON))) return;
    for (const p of list) {
      if (!hasAny(p, LEGACY_JSON)) continue;
      const f = foldOne({
        ...p,
        arrive_time: p.arriveTime,
        arrive_gateway: p.arriveGateway,
        arrive_mode: p.arriveMode,
        arrive_details: p.arriveDetails,
        return_time: p.returnTime,
        return_gateway: p.returnGateway,
        return_mode: p.returnMode,
        return_details: p.returnDetails,
        stay_preference: p.stayPreference,
        notes: p.notes,
      });
      Object.assign(p, f);
      for (const k of LEGACY_JSON) delete p[k];
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */
    await writeFile(data);
  })().catch((err) => {
    foldReady = null; // let the next request retry rather than wedging forever
    throw err;
  });
  return foldReady;
}

// ------------------------------------------------------------------- api ----

export async function listParticipants(): Promise<Participant[]> {
  await foldLegacyTravel();
  if (sql) {
    const rows = await sql`SELECT * FROM participants ORDER BY created_at ASC`;
    return rows.map(rowToParticipant);
  }
  const data = await readFile();
  return data.participants;
}

export async function getParticipant(id: string): Promise<Participant | null> {
  await foldLegacyTravel();
  if (sql) {
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
        arrive_date, arrive_details,
        return_date, return_details,
        notes, paid, paid_note,
        status, created_at, updated_at, updated_by
      ) VALUES (
        ${record.id}, ${record.name}, ${record.city}, ${record.phone},
        ${record.food}, ${record.groupId}, ${record.groupName},
        ${record.arriveDate}, ${record.arriveDetails},
        ${record.returnDate}, ${record.returnDetails},
        ${record.notes}, ${record.paid}, ${record.paidNote},
        ${record.status},
        ${record.createdAt}, ${record.updatedAt}, ${record.updatedBy}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name, city = EXCLUDED.city, phone = EXCLUDED.phone,
        food = EXCLUDED.food,
        group_id = EXCLUDED.group_id, group_name = EXCLUDED.group_name,
        arrive_date = EXCLUDED.arrive_date,
        arrive_details = EXCLUDED.arrive_details,
        return_date = EXCLUDED.return_date,
        return_details = EXCLUDED.return_details,
        notes = EXCLUDED.notes,
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
    total: Number(r.amount ?? 0) || 0,
    note: r.note ?? "",
    appliesToAll: r.applies_to_all !== false,
    memberIds: String(r.member_ids ?? "").split(",").filter(Boolean),
    itineraryId: r.itinerary_id ?? "",
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
      INSERT INTO costs (id, label, amount, note, applies_to_all, member_ids,
                         itinerary_id, created_at)
      VALUES (${item.id}, ${item.label}, ${item.total}, ${item.note},
              ${item.appliesToAll}, ${item.memberIds.join(",")},
              ${item.itineraryId}, ${item.createdAt})
      ON CONFLICT (id) DO UPDATE SET
        label = EXCLUDED.label, amount = EXCLUDED.amount, note = EXCLUDED.note,
        applies_to_all = EXCLUDED.applies_to_all,
        member_ids = EXCLUDED.member_ids,
        itinerary_id = EXCLUDED.itinerary_id
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
  arriveDetails: "arrival notes",
  returnDate: "departure date",
  returnDetails: "departure notes",
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
