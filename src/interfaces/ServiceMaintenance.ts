/** Sent as multipart form data so `serviceDocument` can carry the file. */
export interface CreateServiceMaintenanceRequest {
  serviceName: string;
  /** Vehicle externalId. */
  vehicle: string;
  remark?: string;
  odometerIntervalEnabled: boolean;
  odometerInterval?: number;
  lastServiceOdometer?: number;
  engineIntervalEnabled: boolean;
  engineInterval?: number;
  lastServiceEngine?: number;
  daysIntervalEnabled: boolean;
  daysInterval?: number;
  /** yyyy-MM-dd */
  lastServiceDate?: string;
  odometerLeftEnabled: boolean;
  odometerLeft?: number;
  engineLeftEnabled: boolean;
  engineLeft?: number;
  daysLeftEnabled: boolean;
  daysLeft?: number;
  updateRecord: boolean;
  mobile: boolean;
  serviceDocument?: File;
  allowVisibilityToDriver: boolean;
}

export type UpdateServiceMaintenanceRequest = Partial<CreateServiceMaintenanceRequest>;

export type ServiceMaintenanceVehicle =
  | string
  | {
      id?: string | number;
      vehicle?: string;
      vehicleNo?: string;
      name?: string;
    };

export interface ServiceMaintenance extends Omit<CreateServiceMaintenanceRequest, "serviceDocument" | "vehicle"> {
  id: string | number;
  externalId: string;
  vehicle: ServiceMaintenanceVehicle;
  /** Stored document path. */
  serviceDocument?: string;
  /** Client / transporter externalIds, when the backend returns them for filtering. */
  client?: string;
  transporter?: string;
  currentOdometer?: number;
  nextServiceDueOdometer?: number;
  nextServiceDueEngineHour?: number;
  nextServiceDueOn?: string;
  createdAt?: string;
  updatedAt?: string;
}
