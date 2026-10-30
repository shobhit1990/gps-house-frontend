import type { Status } from "@/enums/Status";

export interface CreateGroupRequest {
  groupName: string;
  /** What the group is assigned to, e.g. "vehicle". */
  assignedTo: string;
  status: Status;
  reason?: string;
}

export type UpdateGroupRequest = Partial<CreateGroupRequest>;

export interface Group extends CreateGroupRequest {
  id: string | number;
  externalId: string;
  createdAt?: string;
  updatedAt?: string;
}
