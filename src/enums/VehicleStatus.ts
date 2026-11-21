/** Account status for vehicles on create / update. */
export enum VehicleStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export const vehicleStatusLabels: Record<VehicleStatus, string> = {
  [VehicleStatus.ACTIVE]: "Active",
  [VehicleStatus.INACTIVE]: "Inactive",
};
