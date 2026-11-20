export interface LicenseApiRecord {
  id?: string | number;
  externalId?: string;
  license?: string;
  name?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface License {
  id?: string | number;
  externalId: string;
  license: string;
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
