import type { Status } from "@/enums/Status";

export interface CreateClientRequest {
  owner_name: string;
  userName: string;
  password: string;
  confirmPassword: string;
  companyName: string;
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
  status: Status;
}

export type UpdateClientRequest = Partial<CreateClientRequest> & {
  suspended?: boolean;
};

export interface Client extends Omit<CreateClientRequest, "password" | "confirmPassword" | "status"> {
  id: string | number;
  externalId: string;
  password?: string;
  status?: Status;
  vehicleCount?: number;
  suspended?: boolean;
  inactiveDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
