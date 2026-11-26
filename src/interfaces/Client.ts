import type { Status } from "@/enums/Status";
import type { UserType } from "@/enums/UserType";

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
  /** Backend requires `USER` for client create/update. */
  userType: typeof UserType.USER;
}

export type UpdateClientRequest = Partial<CreateClientRequest> & {
  suspended?: boolean;
  reason?: string;
};

export interface Client extends Omit<CreateClientRequest, "password" | "confirmPassword" | "status"> {
  id: string | number;
  externalId: string;
  password?: string;
  status?: Status;
  reason?: string;
  vehicleCount?: number;
  suspended?: boolean;
  inactiveDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
