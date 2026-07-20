import type { ListParams, Page } from "@/services/types";
import type { CommMessage, CommMessageStatus, CommTemplate } from "@/types/domain";
import { mockCommService } from "@/services/mock/comm";

export interface CommMessageFilters {
  eventId?: string;
  channel?: CommMessage["channel"];
  status?: CommMessageStatus;
}

export interface CommService {
  templates(orgId: string): Promise<CommTemplate[]>;
  saveTemplate(template: Omit<CommTemplate, "id"> & { id?: string }): Promise<CommTemplate>;
  listMessages(params?: ListParams<CommMessageFilters>): Promise<Page<CommMessage>>;
  /** Queues a template send to a set of registrations. */
  send(eventId: string, templateId: string, registrationIds: string[]): Promise<CommMessage[]>;
  retry(messageId: string): Promise<CommMessage>;
}

export const commService: CommService = mockCommService;
