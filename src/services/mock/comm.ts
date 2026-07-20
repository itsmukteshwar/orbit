import type { CommService } from "@/services/comm";
import type { CommMessage } from "@/types/domain";
import { db, findOrThrow } from "@/services/mock/db";
import { paginate, runtimeId, simulate } from "@/services/mock/util";

export const mockCommService: CommService = {
  async templates(orgId) {
    await simulate("comm.templates");
    return db.commTemplates.filter((t) => t.orgId === orgId);
  },
  async saveTemplate(template) {
    await simulate("comm.saveTemplate");
    if (template.id) {
      const existing = findOrThrow(db.commTemplates, template.id, "CommTemplate");
      Object.assign(existing, template);
      return existing;
    }
    const created = { ...template, id: runtimeId("tpl") };
    db.commTemplates.push(created);
    return created;
  },
  async listMessages(params) {
    await simulate("comm.listMessages");
    const f = params?.filters;
    const items = db.commMessages.filter(
      (m) =>
        (!f?.eventId || m.eventId === f.eventId) &&
        (!f?.channel || m.channel === f.channel) &&
        (!f?.status || m.status === f.status),
    );
    return paginate(items, params?.cursor, params?.limit ?? 50);
  },
  async send(eventId, templateId, registrationIds) {
    await simulate("comm.send");
    const template = findOrThrow(db.commTemplates, templateId, "CommTemplate");
    const messages: CommMessage[] = registrationIds.map((registrationId) => ({
      id: runtimeId("msg"),
      eventId,
      templateId,
      registrationId,
      channel: template.channel,
      status: "queued",
      sentAt: null,
      error: null,
    }));
    db.commMessages.unshift(...messages);
    return messages;
  },
  async retry(messageId) {
    await simulate("comm.retry");
    const message = findOrThrow(db.commMessages, messageId, "CommMessage");
    if (message.status !== "failed") throw new Error("Only failed messages can be retried");
    message.status = "queued";
    message.error = null;
    return message;
  },
};
