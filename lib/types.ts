export type Participant = {
  id: string;
  name: string;
  city: string;
  phone: string;
  food: string;

  /**
   * People travelling together share a group. Stored as an id plus the name so
   * renaming a group can never split it in two, the way a free-typed label
   * would ("Amlekar family" vs "Amlekar Family").
   */
  groupId: string;
  groupName: string;

  arriveDate: string;
  arriveTime: string;
  arriveGateway: string;
  arriveMode: string;
  /** Train name/number, flight number, "driving via Warora", etc. */
  arriveDetails: string;

  returnDate: string;
  returnTime: string;
  returnGateway: string;
  returnMode: string;
  returnDetails: string;

  /** Where they'd like to stay, in their own words. */
  stayPreference: string;
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
 * A booked safari. Event-level rather than per-person: Mayuri books the gypsies
 * and everyone reads the same reporting time.
 */
export type Safari = {
  id: string;
  /** One of SAFARI_SLOTS — which drive it is. */
  slot: string;
  /** Exact reporting time, "HH:MM". */
  time: string;
  /** Gate, meeting point, vehicle count — whatever people need to know. */
  note: string;
  createdAt: string;
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
 * One thing the trip costs, priced per person rather than as a lump sum.
 * A per-head rate is what Mayuri is actually quoted (a gypsy seat, a room
 * share, a bus seat), and it means a person's contribution never shifts
 * underneath them when somebody else joins or drops out.
 */
export type CostItem = {
  id: string;
  label: string;
  /** Rupees per person. */
  amount: number;
  /** "4 gypsies, 6 seats each" — context for the number. */
  note: string;
  /** When false, only the people in `memberIds` pay for this. */
  appliesToAll: boolean;
  memberIds: string[];
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
  arriveTime: "",
  arriveGateway: "",
  arriveMode: "",
  arriveDetails: "",
  returnDate: "",
  returnTime: "",
  returnGateway: "",
  returnMode: "",
  returnDetails: "",
  stayPreference: "",
  notes: "",
  paid: 0,
  paidNote: "",
  status: "Confirmed",
};
