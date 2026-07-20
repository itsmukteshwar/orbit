import type { ExhibitorService } from "@/services/exhibitor";
import { db, findOrThrow } from "@/services/mock/db";
import { paginate, runtimeId, simulate, textMatch } from "@/services/mock/util";
import type { VisitorCategory } from "@/types/domain";

/** Count of quota-consuming (approved) staff for an exhibitor. */
function approvedCount(exhibitorId: string): number {
  return db.exhibitorStaff.filter((s) => s.exhibitorId === exhibitorId && s.status === "approved").length;
}

/** Find or lazily create the runtime "Exhibitor Staff" category. */
function exhibitorStaffCategory(eventId: string): VisitorCategory {
  let cat = db.categories.find((c) => c.eventId === eventId && c.name === "Exhibitor Staff");
  if (!cat) {
    cat = {
      id: runtimeId("cat"),
      eventId,
      name: "Exhibitor Staff",
      color: "secondary",
      pricePaise: 0,
      maxPerDay: null,
    };
    db.categories.push(cat);
  }
  return cat;
}

export const mockExhibitorService: ExhibitorService = {
  async list(params) {
    await simulate("exhibitor.list");
    const f = params?.filters;
    const items = db.exhibitors.filter(
      (e) =>
        (!f?.eventId || e.eventId === f.eventId) &&
        (!f?.status || e.status === f.status) &&
        (!f?.hallId || e.hallId === f.hallId) &&
        textMatch(params?.q, e.companyName, e.contactName, e.stallNo),
    );
    return paginate(items, params?.cursor, params?.limit ?? 50);
  },
  async get(id) {
    await simulate("exhibitor.get");
    return findOrThrow(db.exhibitors, id, "Exhibitor");
  },
  async create(input) {
    await simulate("exhibitor.create");
    const exhibitor = { ...input, id: runtimeId("exh") };
    db.exhibitors.push(exhibitor);
    return exhibitor;
  },
  async update(id, patch) {
    await simulate("exhibitor.update");
    const exhibitor = findOrThrow(db.exhibitors, id, "Exhibitor");
    Object.assign(exhibitor, patch);
    return exhibitor;
  },
  async staff(exhibitorId) {
    await simulate("exhibitor.staff");
    return db.exhibitorStaff.filter((s) => s.exhibitorId === exhibitorId);
  },
  async addStaff(exhibitorId, input) {
    await simulate("exhibitor.addStaff");
    const exhibitor = findOrThrow(db.exhibitors, exhibitorId, "Exhibitor");
    if (approvedCount(exhibitorId) >= exhibitor.staffQuota) {
      throw new Error(`Staff quota (${exhibitor.staffQuota}) reached`);
    }
    const staff = { ...input, id: runtimeId("exs"), exhibitorId, passId: null };
    db.exhibitorStaff.push(staff);
    return staff;
  },
  async removeStaff(staffId) {
    await simulate("exhibitor.removeStaff");
    const idx = db.exhibitorStaff.findIndex((s) => s.id === staffId);
    if (idx === -1) throw new Error(`Staff not found: ${staffId}`);
    db.exhibitorStaff.splice(idx, 1);
  },

  /* ── Magic links ──────────────────────────────────────────────────────── */

  async generateMagicLink(exhibitorId) {
    await simulate("exhibitor.generateMagicLink");
    const exhibitor = findOrThrow(db.exhibitors, exhibitorId, "Exhibitor");
    exhibitor.magicToken = runtimeId("mgk");
    exhibitor.magicExpiresAt = new Date(Date.now() + 72 * 3600_000).toISOString();
    return exhibitor;
  },

  async revokeMagicLink(exhibitorId) {
    await simulate("exhibitor.revokeMagicLink");
    const exhibitor = findOrThrow(db.exhibitors, exhibitorId, "Exhibitor");
    exhibitor.magicToken = null;
    exhibitor.magicExpiresAt = null;
    return exhibitor;
  },

  async resolveMagicToken(token) {
    await simulate("exhibitor.resolveMagicToken");
    const exhibitor = db.exhibitors.find((e) => e.magicToken === token);
    if (!exhibitor) return { kind: "invalid" };
    if (exhibitor.magicExpiresAt && new Date(exhibitor.magicExpiresAt).getTime() < Date.now()) {
      return { kind: "expired", exhibitor };
    }
    return {
      kind: "ok",
      exhibitor,
      staff: db.exhibitorStaff.filter((s) => s.exhibitorId === exhibitor.id),
    };
  },

  async submitStaff(token, rows) {
    await simulate("exhibitor.submitStaff");
    const exhibitor = db.exhibitors.find((e) => e.magicToken === token);
    if (!exhibitor) throw new Error("Invalid or revoked link");
    if (exhibitor.magicExpiresAt && new Date(exhibitor.magicExpiresAt).getTime() < Date.now()) {
      throw new Error("This link has expired");
    }
    const now = new Date().toISOString();
    const created = rows.map((r) => ({
      id: runtimeId("exs"),
      exhibitorId: exhibitor.id,
      name: r.name,
      phone: r.phone,
      role: "support" as const,
      designation: r.designation,
      status: "pending" as const,
      submittedAt: now,
      passId: null,
      registrationId: null,
    }));
    db.exhibitorStaff.push(...created);
    return created;
  },

  /* ── Staff approvals ──────────────────────────────────────────────────── */

  async approveStaff(staffId, reviewerId) {
    await simulate("exhibitor.approveStaff");
    const staff = findOrThrow(db.exhibitorStaff, staffId, "Staff");
    if (staff.status !== "pending") throw new Error("Only pending submissions can be approved");
    const exhibitor = findOrThrow(db.exhibitors, staff.exhibitorId, "Exhibitor");
    if (approvedCount(exhibitor.id) >= exhibitor.staffQuota) {
      throw new Error(`Quota ${exhibitor.staffQuota}/${exhibitor.staffQuota} reached for ${exhibitor.companyName}`);
    }

    const cat = exhibitorStaffCategory(exhibitor.eventId);
    const now = new Date().toISOString();
    const [firstName, ...rest] = staff.name.split(" ");

    // Registration → visible in the Registrations list
    const reg = {
      id: runtimeId("reg"),
      eventId: exhibitor.eventId,
      formVersionId: db.formVersions.find((f) => f.eventId === exhibitor.eventId)?.id ?? "",
      categoryId: cat.id,
      status: "approved" as const,
      source: "exhibitor_invite" as const,
      firstName,
      lastName: rest.join(" ") || "—",
      phone: staff.phone,
      email: null,
      company: exhibitor.companyName,
      designation: staff.designation,
      city: "Indore",
      state: "Madhya Pradesh",
      gender: "other" as const,
      foodPreference: "veg" as const,
      daysAttending: [1, 2, 3],
      amountPaise: 0,
      createdAt: staff.submittedAt,
      reviewedAt: now,
      reviewedBy: reviewerId,
    };
    db.registrations.push(reg);

    // Pass → scannable at gates
    const pass = {
      id: runtimeId("pas"),
      registrationId: reg.id,
      eventId: exhibitor.eventId,
      badgeNo: `MT26-X${String(db.passes.length + 1).padStart(4, "0")}`,
      qrToken: runtimeId("qr"),
      status: "active" as const,
      issuedAt: now,
    };
    db.passes.push(pass);

    // Print job → appears in the Print queue
    db.badgePrintJobs.push({
      id: runtimeId("prt"),
      eventId: exhibitor.eventId,
      passId: pass.id,
      designId: db.badgeDesigns.find((d) => d.eventId === exhibitor.eventId)?.id ?? "",
      station: "staff-approval",
      status: "queued",
      createdAt: now,
    });

    staff.status = "approved";
    staff.passId = pass.id;
    staff.registrationId = reg.id;
    return staff;
  },

  async rejectStaff(staffId) {
    await simulate("exhibitor.rejectStaff");
    const staff = findOrThrow(db.exhibitorStaff, staffId, "Staff");
    if (staff.status !== "pending") throw new Error("Only pending submissions can be rejected");
    staff.status = "rejected";
    return staff;
  },
};
