import type { ListParams, Page } from "@/services/types";
import type { EventStatus, OrbitEvent, VisitorCategory } from "@/types/domain";
import { mockEventService } from "@/services/mock/event";

export interface EventFilters {
  orgId?: string;
  status?: EventStatus;
}

export interface EventService {
  list(params?: ListParams<EventFilters>): Promise<Page<OrbitEvent>>;
  get(id: string): Promise<OrbitEvent>;
  create(input: Omit<OrbitEvent, "id" | "createdAt">): Promise<OrbitEvent>;
  update(id: string, patch: Partial<OrbitEvent>): Promise<OrbitEvent>;
  /** Transitions: draft→published→live→completed→archived */
  transition(id: string, to: EventStatus): Promise<OrbitEvent>;
  categories(eventId: string): Promise<VisitorCategory[]>;
}

export const eventService: EventService = mockEventService;
