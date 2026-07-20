import type { FormService } from "@/services/form";
import { db, findOrThrow } from "@/services/mock/db";
import { runtimeId, simulate } from "@/services/mock/util";

export const mockFormService: FormService = {
  async listVersions(eventId) {
    await simulate("form.listVersions");
    return db.formVersions.filter((f) => f.eventId === eventId).sort((a, b) => b.version - a.version);
  },
  async get(id) {
    await simulate("form.get");
    return findOrThrow(db.formVersions, id, "FormVersion");
  },
  async createDraft(eventId, fields) {
    await simulate("form.createDraft");
    const maxVersion = Math.max(0, ...db.formVersions.filter((f) => f.eventId === eventId).map((f) => f.version));
    const draft = {
      id: runtimeId("frm"),
      eventId,
      version: maxVersion + 1,
      status: "draft" as const,
      fields,
      publishedAt: null,
    };
    db.formVersions.push(draft);
    return draft;
  },
  async update(id, patch) {
    await simulate("form.update");
    const form = findOrThrow(db.formVersions, id, "FormVersion");
    if (form.status === "published") throw new Error("Published form versions are immutable — create a new draft");
    Object.assign(form, patch);
    return form;
  },
  async publish(id) {
    await simulate("form.publish");
    const form = findOrThrow(db.formVersions, id, "FormVersion");
    for (const other of db.formVersions) {
      if (other.eventId === form.eventId && other.status === "published") other.status = "retired";
    }
    form.status = "published";
    form.publishedAt = new Date().toISOString();
    return form;
  },
};
