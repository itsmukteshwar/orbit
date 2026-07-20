import type { OrgService } from "@/services/org";
import { db, findOrThrow } from "@/services/mock/db";
import { paginate, simulate, textMatch } from "@/services/mock/util";

export const mockOrgService: OrgService = {
  async list(params) {
    await simulate("org.list");
    const items = db.orgs.filter((o) => textMatch(params?.q, o.name, o.city));
    return paginate(items, params?.cursor, params?.limit ?? 50);
  },
  async get(id) {
    await simulate("org.get");
    return findOrThrow(db.orgs, id, "Org");
  },
  async update(id, patch) {
    await simulate("org.update");
    const org = findOrThrow(db.orgs, id, "Org");
    Object.assign(org, patch);
    return org;
  },
  async teamMembers(orgId) {
    await simulate("org.teamMembers");
    return db.users.filter((u) => u.orgId === orgId);
  },
};
