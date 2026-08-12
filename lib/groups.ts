import type { Participant } from "./types";

export type TravelGroup = {
  id: string;
  name: string;
  members: Participant[];
};

/** Every group that currently has at least one member, largest first. */
export function listGroups(people: Participant[]): TravelGroup[] {
  const groups = new Map<string, TravelGroup>();

  for (const p of people) {
    if (!p.groupId) continue;
    const g = groups.get(p.groupId) ?? {
      id: p.groupId,
      // Members all carry the name; take the first non-empty one we see.
      name: p.groupName || "Unnamed group",
      members: [],
    };
    if (!g.name && p.groupName) g.name = p.groupName;
    g.members.push(p);
    groups.set(p.groupId, g);
  }

  return [...groups.values()]
    .map((g) => ({
      ...g,
      members: g.members.sort((a, b) => a.name.localeCompare(b.name)),
    }))
    .sort(
      (a, b) => b.members.length - a.members.length || a.name.localeCompare(b.name),
    );
}

export function ungrouped(people: Participant[]): Participant[] {
  return people.filter((p) => !p.groupId);
}

/**
 * Collapse a list of people into what should actually be read as one line:
 * a whole group, or a lone traveller. Used wherever the plan would otherwise
 * repeat four family members who are obviously arriving in one car.
 */
export type Party =
  | { kind: "group"; id: string; name: string; members: Participant[] }
  | { kind: "solo"; person: Participant };

export function asParties(people: Participant[]): Party[] {
  const seen = new Map<string, Participant[]>();
  const parties: Party[] = [];

  for (const p of people) {
    if (!p.groupId) {
      parties.push({ kind: "solo", person: p });
      continue;
    }
    const existing = seen.get(p.groupId);
    if (existing) {
      existing.push(p);
      continue;
    }
    const members: Participant[] = [p];
    seen.set(p.groupId, members);
    parties.push({
      kind: "group",
      id: p.groupId,
      name: p.groupName || "Travelling together",
      members,
    });
  }

  return parties;
}

export function partySize(party: Party): number {
  return party.kind === "group" ? party.members.length : 1;
}

/**
 * Names must be added one at a time — a single box invites "Ravi and Sunita",
 * which would create one person with a nonsense name. Catch the common joiners
 * and ask again rather than silently mangling it.
 */
const MULTI_NAME = /(,|;|\/|\band\b|&|\+)/i;

export function looksLikeMultipleNames(value: string): boolean {
  return MULTI_NAME.test(value.trim());
}
