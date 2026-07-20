import type { BadgeService } from "@/services/badge";
import { db, findOrThrow } from "@/services/mock/db";
import { paginate, runtimeId, simulate } from "@/services/mock/util";

export const mockBadgeService: BadgeService = {
  async listDesigns(eventId) {
    await simulate("badge.listDesigns");
    return db.badgeDesigns.filter((d) => d.eventId === eventId);
  },
  async getDesign(id) {
    await simulate("badge.getDesign");
    return findOrThrow(db.badgeDesigns, id, "BadgeDesign");
  },
  async saveDesign(design) {
    await simulate("badge.saveDesign");
    if (design.id) {
      const existing = findOrThrow(db.badgeDesigns, design.id, "BadgeDesign");
      Object.assign(existing, design, { updatedAt: new Date().toISOString() });
      return existing;
    }
    const created = { ...design, id: runtimeId("bdg"), updatedAt: new Date().toISOString() };
    db.badgeDesigns.push(created);
    return created;
  },
  async listPrintJobs(params) {
    await simulate("badge.listPrintJobs");
    const f = params?.filters;
    const items = db.badgePrintJobs.filter(
      (j) => (!f?.eventId || j.eventId === f.eventId) && (!f?.status || j.status === f.status),
    );
    return paginate(items, params?.cursor, params?.limit ?? 50);
  },
  async queuePrint(eventId, passId, designId, station) {
    await simulate("badge.queuePrint");
    const job = {
      id: runtimeId("prt"),
      eventId,
      passId,
      designId,
      station,
      status: "queued" as const,
      createdAt: new Date().toISOString(),
    };
    db.badgePrintJobs.push(job);
    return job;
  },

  async markPrinted(jobIds) {
    await simulate("badge.markPrinted");
    for (const id of jobIds) {
      const job = db.badgePrintJobs.find((j) => j.id === id);
      if (job) job.status = "done";
    }
  },

  async reprint({ registrationId, reason, actor, supervisor }) {
    await simulate("badge.reprint");
    const reg = findOrThrow(db.registrations, registrationId, "Registration");
    const pass = db.passes.find((p) => p.registrationId === registrationId);
    if (!pass) throw new Error("No pass issued for this registration");

    const oldBadgeNo = pass.badgeNo;
    // Invalidate old QR: rotate token + issue a new badge number.
    pass.qrToken = runtimeId("qr");
    pass.badgeNo = `MT26-R${String(db.reprints.length + 1).padStart(3, "0")}`;

    const record = {
      id: runtimeId("rpr"),
      eventId: reg.eventId,
      registrationId,
      visitorName: `${reg.firstName} ${reg.lastName}`,
      reason,
      actor,
      supervisor,
      oldBadgeNo,
      newBadgeNo: pass.badgeNo,
      at: new Date().toISOString(),
    };
    db.reprints.push(record);

    // Queue in the print flow, tagged as a reprint (P-39 Reprints tab).
    db.badgePrintJobs.push({
      id: runtimeId("prt"),
      eventId: reg.eventId,
      passId: pass.id,
      designId: db.badgeDesigns.find((d) => d.eventId === reg.eventId)?.id ?? "",
      station: "reprint",
      status: "queued",
      createdAt: record.at,
    });

    return record;
  },

  async listReprints(eventId) {
    await simulate("badge.listReprints");
    return [...db.reprints.filter((r) => r.eventId === eventId)].sort((a, b) => b.at.localeCompare(a.at));
  },
};
