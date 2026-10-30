export interface CreateClientRequest {
  ownerName: string;
  username: string;
  password: string;
  company: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  language: string;
  domain?: string;
  maxVehicleCount?: number;
  timezone: string;
  /** Cropped client image as a data URL. */
  image?: string;
  active: boolean;
}

export type UpdateClientRequest = Partial<CreateClientRequest> & {
  suspended?: boolean;
};

export interface Client extends Omit<CreateClientRequest, "password"> {
  id: string | number;
  externalId: string;
  password?: string;
  vehicleCount?: number;
  suspended?: boolean;
  inactiveDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
