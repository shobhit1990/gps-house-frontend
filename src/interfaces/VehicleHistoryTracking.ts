/** Single GPS point from `/vehicleHistoryTracking/getById/:vehicleId`. */
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
  address?: string;
  alarm?: string;
  status?: string;
  gpsStatus?: string;
  gpsStatusLabel?: string;
}

export interface VehicleHistoryTrackingResponse {
  vehicleId?: string;
  vehicleNumber?: string;
  vehicleNickname?: string | null;
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
