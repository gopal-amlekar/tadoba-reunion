import { redirect } from "next/navigation";
import ItineraryBoard from "@/components/ItineraryBoard";
import SafariBoard from "@/components/SafariBoard";
import SafariEditor from "@/components/SafariEditor";
import { getRole } from "@/lib/auth";
import { listItinerary, listSafaris } from "@/lib/db";
import { EVENT } from "@/lib/event";

export const dynamic = "force-dynamic";

/**
 * The programme, open to the whole group. Mayuri sees exactly this page with
 * the editing controls switched on — one itinerary, not an organiser's copy
 * and a published copy that drift apart.
 */
export default async function ItineraryPage() {
  const role = await getRole();
  if (!role) redirect("/unlock");
  const canEdit = role === "admin";

  const items = await listItinerary();
  const safaris = await listSafaris();

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
        <SafariBoard safaris={safaris} />
      </div>

      {canEdit && (
        <div className="no-print mt-6">
          <SafariEditor safaris={safaris} />
        </div>
      )}

      <div className="mt-10">
        <ItineraryBoard items={items} canEdit={canEdit} />
      </div>
    </div>
  );
}
