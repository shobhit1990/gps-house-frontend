import type { Status } from "@/enums/Status";

export interface CreateVehicleRequest {
  vehicle: string;
  mileage: number;
  vehicleType: string;
  overspeed: number;
  hours?: string;
  minutes?: string;
  /** Client externalId. */
  client: string;
  device: string;
  /** Transporter externalId. */
  transporter: string;
  subscriptionStartDate: string;
  subscriptionDueDate: string;
  fuelType?: string;
  currentOdometerReading?: number;
  vehicleNickname?: string;
  remark?: string;
  durationOdometer?: number;
  remark2?: string;
  parkingViolationAlarmOnIgnitionOn: boolean;
  ownerName?: string;
  ownedBy?: string;
  vehicleBrand?: string;
  vehicleModel?: string;
  vehicleBody?: string;
  capacity?: number;
  manufactureDate?: string;
  purchaseDate?: string;
  status: Status;
  reason?: string;
}

export type UpdateVehicleRequest = Partial<CreateVehicleRequest>;

export interface Vehicle extends CreateVehicleRequest {
  id: string | number;
  externalId: string;
  createdAt?: string;
  updatedAt?: string;
}
