import { Status } from "@/enums/Status";

export interface OwnerApiRecord {
  id: string | number;
  externalId?: string;
  ownerName?: string;
  status?: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Owner {
  id: string | number;
  externalId: string;
  ownerName: string;
  status: Status;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateOwnerRequest {
  ownerName: string;
}

export interface UpdateOwnerRequest {
  externalId: string;
  ownerName: string;
}

export interface UpdateOwnerStatusRequest {
  externalId: string;
  status: Status;
  reason?: string;
}

export interface DeleteOwnerResponse {
  success: boolean;
  id: string | number;
}
