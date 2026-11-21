export type StoppageSummaryReportParams = {
  client: string;
  vehicle: string;
  /** Minutes, e.g. 15 */
  duration: number;
  /** DD/MM/YYYY HH:mm, e.g. 19/11/2026 00:00 */
  startDate: string;
  /** DD/MM/YYYY HH:mm, e.g. 19/11/2026 23:59 */
  endDate: string;
};

type NestedVehicle =
  | string
  | {
      id?: string;
      vehicle?: string;
      vehicleNo?: string;
      vehicleNickname?: string;
      name?: string;
    }
  | null
  | undefined;

/** Raw API record — field names vary across backends. */
export interface StoppageSummaryApiRecord {
  id?: string | number;
  externalId?: string;
  vehicle?: NestedVehicle;
  vehicleNo?: string | null;
  vehicleName?: string | null;
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
  stops?: number | string | null;
  noOfStops?: number | string | null;
  stopCount?: number | string | null;
  avgSpeed?: number | string | null;
  averageSpeed?: number | string | null;
  maxSpeed?: number | string | null;
  maximumSpeed?: number | string | null;
}

export interface StoppageSummary {
  id: string;
  externalId: string;
  vehicle: string;
  totalDistance: number;
  runningMinutes: number;
  idleMinutes: number;
  stopMinutes: number;
  stops: number;
  avgSpeed: number;
  maxSpeed: number;
}
