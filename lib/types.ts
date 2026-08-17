export type Participant = {
  id: string;
  name: string;
  city: string;
  phone: string;
  /**
   * Kept, and kept out of the form for now — the veg/non-veg question only
   * matters once a resort asks for a headcount, and asking it up front was
   * noise. Nothing writes it any more; existing answers are still here.
   */
  food: string;

  /**
   * People travelling together share a group. Stored as an id plus the name so
   * renaming a group can never split it in two, the way a free-typed label
   * would ("Amlekar family" vs "Amlekar Family").
   */
  groupId: string;
  groupName: string;

  /**
   * When they come and when they leave — the only two things the form insists
   * on. Everything else about the journey goes in the notes beside them as
   * free text: ten dropdowns for time, gateway and mode asked people to be
   * precise months before they'd booked anything.
   */
  arriveDate: string;
  /** "2:30pm at Nagpur, 6E-234 from Pune" — whatever they actually know. */
  arriveDetails: string;

  returnDate: string;
  returnDetails: string;

  /** Anything else they want Mayuri to know. */
  notes: string;

  // ---- Money, filled in by Mayuri ----
  /** Total rupees received from this person so far. */
  paid: number;
  /** How it came in — "UPI 12 Oct ₹3000 + cash ₹1500". */
  paidNote: string;

  status: string;

  createdAt: string;
  updatedAt: string;
  updatedBy: string;
};

/**
 * One line of the programme. Mayuri writes these; everyone reads them.
 * Ordering is derived — date, then time — so fixing a time reorders the day
 * and there is no separate drag-and-drop to get wrong.
 */
export type ItineraryItem = {
  id: string;
  /** "2026-11-21". */
  date: string;
  /** "HH:MM", or empty for something that has no fixed hour. */
  time: string;
  title: string;
  /** The extra line under the title — where to meet, what to carry. */
  detail: string;
  createdAt: string;
};

/**
 * One thing the trip costs: the whole bill, split between the people it applies
 * to. Note the consequence — a share moves whenever the group does, so adding a
 * late joiner re-divides every cost they're part of.
 */
export type CostItem = {
  id: string;
  label: string;
  /**
   * The total in rupees, for everybody it applies to together — not per head.
   * Whole rupees: the split has to reconcile to the last rupee and nobody in
   * this group is settling up in paise.
   */
  total: number;
  /** "4 gypsies, 6 seats each" — context for the number. */
  note: string;
  /** When false, only the people in `memberIds` pay for this. */
  appliesToAll: boolean;
  memberIds: string[];
  /**
   * Set when this cost belongs to a line of the programme, so the two stay in
   * step: the entry's title becomes the label, and deleting the entry takes the
   * cost with it. Empty for the extras — tips, water, a cake — that belong to
   * no particular event.
   */
  itineraryId: string;
  createdAt: string;
};

export type AuditEntry = {
  id: number;
  participantId: string;
  participantName: string;
  action: "created" | "updated" | "deleted";
  changedBy: string;
  summary: string;
  at: string;
};

export const EMPTY_PARTICIPANT: Omit<Participant, "id" | "createdAt" | "updatedAt" | "updatedBy"> = {
  name: "",
  city: "",
  phone: "",
  food: "Veg",
  groupId: "",
  groupName: "",
  arriveDate: "",
  arriveDetails: "",
  returnDate: "",
  returnDetails: "",
  notes: "",
  paid: 0,
  paidNote: "",
  status: "Confirmed",
};
