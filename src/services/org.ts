import type { ListParams, Page } from "@/services/types";
import type { Org, User } from "@/types/domain";
import { mockOrgService } from "@/services/mock/org";

export interface OrgService {
  list(params?: ListParams): Promise<Page<Org>>;
  get(id: string): Promise<Org>;
  update(id: string, patch: Partial<Org>): Promise<Org>;
  teamMembers(orgId: string): Promise<User[]>;
}

export const orgService: OrgService = mockOrgService;
