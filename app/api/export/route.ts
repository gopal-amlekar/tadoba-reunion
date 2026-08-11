import { NextResponse } from "next/server";
import { getRole } from "@/lib/auth";
import { listParticipants } from "@/lib/db";
import { type Participant } from "@/lib/types";

export const dynamic = "force-dynamic";

const COLUMNS: Array<[string, (p: Participant) => string | number]> = [
  ["Name", (p) => p.name],
  ["City", (p) => p.city],
  ["Phone", (p) => p.phone],
  ["Food", (p) => p.food],
  ["Arrive date", (p) => p.arriveDate],
  ["Arrive time", (p) => p.arriveTime],
  ["Arrive gateway", (p) => p.arriveGateway],
  ["Arrive mode", (p) => p.arriveMode],
  ["Arrive details", (p) => p.arriveDetails],
  ["Return date", (p) => p.returnDate],
  ["Return time", (p) => p.returnTime],
  ["Return gateway", (p) => p.returnGateway],
  ["Return mode", (p) => p.returnMode],
  ["Return details", (p) => p.returnDetails],
  ["Stay suggested", (p) => p.stayPreference],
  ["Tadoba stay", (p) => p.stayAssigned],
  ["Night-before stay", (p) => p.preNightStay],
  ["Vehicle group", (p) => p.vehicleGroup],
  ["Status", (p) => p.status],
  ["Their notes", (p) => p.notes],
  ["Organiser notes", (p) => p.adminNotes],
  ["Last updated", (p) => p.updatedAt],
  ["Updated by", (p) => p.updatedBy],
];

/**
 * Excel treats a leading =, +, - or @ as a formula. Prefix those cells with a
 * single quote so a name like "+91..." can't execute on open.
 */
function cell(value: string | number): string {
  const s = String(value ?? "");
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  if ((await getRole()) !== "admin") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const people = await listParticipants();
  const rows = [
    COLUMNS.map(([header]) => cell(header)).join(","),
    ...people.map((p) => COLUMNS.map(([, get]) => cell(get(p))).join(",")),
  ];

  // BOM so Excel opens it as UTF-8 rather than mangling names.
  const csv = `﻿${rows.join("\r\n")}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="tadoba-reunion.csv"',
      "Cache-Control": "no-store",
    },
  });
}
