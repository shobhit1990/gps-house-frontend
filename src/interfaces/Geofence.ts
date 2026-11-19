export interface GeofenceRequest {
  name: string;
  type: string;
  assignType: string;
  geofenceCode?: string;
  transitTime: string;
  shapes: string;
  geoType: string;
  latitude: number[];
  longitude: number[];
  radius: number;
  status?: string;
  reason?: string;
}

export type CreateGeofenceRequest = GeofenceRequest;
export type UpdateGeofenceRequest = Partial<GeofenceRequest>;

export interface Geofence extends GeofenceRequest {
  id: string | number;
  externalId: string;
  /** Display name from nested type.geofType */
  geofType?: string;
  status: string;
  reason: string;
  geofenceCode: string;
}
