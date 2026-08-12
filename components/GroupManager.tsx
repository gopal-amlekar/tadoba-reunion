"use client";

import { useActionState, useRef, useState } from "react";
import Link from "next/link";
import {
  addGroupMemberAction,
  createGroupAction,
  disbandGroupAction,
  removeGroupMemberAction,
  renameGroupAction,
  type FormState,
} from "@/app/actions";
import AnimalAvatar from "@/components/AnimalAvatar";
import { looksLikeMultipleNames, type TravelGroup } from "@/lib/groups";
import type { Participant } from "@/lib/types";

const initial: FormState = {};

/** Add exactly one person: pick an existing entry, or type a single new name. */
function AddMember({
  group,
  candidates,
}: {
  group: TravelGroup;
  candidates: Participant[];
}) {
  const [state, action, pending] = useActionState(addGroupMemberAction, initial);
  const [typed, setTyped] = useState("");
  const [picked, setPicked] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  // Warn while typing rather than only after submitting.
  const multi = typed.trim() !== "" && looksLikeMultipleNames(typed);

  return (
    <form
      ref={formRef}
      action={(fd) => {
        action(fd);
        setTyped("");
        setPicked("");
      }}
      className="mt-4 border-t border-jungle-800 pt-4"
    >
      <input type="hidden" name="groupId" value={group.id} />
      <input type="hidden" name="groupName" value={group.name} />

      <p className="label">Add one person</p>

      <div className="grid gap-3 sm:grid-cols-[1fr_auto_1fr_auto]">
        <select
          name="memberId"
          value={picked}
          onChange={(e) => {
            setPicked(e.target.value);
            if (e.target.value) setTyped("");
          }}
          className="field !py-2 text-sm"
        >
          <option value="">— already on the list —</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.city ? ` · ${c.city}` : ""}
            </option>
          ))}
        </select>

        <span className="self-center text-center text-xs text-bone-dim">or</span>

        <input
          name="newName"
          value={typed}
          onChange={(e) => {
            setTyped(e.target.value);
            if (e.target.value) setPicked("");
          }}
          placeholder="type one new name"
          autoComplete="off"
          className="field !py-2 text-sm"
        />

        <button
          type="submit"
          disabled={pending || multi || (!picked && !typed.trim())}
          className="btn-ghost !py-2 text-sm"
        >
          {pending ? "Adding…" : "Add"}
        </button>
      </div>

      {multi && (
        <p className="mt-2 text-xs text-tiger-light">
          One person at a time, please — add “{typed.trim().split(/[,;/&+]|\band\b/i)[0].trim()}”
          first, then the next.
        </p>
      )}
      {state.error && (
        <p className="mt-2 text-xs text-tiger-light">{state.error}</p>
      )}
      <p className="mt-2 text-xs text-bone-dim">
        A new name joins the list straight away with blank travel details —
        anyone can fill those in later.
      </p>
    </form>
  );
}

function GroupCard({
  group,
  candidates,
}: {
  group: TravelGroup;
  candidates: Participant[];
}) {
  const [renaming, setRenaming] = useState(false);

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        {renaming ? (
          <form action={renameGroupAction} className="flex flex-1 gap-2">
            <input type="hidden" name="groupId" value={group.id} />
            <input
              name="groupName"
              defaultValue={group.name}
              autoFocus
              className="field !py-2 text-sm"
            />
            <button type="submit" className="btn-ghost !py-2 text-sm">
              Save
            </button>
          </form>
        ) : (
          <div>
            <h3 className="font-display text-xl font-bold text-bone">
              {group.name}
            </h3>
            <p className="text-sm text-bone-dim">
              {group.members.length}{" "}
              {group.members.length === 1 ? "person" : "people"} travelling
              together
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={() => setRenaming((v) => !v)}
          className="text-xs text-bone-dim underline hover:text-leaf"
        >
          {renaming ? "Cancel" : "Rename"}
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {group.members.map((m) => (
          <li
            key={m.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-jungle-800 bg-jungle-950/50 px-3 py-2"
          >
            <Link
              href={`/travel/${m.id}`}
              className="flex items-center gap-2.5 text-sm text-bone hover:text-tiger"
            >
              <AnimalAvatar name={m.name} size={30} />
              <span>
                {m.name}
                {!m.arriveDate && (
                  <span className="ml-2 text-xs text-tiger">
                    travel details missing
                  </span>
                )}
              </span>
            </Link>
            <form action={removeGroupMemberAction}>
              <input type="hidden" name="id" value={m.id} />
              <button
                type="submit"
                className="text-xs text-bone-dim underline hover:text-tiger"
              >
                Remove
              </button>
            </form>
          </li>
        ))}
      </ul>

      <AddMember group={group} candidates={candidates} />

      <form action={disbandGroupAction} className="mt-4">
        <input type="hidden" name="groupId" value={group.id} />
        <button
          type="submit"
          className="text-xs text-bone-dim underline hover:text-tiger"
        >
          Disband this group (everyone stays on the list)
        </button>
      </form>
    </div>
  );
}

function NewGroup({ candidates }: { candidates: Participant[] }) {
  const [state, action, pending] = useActionState(createGroupAction, initial);

  return (
    <form action={action} className="card p-5">
      <h3 className="font-display text-xl font-bold text-leaf">
        Start a new group
      </h3>
      <p className="mt-1 text-sm text-bone-dim">
        Give it a name you&apos;d actually say out loud — “Pune car”, “Amlekar
        family”, “Mumbai flight crowd”.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input
          name="groupName"
          placeholder="Group name"
          required
          className="field !py-2 text-sm"
        />
        <select name="firstMemberId" className="field !py-2 text-sm">
          <option value="">— first member (optional) —</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.city ? ` · ${c.city}` : ""}
            </option>
          ))}
        </select>
        <button type="submit" disabled={pending} className="btn-primary !py-2 text-sm">
          {pending ? "Creating…" : "Create group"}
        </button>
      </div>

      {state.error && (
        <p className="mt-2 text-sm text-tiger-light">{state.error}</p>
      )}
    </form>
  );
}

export default function GroupManager({
  groups,
  ungroupedPeople,
}: {
  groups: TravelGroup[];
  ungroupedPeople: Participant[];
}) {
  return (
    <div className="space-y-5">
      <NewGroup candidates={ungroupedPeople} />

      {groups.length === 0 ? (
        <p className="card p-6 text-bone-dim">
          No groups yet. Most people travel in twos and threes — grouping them
          means the plan shows one car instead of four separate names.
        </p>
      ) : (
        groups.map((g) => (
          <GroupCard key={g.id} group={g} candidates={ungroupedPeople} />
        ))
      )}

      {ungroupedPeople.length > 0 && (
        <div className="card p-5">
          <h3 className="font-display text-lg font-bold text-bone-dim">
            Travelling alone so far
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {ungroupedPeople.map((p) => (
              <Link
                key={p.id}
                href={`/travel/${p.id}`}
                className="chip hover:!border-leaf/50 hover:!text-leaf"
              >
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
