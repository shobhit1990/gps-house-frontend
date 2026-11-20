export type VehicleLiveTrackingParty = {
  id?: string;
  name?: string;
};

export type VehicleLiveTrackingGpsDevice = {
  id?: string;
  deviceImei?: string;
  simNumber?: string;
  latitude?: number | string;
  longitude?: number | string;
  speed?: number | string;
  direction?: number | string;
  ignitionStatus?: boolean | string;
  locationTime?: string;
  satellite?: number | string;
  gpsRealTime?: string;
  gpsPositioning?: string;
  gsmSignal?: string | number;
  charging?: boolean | string;
  voltage?: string | number;
  terminalInfo?: string;
  alarm?: string;
  alarmStatus?: string;
  distance?: number | string;
  odometer?: number | string;
  address?: string;
  addressUpdatedAt?: string;
};

/** Raw record from `/vehicleLiveTracking`. */
export interface VehicleLiveTrackingRecord {
  vehicleId?: string;
  vehicleNumber?: string;
  vehicleNickname?: string | null;
  vehicleType?: string;
  overspeed?: number | string;
  status?: string | null;
  gpsStatus?: string | null;
  gpsStatusLabel?: string | null;
  client?: VehicleLiveTrackingParty | null;
  transporter?: VehicleLiveTrackingParty | null;
  gpsDevice?: VehicleLiveTrackingGpsDevice | null;
}
