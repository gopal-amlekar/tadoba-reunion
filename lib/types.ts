export type Participant = {
  id: string;
  name: string;
  city: string;
  phone: string;
  /** Adults travelling with them, not counting themselves. */
  guestsAdults: number;
  guestsKids: number;
  food: string;

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

  // ---- Filled in by Mayuri from the admin page ----
  stayAssigned: string;
  vehicleGroup: string;
  adminNotes: string;
  status: string;

  createdAt: string;
  updatedAt: string;
  updatedBy: string;
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

/** Total heads a participant brings, including themselves. */
export function headcount(p: Participant): number {
  return 1 + (p.guestsAdults || 0) + (p.guestsKids || 0);
}

export const EMPTY_PARTICIPANT: Omit<Participant, "id" | "createdAt" | "updatedAt" | "updatedBy"> = {
  name: "",
  city: "",
  phone: "",
  guestsAdults: 0,
  guestsKids: 0,
  food: "No preference",
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
  stayAssigned: "",
  vehicleGroup: "",
  adminNotes: "",
  status: "Confirmed",
};
