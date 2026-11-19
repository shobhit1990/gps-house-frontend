import type { Status } from "@/enums/Status";

export type VehicleSaveType = "vehicle" | "transporter" | "device" | "payment";

export interface CreateVehicleRequest {
  /** Which form tab is saving this payload. */
  type: VehicleSaveType;
  vehicle: string;
  mileage: number;
  vehicleType: string;
  overspeed: number;
  hours?: string;
  minutes?: string;
  /** Client externalId. */
  client: string;
  /** Device externalId — linked from the Device tab. */
  device?: string;
  /** Transporter externalId — linked from the Transporter / Payment tabs. */
  transporter?: string;
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

/** Payment-tab fields sent on `/vehicle/update/:id` when `type` is `"payment"`. */
export type VehiclePaymentFields = {
  sellingPrice?: number;
  paymentTerm?: string;
  installationDate?: string;
  rentalDueDate?: string;
  technicianName?: string;
  rental?: number;
};

export type UpdateVehicleRequest = Partial<CreateVehicleRequest> &
  VehiclePaymentFields & {
    type?: VehicleSaveType;
  };

export interface Vehicle extends CreateVehicleRequest {
  id: string | number;
  externalId: string;
  createdAt?: string;
  updatedAt?: string;
}

