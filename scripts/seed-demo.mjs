/**
 * Fills the local JSON store with a handful of made-up friends so you can see
 * what the site looks like with real data in it.
 *
 *   node scripts/seed-demo.mjs
 *
 * To wipe it again, just delete the .data folder. This only ever touches local
 * file storage — if DATABASE_URL is set, the app reads Postgres and ignores it.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

const base = {
  phone: "",
  guestsAdults: 0,
  guestsKids: 0,
  food: "Veg",
  arriveGateway: "",
  arriveMode: "",
  arriveDetails: "",
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
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  updatedBy: "Mayuri",
};

const participants = [
  {
    ...base, id: "demo-1", name: "Mayuri Deshpande", city: "Pune",
    phone: "+919812345678", guestsAdults: 1,
    arriveDate: "2026-11-20", arriveTime: "14:30", arriveGateway: "Nagpur",
    arriveMode: "Flight", arriveDetails: "6E-234 Pune to Nagpur",
    returnDate: "2026-11-22", returnTime: "18:00", returnGateway: "Nagpur",
    returnMode: "Flight",
    stayAssigned: "Tigress Retreat - Cottage 1", vehicleGroup: "Nagpur TT-1",
    preNightStay: "Hotel Centre Point, Nagpur",
    notes: "Reaching a day early to check the resort.",
  },
  {
    ...base, id: "demo-2", name: "Amit Kulkarni", city: "Mumbai",
    food: "Non-veg", guestsAdults: 1, guestsKids: 2,
    arriveDate: "2026-11-20", arriveTime: "15:10", arriveGateway: "Nagpur",
    arriveMode: "Flight",
    returnDate: "2026-11-22", returnTime: "19:20", returnGateway: "Nagpur",
    returnMode: "Flight",
    stayAssigned: "Tigress Retreat - Cottage 1", vehicleGroup: "Nagpur TT-1",
  },
  {
    ...base, id: "demo-3", name: "Sneha Jadhav", city: "Solapur", food: "Jain",
    arriveDate: "2026-11-21", arriveTime: "06:40", arriveGateway: "Chandrapur",
    arriveMode: "Train", arriveDetails: "12289 Sewagram Express",
    returnDate: "2026-11-22", returnTime: "07:15", returnGateway: "Chandrapur",
    returnMode: "Train",
    stayPreference: "Somewhere close to the gate please", status: "Tentative",
  },
  {
    ...base, id: "demo-4", name: "Rohit Pawar", city: "Beed", guestsAdults: 1,
    arriveDate: "2026-11-21", arriveTime: "09:00",
    arriveGateway: "Straight to the resort", arriveMode: "Own car",
    returnDate: "2026-11-23", returnTime: "08:00",
    returnGateway: "Straight to the resort", returnMode: "Own car",
    notes: "Have 4 spare seats if anyone needs a lift from the Latur side.",
  },
  {
    ...base, id: "demo-5", name: "Priya Shah", city: "Ahmedabad",
    arriveDate: "2026-11-21", arriveTime: "13:45", arriveGateway: "Nagpur",
    arriveMode: "Flight",
    returnDate: "2026-11-22", returnTime: "20:30", returnGateway: "Nagpur",
    returnMode: "Flight",
  },
  {
    ...base, id: "demo-6", name: "Nilesh Bhosale", city: "Aurangabad",
    food: "Non-veg", arriveDate: "", arriveTime: "", returnDate: "",
    returnTime: "", status: "Tentative",
    notes: "Not sure yet, will confirm by October.",
  },
];

const dir = path.join(process.cwd(), ".data");
await fs.mkdir(dir, { recursive: true });
await fs.writeFile(
  path.join(dir, "db.json"),
  JSON.stringify({ participants, audit: [] }, null, 2),
);

console.log(`Seeded ${participants.length} demo friends into .data/db.json`);
console.log("Delete the .data folder to clear them.");
