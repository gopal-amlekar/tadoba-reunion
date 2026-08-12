import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import type { AuditEntry, Participant } from "./types";

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

type FileShape = { participants: Participant[]; audit: AuditEntry[] };

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
        stay_assigned   TEXT DEFAULT '',
        pre_night_stay  TEXT DEFAULT '',
        vehicle_group   TEXT DEFAULT '',
        admin_notes     TEXT DEFAULT '',
        status          TEXT DEFAULT 'Confirmed',
        created_at      TIMESTAMPTZ DEFAULT now(),
        updated_at      TIMESTAMPTZ DEFAULT now(),
        updated_by      TEXT DEFAULT ''
      )
    `;
    // Added after the first deploy, so existing tables need it backfilled.
    await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS pre_night_stay TEXT DEFAULT ''`;
    await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS group_id TEXT DEFAULT ''`;
    await sql`ALTER TABLE participants ADD COLUMN IF NOT EXISTS group_name TEXT DEFAULT ''`;
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
    stayAssigned: r.stay_assigned ?? "",
    preNightStay: r.pre_night_stay ?? "",
    vehicleGroup: r.vehicle_group ?? "",
    adminNotes: r.admin_notes ?? "",
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
        stay_preference, notes, stay_assigned, pre_night_stay, vehicle_group,
        admin_notes, status, created_at, updated_at, updated_by
      ) VALUES (
        ${record.id}, ${record.name}, ${record.city}, ${record.phone},
        ${record.food}, ${record.groupId}, ${record.groupName},
        ${record.arriveDate}, ${record.arriveTime}, ${record.arriveGateway},
        ${record.arriveMode}, ${record.arriveDetails},
        ${record.returnDate}, ${record.returnTime}, ${record.returnGateway},
        ${record.returnMode}, ${record.returnDetails},
        ${record.stayPreference}, ${record.notes}, ${record.stayAssigned},
        ${record.preNightStay}, ${record.vehicleGroup}, ${record.adminNotes},
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
        stay_assigned = EXCLUDED.stay_assigned,
        pre_night_stay = EXCLUDED.pre_night_stay,
        vehicle_group = EXCLUDED.vehicle_group,
        admin_notes = EXCLUDED.admin_notes, status = EXCLUDED.status,
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
  stayAssigned: "Tadoba stay",
  preNightStay: "pre-event night stay",
  vehicleGroup: "vehicle group",
  adminNotes: "organiser notes",
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
