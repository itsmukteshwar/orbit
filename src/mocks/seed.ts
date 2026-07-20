/**
 * Seeded pseudo-random generator so mock data is IDENTICAL between reloads.
 * mulberry32 — small, fast, deterministic.
 */

export function createRng(seed: number) {
  let a = seed >>> 0;
  return function next(): number {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Rng = ReturnType<typeof createRng>;

export const pick = <T>(rng: Rng, arr: readonly T[]): T => arr[Math.floor(rng() * arr.length)];

export const int = (rng: Rng, min: number, max: number): number =>
  min + Math.floor(rng() * (max - min + 1));

/** Weighted pick: entries [value, weight] */
export function weighted<T>(rng: Rng, entries: readonly (readonly [T, number])[]): T {
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = rng() * total;
  for (const [value, w] of entries) {
    roll -= w;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}

/** ULID-style id: prefix + 16 crockford-base32 chars, deterministic. */
const B32 = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
export function makeId(rng: Rng, prefix: string): string {
  let s = "";
  for (let i = 0; i < 16; i++) s += B32[Math.floor(rng() * 32)];
  return `${prefix}_01J${s}`;
}

/** 10-digit Indian mobile starting 6-9. */
export const phone = (rng: Rng): string =>
  `${int(rng, 6, 9)}${Array.from({ length: 9 }, () => int(rng, 0, 9)).join("")}`;

/* ── Indian name / company / city pools ───────────────────────────────── */

export const FIRST_NAMES_M = [
  "Arjun", "Rohit", "Akash", "Vijay", "Sachin", "Rahul", "Karthik", "Aditya", "Nikhil", "Manish",
  "Suresh", "Deepak", "Pranav", "Harsh", "Ankit", "Gaurav", "Ramesh", "Siddharth", "Varun", "Amit",
] as const;

export const FIRST_NAMES_F = [
  "Priya", "Sneha", "Nisha", "Sapna", "Savita", "Seema", "Divya", "Kavita", "Pooja", "Anjali",
  "Meera", "Ritika", "Shreya", "Neha", "Aarti", "Swati", "Lakshmi", "Isha", "Tanvi", "Bhavna",
] as const;

export const LAST_NAMES = [
  "Kumar", "Sharma", "Nair", "Desai", "Deshmukh", "Bansal", "Gowda", "Bose", "Saini", "Roy",
  "Chandra", "Patel", "Verma", "Iyer", "Reddy", "Joshi", "Mehta", "Agarwal", "Singh", "Chauhan",
  "Malhotra", "Kulkarni", "Trivedi", "Mishra", "Pillai", "Choudhary", "Rathore", "Sethi", "Dubey", "Kapoor",
] as const;

export const COMPANIES = [
  "Tata Elxsi", "Freshworks", "Infosys", "Wipro", "Persistent Systems", "Bosch India", "Adani Group",
  "Mahindra & Mahindra", "Zoho Corporation", "Chargebee", "TCS", "L&T Technology", "Bajaj Auto",
  "Godrej Industries", "Dabur India", "Asian Paints", "Pidilite", "Havells", "Voltas", "Blue Star",
  "Raymond", "ITC Limited", "Marico", "Cipla", "Sun Pharma", "Hero MotoCorp", "Maruti Suzuki",
  "JSW Steel", "UltraTech Cement", "Self-employed",
] as const;

export const CITIES: readonly (readonly [string, string])[] = [
  ["Indore", "Madhya Pradesh"], ["Bhopal", "Madhya Pradesh"], ["Ujjain", "Madhya Pradesh"],
  ["New Delhi", "Delhi"], ["Mumbai", "Maharashtra"], ["Pune", "Maharashtra"], ["Nagpur", "Maharashtra"],
  ["Bengaluru", "Karnataka"], ["Chennai", "Tamil Nadu"], ["Hyderabad", "Telangana"],
  ["Ahmedabad", "Gujarat"], ["Surat", "Gujarat"], ["Jaipur", "Rajasthan"], ["Kolkata", "West Bengal"],
  ["Lucknow", "Uttar Pradesh"], ["Chandigarh", "Punjab"], ["Kochi", "Kerala"], ["Coimbatore", "Tamil Nadu"],
  ["Raipur", "Chhattisgarh"], ["Gwalior", "Madhya Pradesh"],
] as const;

export const DESIGNATIONS = [
  "Manager", "Director", "Proprietor", "Sales Head", "Purchase Manager", "Founder", "CEO",
  "VP Operations", "Business Development", "Consultant", "Engineer", "Student", "Journalist",
] as const;
