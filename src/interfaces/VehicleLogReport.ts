export type VehicleLogReportParams = {
  modifiedType: string;
  /** Month as MM/YYYY, e.g. 11/2026 */
  month: string;
};

export type VehicleLogRef = {
  id?: string;
  vehicle?: string;
  vehicleNo?: string;
  vehicleNickname?: string;
  name?: string;
};

/** Raw API record — vehicle may arrive nested or as a plain string. */
export interface VehicleLogApiRecord {
  id?: string | number;
  externalId?: string;
  vehicle?: string | VehicleLogRef | null;
  vehicleNo?: string | null;
  modifiedType?: string | null;
  modifiedDate?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  createdBy?: string | null;
  event?: string | null;
  oldData?: string | null;
  newData?: string | null;
  message?: string | null;
}

export interface VehicleLog {
  id: string;
  externalId: string;
  vehicle: string;
  modifiedType: string;
  modifiedDate: string;
  createdBy: string;
  event: string;
  oldData: string;
  newData: string;
  message: string;
}
