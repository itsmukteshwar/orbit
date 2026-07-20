import { create } from "zustand";
import type { EventStatus } from "@/types/domain";

/**
 * Lightweight client store that tracks the currently-open event's status.
 * Set by EventContextBar after it loads the event; consumed by sub-pages
 * that need to gate features on event lifecycle (e.g., scanning locked in draft).
 */
interface EventStore {
  eventId: string | null;
  eventStatus: EventStatus | null;
  setEvent(id: string, status: EventStatus): void;
  clearEvent(): void;
}

export const useEventStore = create<EventStore>((set) => ({
  eventId: null,
  eventStatus: null,
  setEvent: (id, status) => set({ eventId: id, eventStatus: status }),
  clearEvent: () => set({ eventId: null, eventStatus: null }),
}));
