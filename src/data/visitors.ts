export type VisitorCategory = "Trade Visitor" | "Delegate" | "VIP" | "Student" | "Media";
export type VisitorStatus = "Checked-in" | "Registered" | "No-show" | "Cancelled";
export type RegistrationSource = "Online" | "QR Self-Scan" | "Reception Desk" | "WhatsApp" | "Exhibitor Invite";

export interface Visitor {
  id: string;
  badgeNo: string;
  name: string;
  phone: string;
  company: string;
  city: string;
  gender: "Male" | "Female";
  category: VisitorCategory;
  registeredOn: string;
  registeredVia: RegistrationSource;
  checkIn?: { day: string; time: string; gate: string };
  status: VisitorStatus;
}

/** Demo dataset for the visitors table (Bharat Tech Expo 2026). */
export const VISITORS: Visitor[] = [
  { id: "OV2600001", badgeNo: "BT26-0001", name: "Arjun Kumar", phone: "96368 22798", company: "Tata Elxsi", city: "Bengaluru", gender: "Male", category: "Trade Visitor", registeredOn: "28 Jun 2026", registeredVia: "Online", checkIn: { day: "Day 2", time: "09:14 AM", gate: "Gate 1" }, status: "Checked-in" },
  { id: "OV2600002", badgeNo: "BT26-0002", name: "Priya Nair", phone: "81546 34389", company: "Freshworks", city: "Chennai", gender: "Female", category: "VIP", registeredOn: "27 Jun 2026", registeredVia: "QR Self-Scan", checkIn: { day: "Day 2", time: "10:02 AM", gate: "Gate 2" }, status: "Checked-in" },
  { id: "OV2600003", badgeNo: "BT26-0003", name: "Rohit Sharma", phone: "75026 40754", company: "Self-employed", city: "New Delhi", gender: "Male", category: "Trade Visitor", registeredOn: "18 Jul 2026", registeredVia: "Reception Desk", checkIn: { day: "Day 2", time: "09:47 AM", gate: "Gate 1" }, status: "Checked-in" },
  { id: "OV2600004", badgeNo: "BT26-0004", name: "Sneha Desai", phone: "96240 90650", company: "IIT Delhi", city: "New Delhi", gender: "Female", category: "Student", registeredOn: "10 Jul 2026", registeredVia: "Online", checkIn: { day: "Day 1", time: "11:20 AM", gate: "Gate 3" }, status: "Checked-in" },
  { id: "OV2600005", badgeNo: "BT26-0005", name: "Nisha Deshmukh", phone: "76435 85625", company: "Persistent Systems", city: "Pune", gender: "Female", category: "Delegate", registeredOn: "02 Jul 2026", registeredVia: "WhatsApp", status: "Registered" },
  { id: "OV2600006", badgeNo: "BT26-0006", name: "Sapna Bansal", phone: "89890 38597", company: "Dainik Bhaskar", city: "Jaipur", gender: "Female", category: "Media", registeredOn: "12 Jul 2026", registeredVia: "Online", checkIn: { day: "Day 2", time: "08:55 AM", gate: "Gate 2" }, status: "Checked-in" },
  { id: "OV2600007", badgeNo: "BT26-0007", name: "Akash Gowda", phone: "92778 22124", company: "Bosch India", city: "Bengaluru", gender: "Male", category: "Trade Visitor", registeredOn: "11 Jun 2026", registeredVia: "Exhibitor Invite", status: "No-show" },
  { id: "OV2600008", badgeNo: "BT26-0008", name: "Savita Bose", phone: "74418 48974", company: "Wipro", city: "Kolkata", gender: "Female", category: "Delegate", registeredOn: "17 Jul 2026", registeredVia: "Reception Desk", checkIn: { day: "Day 2", time: "11:31 AM", gate: "Gate 1" }, status: "Checked-in" },
  { id: "OV2600009", badgeNo: "BT26-0009", name: "Seema Saini", phone: "98344 83630", company: "NIC (Govt. of India)", city: "New Delhi", gender: "Female", category: "VIP", registeredOn: "16 Jul 2026", registeredVia: "Online", status: "Registered" },
  { id: "OV2600010", badgeNo: "BT26-0010", name: "Sachin Roy", phone: "83293 05679", company: "Adani Group", city: "Ahmedabad", gender: "Male", category: "Trade Visitor", registeredOn: "17 Jun 2026", registeredVia: "Online", status: "Cancelled" },
  { id: "OV2600011", badgeNo: "BT26-0011", name: "Rohit Chandra", phone: "86542 68402", company: "Infosys", city: "Hyderabad", gender: "Male", category: "Delegate", registeredOn: "28 Jun 2026", registeredVia: "QR Self-Scan", checkIn: { day: "Day 1", time: "02:10 PM", gate: "Gate 3" }, status: "Checked-in" },
  { id: "OV2600012", badgeNo: "BT26-0012", name: "Vijay Gowda", phone: "73307 62615", company: "Mahindra & Mahindra", city: "Mumbai", gender: "Male", category: "Trade Visitor", registeredOn: "12 Jun 2026", registeredVia: "Reception Desk", checkIn: { day: "Day 2", time: "12:05 PM", gate: "Gate 1" }, status: "Checked-in" },
];
