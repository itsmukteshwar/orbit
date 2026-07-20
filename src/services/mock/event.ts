import type { EventService } from "@/services/event";
import type { EventStatus } from "@/types/domain";
import { db, findOrThrow } from "@/services/mock/db";
import { paginate, runtimeId, simulate, textMatch } from "@/services/mock/util";

const ORDER: EventStatus[] = ["draft", "published", "live", "completed", "archived"];

export const mockEventService: EventService = {
  async list(params) {
    await simulate("event.list");
    const f = params?.filters;
    const items = db.events.filter(
      (e) =>
        (!f?.orgId || e.orgId === f.orgId) &&
        (!f?.status || e.status === f.status) &&
        textMatch(params?.q, e.name, e.venue, e.city),
    );
    return paginate(items, params?.cursor, params?.limit ?? 50);
  },
  async get(id) {
    await simulate("event.get");
    return findOrThrow(db.events, id, "Event");
  },
  async create(input) {
    await simulate("event.create");
    const event = { ...input, id: runtimeId("evt"), createdAt: new Date().toISOString() };
    db.events.push(event);
    return event;
  },
  async update(id, patch) {
    await simulate("event.update");
    const event = findOrThrow(db.events, id, "Event");
    Object.assign(event, patch);
    return event;
  },
  async transition(id, to) {
    await simulate("event.transition");
    const event = findOrThrow(db.events, id, "Event");
    const from = ORDER.indexOf(event.status);
    const target = ORDER.indexOf(to);
    if (target !== from + 1 && to !== "archived") {
      throw new Error(`Invalid transition ${event.status} → ${to}`);
    }
    event.status = to;
    return event;
  },
  async categories(eventId) {
    await simulate("event.categories");
    return db.categories.filter((c) => c.eventId === eventId);
  },
};
