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

  // ---- Filled in by Mayuri from the admin page ----
  /** Where they sleep at Tadoba during the event itself. */
  stayAssigned: string;
  /**
   * Where they sleep the night they arrive early — usually a hotel in Nagpur
   * or Chandrapur, sometimes the resort itself if they drive straight in.
   * Only relevant for people landing before the main day.
   */
  preNightStay: string;
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
  stayAssigned: "",
  preNightStay: "",
  vehicleGroup: "",
  adminNotes: "",
  status: "Confirmed",
};
