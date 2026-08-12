import { redirect } from "next/navigation";
import PlanView from "@/components/PlanView";
import { getRole } from "@/lib/auth";
import { listParticipants, listSafaris } from "@/lib/db";
import { EVENT } from "@/lib/event";

export const dynamic = "force-dynamic";

/**
 * The plan, open to the whole group. Same boards Mayuri works from, minus the
 * things that are hers alone: her private notes, the change log, the export
 * and every editing control.
 */
export default async function PlanPage() {
  if (!(await getRole())) redirect("/unlock");

  const people = await listParticipants();
  const safaris = await listSafaris();

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-bone">The plan</h1>
      <p className="mt-1 text-bone-dim">
        Who is travelling with whom, which vehicle, and where everyone sleeps.
        {EVENT.organiser} keeps this up to date — if something looks wrong about
        your own travel, fix it on the travel list and this updates itself.
      </p>

      <div className="mt-8">
        <PlanView people={people} safaris={safaris} />
      </div>
    </div>
  );
}
