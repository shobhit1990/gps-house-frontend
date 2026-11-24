import type { Status } from "@/enums/Status";

export interface CreatePolicyRequest {
  /** HTML policy content from the editor. */
  body: string;
}

export type UpdatePolicyRequest = CreatePolicyRequest;

export interface Policy extends CreatePolicyRequest {
  id: string | number;
  externalId: string;
  status?: Status;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}
