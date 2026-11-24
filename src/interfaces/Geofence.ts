/** Create/update body — matches API validation (single coords + numeric transitTime). */
export interface GeofenceRequest {
  name: string;
  type: string;
  assignType: string;
  geofenceCode?: string;
  transitTime: number;
  shapes: string;
  geoType: string;
  latitude: number;
  longitude: number;
  radius: number;
  status?: string;
  reason?: string;
}

export type CreateGeofenceRequest = GeofenceRequest;
export type UpdateGeofenceRequest = Partial<GeofenceRequest>;

/** Normalized list/detail model used by the UI. */
export interface Geofence {
  id: string | number;
  externalId: string;
  name: string;
  type: string;
  /** Display name from nested type.geofType */
  geofType?: string;
  assignType: string;
  geofenceCode: string;
  /** UI select key: `DAY_1` … `DAY_30` */
  transitTime: string;
  shapes: string;
  geoType: string;
  latitude: number[];
  longitude: number[];
  radius: number;
  status: string;
  reason: string;
}
