import { api } from "../api";
import type { VehicleKind, VehicleRow, VehicleStatus } from "@/components/data/vehicles";
import type { VehicleLiveTrackingRecord } from "@/interfaces/VehicleLiveTracking";
import { unwrapList, type ApiEnvelope } from "../utils/unwrapResponse";

const STATUS_COLORS: Record<VehicleStatus, string> = {
  running: "#22c55e",
  stopped: "#e23b3b",
  overspeed: "#fb923c",
  idle: "#fbbf24",
  unreachable: "#22d3ee",
  new: "#94a3b8",
};

const asText = (value: unknown) => {
  if (value == null) return "";
  return String(value).trim();
};

const asNumber = (value: unknown) => {
  if (value == null || value === "") return undefined;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const asBool = (value: unknown) => {
  if (typeof value === "boolean") return value;
  if (value == null || value === "") return undefined;
  const text = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on", "y"].includes(text)) return true;
  if (["false", "0", "no", "off", "n"].includes(text)) return false;
  return undefined;
};

const normalizeKind = (value?: string): VehicleKind => {
  const text = (value ?? "").toLowerCase();
  if (text.includes("bike") || text.includes("two") || text.includes("2w") || text.includes("scooter")) {
    return "bike";
  }
  return "car";
};

const normalizeStatus = (gpsStatus?: string | null, speed?: number, overspeed?: number): VehicleStatus => {
  const text = (gpsStatus ?? "").toLowerCase();
  if (overspeed != null && overspeed > 0 && speed != null && speed > overspeed) return "overspeed";
  if (text.includes("over")) return "overspeed";
  if (text.includes("run") || text.includes("moving") || text.includes("motion")) return "running";
  if (text.includes("idle")) return "idle";
  if (
    text.includes("inactive") ||
    text.includes("unreach") ||
    text.includes("offline") ||
    text.includes("no gps")
  ) {
    return "unreachable";
  }
  if (text.includes("new")) return "new";
  if (text.includes("stop") || text.includes("park")) return "stopped";
  return "stopped";
};

const formatUpdatedAt = (value?: string) => {
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

export const toVehicleRow = (record: VehicleLiveTrackingRecord, index: number): VehicleRow => {
  const device = record.gpsDevice ?? {};
  const speedKmph = asNumber(device.speed) ?? 0;
  const overspeed = asNumber(record.overspeed);
  const status = normalizeStatus(record.gpsStatus, speedKmph, overspeed);
  const kind = normalizeKind(record.vehicleType);
  const ignition = asBool(device.ignitionStatus);
  const voltage = asText(device.voltage);
  const alarm = asText(device.alarm);

  return {
    sn: index + 1,
    id: asText(record.vehicleId) || undefined,
    kind,
    vehicleType: asText(record.vehicleType) || undefined,
    color: STATUS_COLORS[status],
    branch: asText(record.transporter?.name) || asText(record.client?.name),
    vehicle: asText(record.vehicleNumber) || asText(record.vehicleNickname),
    address: asText(device.address),
    poi: asText(record.client?.name) || "N/A",
    updatedAt: formatUpdatedAt(device.locationTime || device.addressUpdatedAt),
    lat: asNumber(device.latitude) ?? Number.NaN,
    lng: asNumber(device.longitude) ?? Number.NaN,
    status,
    since: formatUpdatedAt(device.locationTime),
    distanceKm: asNumber(device.distance) ?? 0,
    parking: asText(record.gpsStatusLabel) || asText(record.gpsStatus) || undefined,
    speedKmph,
    ac: ignition,
    btr: voltage || undefined,
    gsm: device.gsmSignal,
    gps: asText(record.gpsStatusLabel) || asText(record.gpsStatus) || undefined,
    lockStatus: ignition === false ? "Unlocked" : ignition ? "Ignition On" : undefined,
    iccid: asText(device.simNumber) || undefined,
    driverName: undefined,
    socPercent: undefined,
    excPowerVolt: asNumber(device.voltage),
    panic: alarm && alarm !== "00" ? alarm : false,
    ignition,
    odometerKm: asNumber(device.odometer),
    todayDistanceKm: asNumber(device.distance),
    distanceFromLastStopKm: asNumber(device.distance),
    alias: asText(record.vehicleNickname) || undefined,
  };
};

export const vehicleLiveTrackingApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVehicleLiveTracking: builder.query<VehicleRow[], void>({
      query: () => "/vehicleLiveTracking",
      transformResponse: (response: ApiEnvelope<VehicleLiveTrackingRecord[]>) =>
        unwrapList(response).map(toVehicleRow),
      providesTags: [{ type: "VehicleLiveTracking", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

export const { useGetVehicleLiveTrackingQuery } = vehicleLiveTrackingApi;
