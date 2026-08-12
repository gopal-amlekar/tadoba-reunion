import { redirect } from "next/navigation";
import GroupManager from "@/components/GroupManager";
import { getRole } from "@/lib/auth";
import { listParticipants } from "@/lib/db";
import { listGroups, ungrouped } from "@/lib/groups";

export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  if (!(await getRole())) redirect("/unlock");

  const people = (await listParticipants()).filter(
    (p) => p.status !== "Cancelled",
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-4xl font-bold text-bone">
        Who&apos;s travelling together
      </h1>
      <p className="mt-2 text-bone-dim">
        Put people who share a car, a train coach or a booking into one group.
        The plan then shows the group as a single party instead of repeating
        everyone individually.
      </p>

      <div className="mt-8">
        <GroupManager
          groups={listGroups(people)}
          ungroupedPeople={ungrouped(people)}
        />
      </div>
    </div>
  );
}
