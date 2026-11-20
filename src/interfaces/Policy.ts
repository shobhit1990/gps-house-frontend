import type { Status } from "@/enums/Status";

export interface CreatePolicyRequest {
  /** HTML policy content from the editor. */
  body: string;
  status?: Status;
  reason?: string;
}

export type UpdatePolicyRequest = Partial<CreatePolicyRequest>;

export interface Policy extends CreatePolicyRequest {
  id: string | number;
  externalId: string;
  createdAt?: string;
  updatedAt?: string;
}
