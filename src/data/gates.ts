export interface GateRow {
  name: string;
  location: string;
  devices: string;
  scansPerHour: number;
  queueLoad: number;
  sync: "Synced" | "Offline";
  syncNote?: string;
}

/** Gate & counter status for the Organizer command center. */
export const GATES: GateRow[] = [
  { name: "Gate 1 — Main Entry", location: "Hall A concourse", devices: "4 scanners", scansPerHour: 1240, queueLoad: 35, sync: "Synced" },
  { name: "Gate 2 — VIP & Delegates", location: "North lobby", devices: "2 scanners", scansPerHour: 310, queueLoad: 12, sync: "Synced" },
  { name: "Gate 3 — Hall B", location: "East wing", devices: "3 scanners", scansPerHour: 986, queueLoad: 72, sync: "Offline", syncNote: "42 queued" },
  { name: "Food Court — Counter 1–4", location: "Central plaza", devices: "4 scanners", scansPerHour: 1870, queueLoad: 88, sync: "Synced" },
];
