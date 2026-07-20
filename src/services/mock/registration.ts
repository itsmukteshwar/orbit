import type { ListParams, Page } from "@/services/types";
import type { Pass, Registration } from "@/types/domain";
import type { RegistrationCreateInput, RegistrationFilters, RegistrationService } from "@/services/registration";
import { db, findOrThrow } from "@/services/mock/db";
import { paginate, runtimeId, simulate, textMatch } from "@/services/mock/util";

function applyFilters(items: Registration[], params?: ListParams<RegistrationFilters>): Registration[] {
  const f = params?.filters;
  return items.filter(
    (r) =>
      (!f?.eventId || r.eventId === f.eventId) &&
      (!f?.status || r.status === f.status) &&
      (!f?.categoryId || r.categoryId === f.categoryId) &&
      (!f?.source || r.source === f.source) &&
      (!f?.gender || r.gender === f.gender) &&
      textMatch(params?.q, `${r.firstName} ${r.lastName}`, r.phone, r.email, r.company, r.city, r.id),
  );
}

export const mockRegistrationService: RegistrationService = {
  async list(params): Promise<Page<Registration>> {
    await simulate("registration.list");
    const filtered = applyFilters(db.registrations, params);
    return paginate(filtered, params?.cursor, params?.limit ?? 50);
  },

  async get(id) {
    await simulate("registration.get");
    return findOrThrow(db.registrations, id, "Registration");
  },

  async create(input: RegistrationCreateInput) {
    await simulate("registration.create");
    const reg: Registration = {
      ...input,
      id: runtimeId("reg"),
      status: input.status ?? "pending",
      createdAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
    };
    db.registrations.unshift(reg);
    return reg;
  },

  async update(id, patch) {
    await simulate("registration.update");
    const reg = findOrThrow(db.registrations, id, "Registration");
    Object.assign(reg, patch);
    return reg;
  },

  async approve(id, reviewerId) {
    await simulate("registration.approve");
    const reg = findOrThrow(db.registrations, id, "Registration");
    if (reg.status !== "pending") throw new Error(`Cannot approve a ${reg.status} registration`);
    reg.status = "approved";
    reg.reviewedAt = new Date().toISOString();
    reg.reviewedBy = reviewerId;
    const pass: Pass = {
      id: runtimeId("pas"),
      registrationId: reg.id,
      eventId: reg.eventId,
      badgeNo: `MT26-${String(db.passes.length + 1).padStart(4, "0")}`,
      qrToken: runtimeId("qr"),
      status: "active",
      issuedAt: reg.reviewedAt,
    };
    db.passes.push(pass);
    return { registration: reg, pass };
  },

  async reject(id, reviewerId) {
    await simulate("registration.reject");
    const reg = findOrThrow(db.registrations, id, "Registration");
    if (reg.status !== "pending") throw new Error(`Cannot reject a ${reg.status} registration`);
    reg.status = "rejected";
    reg.reviewedAt = new Date().toISOString();
    reg.reviewedBy = reviewerId;
    return reg;
  },

  async revoke(id, reviewerId) {
    await simulate("registration.revoke");
    const reg = findOrThrow(db.registrations, id, "Registration");
    if (reg.status !== "approved") throw new Error(`Cannot revoke a ${reg.status} registration`);
    reg.status = "revoked";
    reg.reviewedAt = new Date().toISOString();
    reg.reviewedBy = reviewerId;
    const pass = db.passes.find((p) => p.registrationId === reg.id);
    if (pass) pass.status = "revoked";
    return reg;
  },

  async getPass(registrationId) {
    await simulate("registration.getPass");
    return db.passes.find((p) => p.registrationId === registrationId) ?? null;
  },
};
