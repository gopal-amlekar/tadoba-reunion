import { NextResponse } from "next/server";
import { getRole } from "@/lib/auth";
import { listCosts, listParticipants } from "@/lib/db";
import { ledger } from "@/lib/money";
import { type CostItem, type Participant } from "@/lib/types";

export const dynamic = "force-dynamic";

const COLUMNS: Array<[string, (p: Participant) => string | number]> = [
  ["Name", (p) => p.name],
  ["City", (p) => p.city],
  ["Phone", (p) => p.phone],
  ["Food", (p) => p.food],
  ["Travelling with", (p) => p.groupName],
  ["Arrive date", (p) => p.arriveDate],
  ["Arrival notes", (p) => p.arriveDetails],
  ["Depart date", (p) => p.returnDate],
  ["Departure notes", (p) => p.returnDetails],
  ["Status", (p) => p.status],
  ["Their notes", (p) => p.notes],
  ["Last updated", (p) => p.updatedAt],
  ["Updated by", (p) => p.updatedBy],
];

/**
 * The money columns need every cost and the whole group — a bill is divided
 * between its payers, so one person's share can't be worked out alone. The
 * ledger is therefore built once and looked up per row. Plain numbers, no ₹:
 * this file gets opened in a spreadsheet and totalled.
 */
function moneyColumns(
  people: Participant[],
  costs: CostItem[],
): Array<[string, (p: Participant) => string | number]> {
  const books = new Map(
    ledger(people, costs).map((b) => [b.person.id, b] as const),
  );
  return [
    ["Share", (p) => books.get(p.id)?.share ?? 0],
    ["Received", (p) => p.paid || 0],
    ["Balance", (p) => books.get(p.id)?.balance ?? -(p.paid || 0)],
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
  const columns = [...COLUMNS, ...moneyColumns(people, await listCosts())];
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
