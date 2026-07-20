import type { FormVersion } from "@/types/domain";
import { mockFormService } from "@/services/mock/form";

export interface FormService {
  listVersions(eventId: string): Promise<FormVersion[]>;
  get(id: string): Promise<FormVersion>;
  createDraft(eventId: string, fields: FormVersion["fields"]): Promise<FormVersion>;
  update(id: string, patch: Partial<FormVersion>): Promise<FormVersion>;
  publish(id: string): Promise<FormVersion>;
}

export const formService: FormService = mockFormService;
