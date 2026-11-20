import { api } from "../api";
import type {
  VehicleHistoryPoint,
  VehicleHistoryRow,
  VehicleHistoryTrackingResponse,
} from "@/interfaces/VehicleHistoryTracking";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

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

const extractPoints = (
  response: ApiEnvelope<VehicleHistoryPoint[] | VehicleHistoryTrackingResponse>,
): VehicleHistoryPoint[] => {
  const payload = unwrapResponse(response);
  if (Array.isArray(payload)) return payload;

  if (payload && typeof payload === "object") {
    if (Array.isArray(payload.history)) return payload.history;
    if (Array.isArray(payload.records)) return payload.records;
    if (Array.isArray(payload.points)) return payload.points;
    if (Array.isArray(payload.data)) return payload.data;
    if (payload.data && typeof payload.data === "object" && !Array.isArray(payload.data)) {
      const nested = payload.data;
      if (Array.isArray(nested.history)) return nested.history;
      if (Array.isArray(nested.records)) return nested.records;
      if (Array.isArray(nested.points)) return nested.points;
    }
  }

  return unwrapList(response as ApiEnvelope<VehicleHistoryPoint[]>);
};

export const toHistoryRow = (point: VehicleHistoryPoint, index: number): VehicleHistoryRow => {
  const lat = asNumber(point.latitude ?? point.lat);
  const lng = asNumber(point.longitude ?? point.lng ?? point.lon);
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

export const vehicleHistoryTrackingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVehicleHistoryTracking: builder.query<VehicleHistoryRow[], string>({
      query: (vehicleId) => `/vehicleHistoryTracking/${encodeURIComponent(vehicleId)}`,
      transformResponse: (response: ApiEnvelope<VehicleHistoryPoint[] | VehicleHistoryTrackingResponse>) =>
        extractPoints(response).map(toHistoryRow),
      providesTags: (_result, _error, vehicleId) => [
        { type: "VehicleHistoryTracking", id: vehicleId },
      ],
    }),
  }),
  overrideExisting: false,
});

export const { useGetVehicleHistoryTrackingQuery, useLazyGetVehicleHistoryTrackingQuery } =
  vehicleHistoryTrackingApi;
