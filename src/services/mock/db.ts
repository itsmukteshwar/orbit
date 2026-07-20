/**
 * In-memory mutable database, cloned once from fixtures at module load.
 * UI mutations persist for the session; a reload restores the seeded state.
 */

import * as F from "@/mocks/fixtures";
import type {
  Org, OrbitEvent, User, VisitorCategory, FormVersion, Registration, Pass,
  Exhibitor, ExhibitorStaff, BadgeDesign, BadgePrintJob, Gate, Device, Checkin,
  EventSession, MealSession, Redemption, Counter, CommTemplate, CommMessage,
  ReprintRecord,
} from "@/types/domain";

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

export const db = {
  orgs: [clone(F.ORG)] as Org[],
  users: clone(F.USERS) as User[],
  events: clone(F.EVENTS) as OrbitEvent[],
  categories: clone(F.CATEGORIES) as VisitorCategory[],
  formVersions: clone(F.FORM_VERSIONS) as FormVersion[],
  registrations: clone(F.REGISTRATIONS) as Registration[],
  passes: clone(F.PASSES) as Pass[],
  exhibitors: clone(F.EXHIBITORS) as Exhibitor[],
  exhibitorStaff: clone(F.EXHIBITOR_STAFF) as ExhibitorStaff[],
  badgeDesigns: clone(F.BADGE_DESIGNS) as BadgeDesign[],
  badgePrintJobs: clone(F.BADGE_PRINT_JOBS) as BadgePrintJob[],
  gates: clone(F.GATES) as Gate[],
  devices: clone(F.DEVICES) as Device[],
  checkins: clone(F.CHECKINS) as Checkin[],
  sessions: clone(F.EVENT_SESSIONS) as EventSession[],
  mealSessions: clone(F.MEAL_SESSIONS) as MealSession[],
  redemptions: clone(F.REDEMPTIONS) as Redemption[],
  counters: clone(F.COUNTERS) as Counter[],
  commTemplates: clone(F.COMM_TEMPLATES) as CommTemplate[],
  commMessages: clone(F.COMM_MESSAGES) as CommMessage[],
  reprints: clone(F.REPRINTS) as ReprintRecord[],
};

export function findOrThrow<T extends { id: string }>(arr: T[], id: string, kind: string): T {
  const found = arr.find((x) => x.id === id);
  if (!found) throw new Error(`${kind} not found: ${id}`);
  return found;
}
