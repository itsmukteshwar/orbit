import type { Role, User } from "@/types/domain";
import { mockInviteService } from "@/services/mock/invite";

export interface InvitePayload {
  token: string;
  orgName: string;
  orgId: string;
  email: string;
  role: Role;
  invitedBy: string;
  /** True when no Orbit account exists yet for this email. */
  isNewUser: boolean;
}

export interface AcceptInput {
  /** Required for new-user path. */
  name?: string;
  password: string;
}

export interface InviteService {
  /** Validate a token. Throws "EXPIRED" | "REVOKED" | "INVALID" | "ACCEPTED". */
  validateInvite(token: string): Promise<InvitePayload>;
  /** Accept the invite; returns the acting User with the invited role set. */
  acceptInvite(token: string, data: AcceptInput): Promise<User>;
}

export const inviteService: InviteService = mockInviteService;
