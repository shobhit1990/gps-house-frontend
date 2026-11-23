import { Status } from "@/enums/Status";

export interface LicenseApiRecord {
  id?: string | number;
  externalId?: string;
  license?: string;
  name?: string;
  status?: string;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface License {
  id?: string | number;
  externalId: string;
  license: string;
  status: Status;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateLicenseRequest {
  license: string;
}

export interface UpdateLicenseRequest {
  externalId: string;
  license: string;
}

export interface UpdateLicenseStatusRequest {
  externalId: string;
  status: Status;
  reason?: string;
}
