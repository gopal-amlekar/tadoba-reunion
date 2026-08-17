import { NextResponse } from "next/server";
import { getRole } from "@/lib/auth";
import { listCosts, listParticipants } from "@/lib/db";
import { ledgerFor } from "@/lib/money";
import { type CostItem, type Participant } from "@/lib/types";

export const dynamic = "force-dynamic";

const COLUMNS: Array<[string, (p: Participant) => string | number]> = [
  ["Name", (p) => p.name],
  ["City", (p) => p.city],
  ["Phone", (p) => p.phone],
  ["Food", (p) => p.food],
  ["Travelling with", (p) => p.groupName],
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
  ["Status", (p) => p.status],
  ["Their notes", (p) => p.notes],
  ["Last updated", (p) => p.updatedAt],
  ["Updated by", (p) => p.updatedBy],
];

/**
 * The money columns need the cost list, so they're built per export rather
 * than living in the static table above. Plain numbers, no ₹ — this file gets
 * opened in a spreadsheet and totalled.
 */
function moneyColumns(
  costs: CostItem[],
): Array<[string, (p: Participant) => string | number]> {
  return [
    ["Share", (p) => ledgerFor(p, costs).share],
    ["Received", (p) => p.paid || 0],
    ["Balance", (p) => ledgerFor(p, costs).balance],
    ["Payment note", (p) => p.paidNote],
  ];
}

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
  const columns = [...COLUMNS, ...moneyColumns(await listCosts())];
  const rows = [
    columns.map(([header]) => cell(header)).join(","),
    ...people.map((p) => columns.map(([, get]) => cell(get(p))).join(",")),
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
