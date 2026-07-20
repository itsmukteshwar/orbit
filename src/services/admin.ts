import type { ListParams, Page } from "@/services/types";
import type { Org, OrgPlan, OrgStatus } from "@/types/domain";
import { mockAdminService } from "@/services/mock/admin";

/** Super-admin / platform operations. */
export interface AdminService {
  listTenants(params?: ListParams<{ plan?: OrgPlan; status?: OrgStatus }>): Promise<Page<Org>>;
  suspendTenant(orgId: string): Promise<Org>;
  reactivateTenant(orgId: string): Promise<Org>;
  platformCounts(): Promise<Record<string, number>>;
}

export const adminService: AdminService = mockAdminService;
