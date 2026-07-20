import type { ListParams, Page } from "@/services/types";
import type { Exhibitor, ExhibitorStaff, ExhibitorStatus } from "@/types/domain";
import { mockExhibitorService } from "@/services/mock/exhibitor";

export interface ExhibitorFilters {
  eventId?: string;
  status?: ExhibitorStatus;
  hallId?: string;
}

/** One staff row submitted through the public magic-link form (/x/[token]). */
export interface StaffSubmissionInput {
  name: string;
  phone: string;
  designation: string | null;
}

/** Result of resolving a magic-link token on the public form. */
export type MagicTokenResult =
  | { kind: "ok"; exhibitor: Exhibitor; staff: ExhibitorStaff[] }
  | { kind: "expired"; exhibitor: Exhibitor }
  | { kind: "invalid" };

export interface ExhibitorService {
  list(params?: ListParams<ExhibitorFilters>): Promise<Page<Exhibitor>>;
  get(id: string): Promise<Exhibitor>;
  create(input: Omit<Exhibitor, "id">): Promise<Exhibitor>;
  update(id: string, patch: Partial<Exhibitor>): Promise<Exhibitor>;
  staff(exhibitorId: string): Promise<ExhibitorStaff[]>;
  addStaff(exhibitorId: string, input: Omit<ExhibitorStaff, "id" | "exhibitorId" | "passId">): Promise<ExhibitorStaff>;
  removeStaff(staffId: string): Promise<void>;

  /* ── Magic links (P-34/P-36) ── */
  /** (Re)generate the magic-link token; expiry = now + 72h. */
  generateMagicLink(exhibitorId: string): Promise<Exhibitor>;
  revokeMagicLink(exhibitorId: string): Promise<Exhibitor>;
  resolveMagicToken(token: string): Promise<MagicTokenResult>;
  /** Public submission: rows land as status "pending" for P-35 review. */
  submitStaff(token: string, rows: StaffSubmissionInput[]): Promise<ExhibitorStaff[]>;

  /* ── Staff approvals (P-35) ── */
  /**
   * Approve a pending staff row. Enforces the exhibitor quota, then creates a
   * mock registration in the "Exhibitor Staff" category (+ pass + print job)
   * so it appears in the Registrations list and Print queue.
   */
  approveStaff(staffId: string, reviewerId: string): Promise<ExhibitorStaff>;
  rejectStaff(staffId: string, reviewerId: string): Promise<ExhibitorStaff>;
}

export const exhibitorService: ExhibitorService = mockExhibitorService;
