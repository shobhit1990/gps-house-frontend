/** Single GPS point from `/vehicleHistoryTracking/history`. */
export interface VehicleHistoryPoint {
  id?: string | number;
  latitude?: number | string;
  longitude?: number | string;
  lat?: number | string;
  lng?: number | string;
  lon?: number | string;
  speed?: number | string;
  direction?: number | string;
  ignitionStatus?: boolean | string;
  locationTime?: string;
  gpsTime?: string;
  deviceTime?: string;
  createdAt?: string;
  satellite?: number | string;
  gsmSignal?: string | number;
  voltage?: string | number;
  charging?: boolean | string;
  distance?: number | string;
  odometer?: number | string;
  address?: string | null;
  alarm?: string;
  status?: string;
  gpsStatus?: string;
  gpsStatusLabel?: string;
}

export interface VehicleHistoryVehicleInfo {
  vehicleId?: string;
  vehicleNumber?: string;
  deviceImei?: string;
}

export interface VehicleHistoryStats {
  totalPoints?: number;
  totalDistanceMeters?: number;
  maxSpeed?: number;
  avgSpeed?: number;
  durationMs?: number;
}

export interface VehicleHistoryTrackingResponse {
  vehicleId?: string;
  vehicleNumber?: string;
  vehicleNickname?: string | null;
  vehicle?: VehicleHistoryVehicleInfo;
  from?: string;
  to?: string;
  stats?: VehicleHistoryStats;
  history?: VehicleHistoryPoint[];
  records?: VehicleHistoryPoint[];
  points?: VehicleHistoryPoint[];
  data?: VehicleHistoryPoint[] | VehicleHistoryTrackingResponse;
}

export type VehicleHistoryRow = {
  id: string;
  time: string;
  address: string;
  speed: string;
  lat: string;
  lng: string;
  ignition: string;
  gsm: string;
  odometer: string;
  status: string;
};

export type VehicleHistoryQueryArgs = {
  vehicleId: string;
  /** ISO UTC, e.g. `2026-11-20T00:00:00.000Z` */
  from: string;
  /** ISO UTC, e.g. `2026-11-20T23:59:59.999Z` */
  to: string;
  /** Max points to return. Defaults to 5000. */
  limit?: number;
};

/** Query params for `GET /vehicleHistoryTracking/vehicles`. */
export type VehicleHistoryVehiclesParams = {
  clientId?: string;
  transporterId?: string;
  groupId?: string;
  /** Duration in hours, e.g. `24`. */
  since?: string;
  /** e.g. `Unlocked` / `Locked` */
  lockStatus?: string;
};

export type VehicleHistoryResult = {
  vehicle?: VehicleHistoryVehicleInfo;
  from?: string;
  to?: string;
  stats?: VehicleHistoryStats;
  points: VehicleHistoryPoint[];
  rows: VehicleHistoryRow[];
  /** Continuous path used for playback (no teleport jumps). */
  route: [number, number][];
  /** Separate polylines so map never draws diagonal jump lines. */
  routeSegments: [number, number][][];
};
