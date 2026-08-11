import { notFound, redirect } from "next/navigation";
import AnimalAvatar from "@/components/AnimalAvatar";
import TravelForm from "@/components/TravelForm";
import { getRole, getWho } from "@/lib/auth";
import { getParticipant } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function EditTravelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await getRole())) redirect("/unlock");

  const { id } = await params;
  const participant = await getParticipant(id);
  if (!participant) notFound();

  const who = await getWho();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex items-center gap-4">
        <AnimalAvatar name={participant.name} size={64} />
        <h1 className="font-display text-4xl font-bold text-bone">
          {participant.name}
        </h1>
      </div>
      <p className="mt-2 text-bone-dim">
        Last updated{" "}
        {new Date(participant.updatedAt).toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
        {participant.updatedBy && ` by ${participant.updatedBy}`}.
      </p>
      <div className="mt-8">
        <TravelForm participant={participant} who={who} />
      </div>
    </div>
  );
}
