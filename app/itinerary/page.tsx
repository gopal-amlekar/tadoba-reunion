import { redirect } from "next/navigation";
import ItineraryBoard, { type EntryCost } from "@/components/ItineraryBoard";
import { getRole } from "@/lib/auth";
import { listCosts, listItinerary, listParticipants } from "@/lib/db";
import { EVENT } from "@/lib/event";
import { moneySummary } from "@/lib/money";

export const dynamic = "force-dynamic";

/**
 * The programme, open to the whole group. Mayuri sees exactly this page with
 * the editing controls switched on — one itinerary, not an organiser's copy
 * and a published copy that drift apart.
 *
 * Safaris are just programme entries like anything else. They used to have
 * their own slot-based booking panel and reporting-times board; a drive is a
 * time and a place, which is what an entry already is, so the special case
 * earned nothing.
 */
export default async function ItineraryPage() {
  const role = await getRole();
  if (!role) redirect("/unlock");
  const canEdit = role === "admin";

  const items = await listItinerary();
  const costs = await listCosts();
  const people = await listParticipants();

  // Divide here rather than in the board: splitting a bill needs the whole
  // group, which is a server concern, and the board only wants the answer.
  const byEntry: Record<string, EntryCost> = {};
  for (const row of moneySummary(people, costs).perItem) {
    if (!row.item.itineraryId) continue;
    byEntry[row.item.itineraryId] = {
      total: row.item.total,
      each: row.each,
      heads: row.heads,
    };
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-bone">
        The programme
      </h1>
      <p className="mt-1 text-bone-dim">
        {EVENT.mainDays} at {EVENT.venue}.{" "}
        {canEdit
          ? "Anything you change here is live for the whole group immediately."
          : `${EVENT.organiser} keeps this up to date — it's the one to check on the day.`}
      </p>

      <div className="mt-8">
        <ItineraryBoard items={items} costs={byEntry} canEdit={canEdit} />
      </div>
    </div>
  );
}
