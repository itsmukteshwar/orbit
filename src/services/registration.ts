import type { ListParams, Page } from "@/services/types";
import type { Pass, Registration, RegistrationStatus } from "@/types/domain";
import { mockRegistrationService } from "@/services/mock/registration";

export interface RegistrationFilters {
  eventId?: string;
  status?: RegistrationStatus;
  categoryId?: string;
  source?: Registration["source"];
  gender?: Registration["gender"];
}

export interface RegistrationCreateInput
  extends Omit<Registration, "id" | "createdAt" | "reviewedAt" | "reviewedBy" | "status"> {
  status?: RegistrationStatus;
}

export interface RegistrationService {
  list(params?: ListParams<RegistrationFilters>): Promise<Page<Registration>>;
  get(id: string): Promise<Registration>;
  create(input: RegistrationCreateInput): Promise<Registration>;
  update(id: string, patch: Partial<Registration>): Promise<Registration>;
  /** Transition actions — enforce the pending|approved|rejected|revoked flow. */
  approve(id: string, reviewerId: string): Promise<{ registration: Registration; pass: Pass }>;
  reject(id: string, reviewerId: string, reason?: string): Promise<Registration>;
  revoke(id: string, reviewerId: string, reason?: string): Promise<Registration>;
  /** Pass lookup for a registration (null when not yet approved). */
  getPass(registrationId: string): Promise<Pass | null>;
}

export const registrationService: RegistrationService = mockRegistrationService;
