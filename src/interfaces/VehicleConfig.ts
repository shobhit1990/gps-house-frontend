import type { Status } from "@/enums/Status";

export interface CreateVehicleConfigRequest {
  /** Transporter externalId. */
  transporter: string;
  distanceVariation: number;
  lockButton: boolean;
  status: Status;
  reason?: string;
}

export type UpdateVehicleConfigRequest = Partial<CreateVehicleConfigRequest>;

export interface VehicleConfig extends CreateVehicleConfigRequest {
  id: string | number;
  externalId: string;
  createdAt?: string;
  updatedAt?: string;
}
