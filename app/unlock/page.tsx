import UnlockForm from "@/components/UnlockForm";
import { getWho } from "@/lib/auth";
import { EVENT } from "@/lib/event";

export const dynamic = "force-dynamic";

export default async function UnlockPage() {
  const who = await getWho();

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-display text-4xl font-bold text-bone">
        Who goes there?
      </h1>
      <p className="mt-2 text-bone-dim">
        One password for the whole group — {EVENT.organiser} shares it. Mayuri
        has a second one that unlocks the logistics view.
      </p>
      <UnlockForm defaultWho={who} />
    </div>
  );
}
