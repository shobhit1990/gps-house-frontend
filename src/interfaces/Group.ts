import type { Status } from "@/enums/Status";

export interface CreateGroupRequest {
  groupName: string;
  /** What the group is assigned to, e.g. "vehicle" or "transporter". */
  assignedTo: string;
  /** Selected vehicle id when assignedTo is vehicle. */
  vehicle?: string;
  /** Selected transporter id when assignedTo is transporter. */
  transporter?: string;
  status: Status;
  reason?: string;
}

export type UpdateGroupRequest = Partial<CreateGroupRequest>;

export interface Group extends CreateGroupRequest {
  id: string | number;
  externalId: string;
  /** Normalized party ids from list/detail responses. */
  vehicles?: string[];
  transporters?: string[];
  createdAt?: string;
  updatedAt?: string;
}
