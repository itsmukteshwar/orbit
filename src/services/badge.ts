import type { ListParams, Page } from "@/services/types";
import type { BadgeDesign, BadgePrintJob, ReprintRecord } from "@/types/domain";
import { mockBadgeService } from "@/services/mock/badge";

export interface ReprintInput {
  registrationId: string;
  reason: string;
  actor: string;
  supervisor: string;
}

export interface BadgeService {
  listDesigns(eventId: string): Promise<BadgeDesign[]>;
  getDesign(id: string): Promise<BadgeDesign>;
  saveDesign(design: Omit<BadgeDesign, "id" | "updatedAt"> & { id?: string }): Promise<BadgeDesign>;
  listPrintJobs(params?: ListParams<{ eventId?: string; status?: BadgePrintJob["status"] }>): Promise<Page<BadgePrintJob>>;
  queuePrint(eventId: string, passId: string, designId: string, station: string): Promise<BadgePrintJob>;
  /** Batch mark-printed after the browser print flow completes (P-39). */
  markPrinted(jobIds: string[]): Promise<void>;
  /**
   * Reprint a badge (P-40): invalidates the old QR (new qrToken + badgeNo on
   * the pass), writes an audit ReprintRecord, and queues a "reprint" job.
   */
  reprint(input: ReprintInput): Promise<ReprintRecord>;
  listReprints(eventId: string): Promise<ReprintRecord[]>;
}

export const badgeService: BadgeService = mockBadgeService;
