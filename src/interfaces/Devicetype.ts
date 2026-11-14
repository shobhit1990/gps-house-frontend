import { Status } from "@/enums/Status";

export interface DeviceTypeApiRecord {
  id?: string | number;
  externalId?: string;
  deviceName?: string;
  deviceTypeName?: string;
  status?: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeviceType {
  id?: string | number;
  externalId: string;
  deviceName: string;
  /** Legacy name still returned by some API deployments. */
  deviceTypeName: string;
  status: Status;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDeviceTypeRequest {
  deviceName: string;
}

export interface UpdateDeviceTypeRequest {
  externalId: string;
  deviceName: string;
}

export interface UpdateDeviceTypeStatusRequest {
  externalId: string;
  status: Status;
  reason?: string;
}

export interface DeleteDeviceTypeResponse {
  success: boolean;
  id: string | number;
}
