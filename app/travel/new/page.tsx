import { redirect } from "next/navigation";
import TravelForm from "@/components/TravelForm";
import { getRole, getWho } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewTravelPage() {
  if (!(await getRole())) redirect("/unlock");
  const who = await getWho();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-bone">
        Add travel details
      </h1>
      <p className="mt-2 text-bone-dim">
        Filling this in for someone else? Go ahead — just put their name in the
        name box. It&apos;ll be logged as entered by {who || "you"}.
      </p>
      <div className="mt-8">
        <TravelForm who={who} />
      </div>
    </div>
  );
}
