import { api } from "../api";
import type { VehicleRow } from "@/components/data/vehicles";
import type { VehicleLiveTrackingRecord } from "@/interfaces/VehicleLiveTracking";
import type {
  VehicleHistoryPoint,
  VehicleHistoryQueryArgs,
  VehicleHistoryResult,
  VehicleHistoryRow,
  VehicleHistoryTrackingResponse,
  VehicleHistoryVehiclesParams,
} from "@/interfaces/VehicleHistoryTracking";
import { toVehicleRow } from "./VehicleLiveTracking";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

const DEFAULT_HISTORY_LIMIT = 5000;
/** Break path when implied speed is unrealistic for road travel. */
const MAX_IMPLIED_SPEED_KMH = 90;
/** Always break when consecutive points are this far apart. */
const HARD_GAP_METERS = 250;
/** Break when a long idle/gap moves more than this. */
const TIME_GAP_SEC = 120;
const TIME_GAP_MOVE_METERS = 120;

const asText = (value: unknown) => {
  if (value == null) return "";
  return String(value).trim();
};

const asNumber = (value: unknown) => {
  if (value == null || value === "") return undefined;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const formatTime = (value?: string) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  const ss = String(date.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
};

const ignitionLabel = (value: unknown) => {
  if (typeof value === "boolean") return value ? "On" : "Off";
  const text = asText(value).toLowerCase();
  if (!text) return "";
  if (["true", "1", "yes", "on", "y"].includes(text)) return "On";
  if (["false", "0", "no", "off", "n"].includes(text)) return "Off";
  return asText(value);
};

const pointLat = (point: VehicleHistoryPoint) => asNumber(point.lat ?? point.latitude);
const pointLng = (point: VehicleHistoryPoint) => asNumber(point.lng ?? point.longitude ?? point.lon);

const pointTimeMs = (point: VehicleHistoryPoint) => {
  const raw = point.locationTime || point.gpsTime || point.deviceTime || point.createdAt;
  if (!raw) return null;
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date.getTime();
};

const haversineMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
};

const extractPayload = (
  response: ApiEnvelope<VehicleHistoryPoint[] | VehicleHistoryTrackingResponse>,
): VehicleHistoryTrackingResponse | VehicleHistoryPoint[] | undefined => {
  const payload = unwrapResponse(response);
  if (!payload) return undefined;
  if (Array.isArray(payload)) return payload;
  if (typeof payload === "object" && payload.data && !Array.isArray(payload.data) && typeof payload.data === "object") {
    const nested = payload.data as VehicleHistoryTrackingResponse;
    if (nested.points || nested.history || nested.records || nested.vehicle || nested.stats) {
      return nested;
    }
  }
  return payload;
};

const extractPoints = (
  payload: VehicleHistoryTrackingResponse | VehicleHistoryPoint[] | undefined,
): VehicleHistoryPoint[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.points)) return payload.points;
  if (Array.isArray(payload.history)) return payload.history;
  if (Array.isArray(payload.records)) return payload.records;
  if (Array.isArray(payload.data)) return payload.data;
  return [];
};

type TimedPoint = {
  point: VehicleHistoryPoint;
  lat: number;
  lng: number;
  time: number;
};

const isTeleport = (prev: TimedPoint, curr: TimedPoint) => {
  const dist = haversineMeters(prev.lat, prev.lng, curr.lat, curr.lng);
  const dtSec = Math.max((curr.time - prev.time) / 1000, 1);
  const speedKmh = (dist / 1000) / (dtSec / 3600);
  if (dist >= HARD_GAP_METERS) return true;
  if (dtSec >= TIME_GAP_SEC && dist >= TIME_GAP_MOVE_METERS) return true;
  if (speedKmh > MAX_IMPLIED_SPEED_KMH) return true;
  return false;
};

const toTimedPoints = (points: VehicleHistoryPoint[]): TimedPoint[] =>
  points
    .map((point) => {
      const lat = pointLat(point);
      const lng = pointLng(point);
      const time = pointTimeMs(point);
      if (lat == null || lng == null || time == null) return null;
      return { point, lat, lng, time };
    })
    .filter((item): item is TimedPoint => item != null)
    .sort((a, b) => a.time - b.time);

/** Split raw points into continuous GPS segments (no diagonal jump links). */
export const splitHistorySegments = (points: VehicleHistoryPoint[]): VehicleHistoryPoint[][] => {
  const usable = toTimedPoints(points);
  if (usable.length === 0) return [];

  const segments: TimedPoint[][] = [];
  let current: TimedPoint[] = [usable[0]];

  for (let i = 1; i < usable.length; i += 1) {
    const prev = current[current.length - 1];
    const curr = usable[i];
    if (isTeleport(prev, curr)) {
      if (current.length >= 2) segments.push(current);
      current = [curr];
      continue;
    }
    current.push(curr);
  }
  if (current.length >= 2) segments.push(current);

  return segments.map((segment) => segment.map((item) => item.point));
};

/**
 * Prefer the longest continuous segment for playback so tracking stays on one path.
 */
export const sanitizeHistoryPoints = (points: VehicleHistoryPoint[]): VehicleHistoryPoint[] => {
  const segments = splitHistorySegments(points);
  if (segments.length === 0) return [];
  return segments.reduce((longest, segment) =>
    segment.length > longest.length ? segment : longest,
  );
};

export const toHistoryRow = (point: VehicleHistoryPoint, index: number): VehicleHistoryRow => {
  const lat = pointLat(point);
  const lng = pointLng(point);
  const speed = asNumber(point.speed);
  const odometer = asNumber(point.odometer);

  return {
    id: asText(point.id) || `${index}-${asText(point.locationTime) || index}`,
    time: formatTime(point.locationTime || point.gpsTime || point.deviceTime || point.createdAt),
    address: asText(point.address) || "—",
    speed: speed == null ? "—" : String(speed),
    lat: lat == null ? "—" : lat.toFixed(6),
    lng: lng == null ? "—" : lng.toFixed(6),
    ignition: ignitionLabel(point.ignitionStatus) || "—",
    gsm: asText(point.gsmSignal) || "—",
    odometer: odometer == null ? "—" : String(odometer),
    status: asText(point.gpsStatusLabel) || asText(point.gpsStatus) || asText(point.status) || "—",
  };
};

export const pointsToRoute = (points: VehicleHistoryPoint[]): [number, number][] =>
  points
    .map((point) => {
      const lat = pointLat(point);
      const lng = pointLng(point);
      return lat != null && lng != null ? ([lat, lng] as [number, number]) : null;
    })
    .filter((point): point is [number, number] => point != null);

export const historyRowsToRoute = (rows: VehicleHistoryRow[]): [number, number][] =>
  rows
    .map((row) => {
      const lat = Number(row.lat);
      const lng = Number(row.lng);
      return Number.isFinite(lat) && Number.isFinite(lng) ? ([lat, lng] as [number, number]) : null;
    })
    .filter((point): point is [number, number] => point != null);

/** Local calendar day → ISO UTC range matching API examples. */
export const todayHistoryRangeIso = () => {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { from: start.toISOString(), to: end.toISOString() };
};

const toHistoryResult = (
  response: ApiEnvelope<VehicleHistoryPoint[] | VehicleHistoryTrackingResponse>,
): VehicleHistoryResult => {
  const payload = extractPayload(response);
  const rawPoints = extractPoints(payload);
  const segmentPoints = splitHistorySegments(rawPoints);
  const points = sanitizeHistoryPoints(rawPoints);
  const meta = payload && !Array.isArray(payload) ? payload : undefined;
  const routeSegments = segmentPoints.map(pointsToRoute).filter((segment) => segment.length >= 2);
  const route = pointsToRoute(points);

  return {
    vehicle: meta?.vehicle,
    from: meta?.from,
    to: meta?.to,
    stats: meta?.stats,
    points,
    rows: points.map(toHistoryRow),
    route,
    routeSegments: routeSegments.length > 0 ? routeSegments : route.length >= 2 ? [route] : [],
  };
};

export const vehicleHistoryTrackingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVehicleHistoryTracking: builder.query<VehicleHistoryResult, VehicleHistoryQueryArgs>({
      query: ({ vehicleId, from, to, limit = DEFAULT_HISTORY_LIMIT }) => ({
        url: "/vehicleHistoryTracking/history",
        params: { vehicleId, from, to, limit },
      }),
      transformResponse: (
        response: ApiEnvelope<VehicleHistoryPoint[] | VehicleHistoryTrackingResponse>,
      ) => toHistoryResult(response),
      providesTags: (_result, _error, { vehicleId }) => [
        { type: "VehicleHistoryTracking", id: vehicleId },
      ],
    }),

    getVehicleHistoryVehicles: builder.query<VehicleRow[], VehicleHistoryVehiclesParams>({
      query: (params) => ({
        url: "/vehicleHistoryTracking/vehicles",
        params: {
          ...(params.clientId ? { clientId: params.clientId } : {}),
          ...(params.transporterId ? { transporterId: params.transporterId } : {}),
          ...(params.groupId ? { groupId: params.groupId } : {}),
          ...(params.since ? { since: params.since } : {}),
          ...(params.lockStatus ? { lockStatus: params.lockStatus } : {}),
        },
      }),
      transformResponse: (response: ApiEnvelope<VehicleLiveTrackingRecord[]>) =>
        unwrapList(response).map(toVehicleRow),
      providesTags: [{ type: "VehicleHistoryTracking", id: "VEHICLES" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetVehicleHistoryTrackingQuery,
  useLazyGetVehicleHistoryTrackingQuery,
  useGetVehicleHistoryVehiclesQuery,
  useLazyGetVehicleHistoryVehiclesQuery,
} = vehicleHistoryTrackingApi;
