export type TravelSummaryReportParams = {
  client: string;
  transporter: string;
  vehicle: string;
  /** DD/MM/YYYY HH:mm, e.g. 20/11/2026 00:00 */
  from: string;
  /** DD/MM/YYYY HH:mm, e.g. 20/11/2026 23:59 */
  to: string;
};

type NestedVehicle = string | {
  id?: string;
  vehicle?: string;
  vehicleNo?: string;
  vehicleNickname?: string;
  name?: string;
} | null | undefined;

/** Raw API record — field names vary across backends. */
export interface TravelSummaryApiRecord {
  id?: string | number;
  externalId?: string;
  vehicle?: NestedVehicle;
  vehicleNo?: string | null;
  vehicleName?: string | null;
  startAddress?: string | NestedVehicle | null;
  startLoc?: string | NestedVehicle | null;
  startLocation?: string | NestedVehicle | null;
  endAddress?: string | NestedVehicle | null;
  endLoc?: string | NestedVehicle | null;
  endLocation?: string | NestedVehicle | null;
  totalDistance?: number | string | null;
  distance?: number | string | null;
  running?: number | string | null;
  runningMinutes?: number | string | null;
  runningTime?: number | string | null;
  idle?: number | string | null;
  idleMinutes?: number | string | null;
  idleTime?: number | string | null;
  stop?: number | string | null;
  stopMinutes?: number | string | null;
  stopTime?: number | string | null;
  overSpeed?: number | string | null;
  overSpeedMinutes?: number | string | null;
  overspeed?: number | string | null;
  overSpeedCount?: number | string | null;
  overspeedcount?: number | string | null;
  overSpeedCnt?: number | string | null;
}

export interface TravelSummary {
  id: string;
  externalId: string;
  vehicle: string;
  startAddress: string;
  endAddress: string;
  totalDistance: number;
  runningMinutes: number;
  idleMinutes: number;
  stopMinutes: number;
  overSpeedMinutes: number;
  overSpeedCount: number;
}
