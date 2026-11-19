import { Status } from "@/enums/Status";

export interface GeoTypeApiRecord {
  id?: string | number;
  externalId?: string;
  geofType?: string;
  name?: string;
  status?: string;
  reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface GeoType {
  id?: string | number;
  externalId: string;
  geofType: string;
  status: Status;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGeoTypeRequest {
  geofType: string;
}

export interface UpdateGeoTypeRequest {
  externalId: string;
  geofType: string;
}

export interface UpdateGeoTypeStatusRequest {
  externalId: string;
  status: Status;
  reason?: string;
}

export interface DeleteGeoTypeResponse {
  success: boolean;
  id: string | number;
}
