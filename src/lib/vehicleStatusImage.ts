import type { VehicleKind, VehicleStatus } from "@/components/data/vehicles";

import carRunning from "@/assets/car_running.png";
import carStop from "@/assets/car_stop.png";
import carInactive from "@/assets/car_inactive.png";
import carOverspeed from "@/assets/car_overspeed.png";
import bikeIdle from "@/assets/bike_idle.png";
import bikeStop from "@/assets/bike_stop.png";
import bikeInactive from "@/assets/bike_inactive.png";
import bikeOverspeed from "@/assets/bike_overspeed.png";

const CAR_BY_STATUS: Record<VehicleStatus, string> = {
  running: carRunning,
  stopped: carStop,
  overspeed: carOverspeed,
  idle: carInactive,
  unreachable: carInactive,
  new: carInactive,
};

const BIKE_BY_STATUS: Record<VehicleStatus, string> = {
  running: bikeIdle,
  idle: bikeIdle,
  stopped: bikeStop,
  overspeed: bikeOverspeed,
  unreachable: bikeInactive,
  new: bikeInactive,
};

/** Image URL for vehicle type (bike vs four-wheeler) + gps/status. */
export function getVehicleStatusImage(kind: VehicleKind, status: VehicleStatus): string {
  return kind === "bike" ? BIKE_BY_STATUS[status] : CAR_BY_STATUS[status];
}
