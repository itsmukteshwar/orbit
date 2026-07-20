import type { AdminService } from "@/services/admin";
import { db, findOrThrow } from "@/services/mock/db";
import { paginate, simulate } from "@/services/mock/util";

export const mockAdminService: AdminService = {
  async listTenants(params) {
    await simulate("admin.listTenants");
    const f = params?.filters;
    const items = db.orgs.filter(
      (o) => (!f?.plan || o.plan === f.plan) && (!f?.status || o.status === f.status),
    );
    return paginate(items, params?.cursor, params?.limit ?? 50);
  },
  async suspendTenant(orgId) {
    await simulate("admin.suspendTenant");
    const org = findOrThrow(db.orgs, orgId, "Org");
    org.status = "suspended";
    return org;
  },
  async reactivateTenant(orgId) {
    await simulate("admin.reactivateTenant");
    const org = findOrThrow(db.orgs, orgId, "Org");
    org.status = "active";
    return org;
  },
  async platformCounts() {
    await simulate("admin.platformCounts");
    return {
      orgs: db.orgs.length,
      events: db.events.length,
      registrations: db.registrations.length,
      passes: db.passes.length,
      checkins: db.checkins.length,
      redemptions: db.redemptions.length,
    };
  },
};
