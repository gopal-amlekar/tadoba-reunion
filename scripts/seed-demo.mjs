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
  food: "Veg",
  arriveGateway: "",
  arriveMode: "",
  arriveDetails: "",
  returnGateway: "",
  returnMode: "",
  returnDetails: "",
  stayPreference: "",
  notes: "",
  paid: 0,
  paidNote: "",
  status: "Confirmed",
  createdAt: "2026-08-01T10:00:00.000Z",
  updatedAt: "2026-08-01T10:00:00.000Z",
  updatedBy: "Mayuri",
};

const participants = [
  {
    ...base, id: "demo-1", name: "Mayuri Deshpande", city: "Pune",
    phone: "+919812345678", arriveDate: "2026-11-20", arriveTime: "14:30", arriveGateway: "Nagpur",
    arriveMode: "Flight", arriveDetails: "6E-234 Pune to Nagpur",
    returnDate: "2026-11-22", returnTime: "18:00", returnGateway: "Nagpur",
    returnMode: "Flight",
    paid: 7500, paidNote: "Paid her own share up front",
    notes: "Reaching a day early to check the resort.",
  },
  {
    ...base, id: "demo-2", name: "Amit Kulkarni", city: "Mumbai",
    food: "Non-veg", arriveDate: "2026-11-20", arriveTime: "15:10", arriveGateway: "Nagpur",
    arriveMode: "Flight",
    returnDate: "2026-11-22", returnTime: "19:20", returnGateway: "Nagpur",
    returnMode: "Flight",
    paid: 4000, paidNote: "UPI 3 Sep ₹4000, rest promised after Diwali",
  },
  {
    ...base, id: "demo-3", name: "Sneha Jadhav", city: "Solapur", food: "Veg",
    arriveDate: "2026-11-21", arriveTime: "06:40", arriveGateway: "Chandrapur",
    arriveMode: "Train", arriveDetails: "12289 Sewagram Express",
    returnDate: "2026-11-22", returnTime: "07:15", returnGateway: "Chandrapur",
    returnMode: "Train",
    stayPreference: "Somewhere close to the gate please", status: "Tentative",
  },
  {
    ...base, id: "demo-4", name: "Rohit Pawar", city: "Beed", arriveDate: "2026-11-21", arriveTime: "09:00",
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

const itinerary = [
  ["2026-11-20", "18:00", "Early arrivals reach Nagpur", "Hotel Centre Point — dinner on your own."],
  ["2026-11-21", "09:00", "Convoy leaves Nagpur", "In the lobby by 8:45 please, we leave on the dot."],
  ["2026-11-21", "13:00", "Check in at the resort", "Lunch is laid out, rooms from 2pm."],
  ["2026-11-21", "15:00", "Evening safari", "Report at Moharli gate. Carry a jacket, it gets cold."],
  ["2026-11-21", "20:30", "Bonfire and dinner", "Antakshari is not optional."],
  ["2026-11-22", "05:30", "Morning safari", "Tea at 5:15 for anyone who can face it."],
  ["2026-11-22", "11:00", "Breakfast, group photo, check out", ""],
  ["2026-11-22", "", "Drops to Nagpur and Chandrapur", "Cars leave to suit your train or flight."],
].map(([date, time, title, detail], i) => ({
  id: `demo-itin-${i + 1}`,
  date,
  time,
  title,
  detail,
  createdAt: `2026-08-05T09:0${i}:00.000Z`,
}));

/**
 * Every total is for the whole group, to be divided — not a per-head rate.
 * Three are tied to programme entries (so they show on both pages and keep
 * their names in step); the last is a standalone extra.
 */
const costs = [
  {
    id: "demo-cost-1", label: "Check in at the resort", total: 27000,
    note: "2 nights, twin sharing, all meals",
    appliesToAll: true, memberIds: [], itineraryId: "demo-itin-3",
    createdAt: "2026-08-06T09:00:00.000Z",
  },
  {
    id: "demo-cost-2", label: "Evening safari", total: 7200,
    note: "4 gypsies, 6 seats each",
    appliesToAll: false, memberIds: ["demo-1", "demo-2", "demo-3", "demo-5"],
    itineraryId: "demo-itin-4",
    createdAt: "2026-08-06T09:01:00.000Z",
  },
  {
    id: "demo-cost-3", label: "Convoy leaves Nagpur", total: 3600,
    note: "Tempo Traveller both ways",
    appliesToAll: false, memberIds: ["demo-1", "demo-2", "demo-5"],
    itineraryId: "demo-itin-2",
    createdAt: "2026-08-06T09:02:00.000Z",
  },
  {
    // Divides as 6 × ₹308 + ... — deliberately not a round number, so the
    // remainder handling is visible the moment you open the page.
    id: "demo-cost-4", label: "Tips, water and snacks", total: 5200,
    note: "Guides, gate staff, a crate of water",
    appliesToAll: true, memberIds: [], itineraryId: "",
    createdAt: "2026-08-06T09:03:00.000Z",
  },
];

const dir = path.join(process.cwd(), ".data");
await fs.mkdir(dir, { recursive: true });
await fs.writeFile(
  path.join(dir, "db.json"),
  JSON.stringify({ participants, audit: [], itinerary, costs }, null, 2),
);

console.log(`Seeded ${participants.length} demo friends into .data/db.json`);
console.log(`…plus ${itinerary.length} programme entries and ${costs.length} costs.`);
console.log("Delete the .data folder to clear them.");
