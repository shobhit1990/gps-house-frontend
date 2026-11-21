import { api } from "../api";
import type {
  DriverAssignment,
  DriverAssignmentApiRecord,
  DriverAssignmentReportParams,
} from "@/interfaces/DriverAssignmentReport";
import { unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type NestedPerson = DriverAssignmentApiRecord["driver"];
type NestedVehicle = DriverAssignmentApiRecord["vehicle"];

const asText = (value: string | number | null | undefined): string => {
  if (value == null) return "";
  return String(value).trim();
};

const asPersonName = (value: NestedPerson, fallback?: string | null): string => {
  if (fallback?.trim()) return fallback.trim();
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  const first = asText(value.firstName);
  const last = asText(value.lastName);
  const full = `${first} ${last}`.trim();
  return asText(value.name) || full;
};

const asPersonPhone = (value: NestedPerson, fallback?: string | null): string => {
  if (fallback?.trim()) return fallback.trim();
  if (!value || typeof value === "string") return "";
  return asText(value.phoneNumber ?? value.phone ?? value.mobile);
};

const asVehicleNo = (value: NestedVehicle, fallback?: string | null): string => {
  if (fallback?.trim()) return fallback.trim();
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  return (
    asText(value.vehicle) ||
    asText(value.vehicleNo) ||
    asText(value.vehicleNickname) ||
    asText(value.name)
  );
};

const asNumber = (value: number | string | null | undefined): number => {
  if (value === undefined || value === null || value === "") return 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  const trimmed = value.trim();
  if (!trimmed) return 0;
  const direct = Number(trimmed);
  if (Number.isFinite(direct)) return direct;
  const hours = trimmed.match(/(\d+)\s*[Hh]/)?.[1];
  const minutes = trimmed.match(/(\d+)\s*[Mm]/)?.[1];
  if (hours || minutes) return Number(hours ?? 0) * 60 + Number(minutes ?? 0);
  const colon = trimmed.match(/^(\d+):(\d+)$/);
  if (colon) return Number(colon[1]) * 60 + Number(colon[2]);
  return 0;
};

const formatDuration = (record: DriverAssignmentApiRecord): string => {
  const raw = asText(record.duration);
  if (raw && /[HhMm:]/.test(raw)) return raw;
  const minutes =
    asNumber(record.durationMinutes) ||
    (asNumber(record.durationHours) > 0 ? asNumber(record.durationHours) * 60 : asNumber(record.duration));
  if (minutes <= 0) return raw || "—";
  const hours = Math.floor(minutes / 60);
  const remain = Math.round(minutes % 60);
  if (hours > 0 && remain > 0) return `${hours}H ${remain}M`;
  if (hours > 0) return `${hours}H`;
  return `${remain}M`;
};

const formatDistance = (value: number | string | null | undefined): string => {
  const km = asNumber(value);
  if (!Number.isFinite(km) || km <= 0) {
    const text = asText(value);
    return text || "—";
  }
  return Number.isInteger(km) ? String(km) : String(Math.round(km * 10) / 10);
};

const normalizeAssignment = (record: DriverAssignmentApiRecord, index: number): DriverAssignment => {
  const externalId = String(record.externalId ?? record.id ?? index);
  return {
    id: String(record.id ?? externalId),
    externalId,
    client: asText(record.clientName ?? record.client),
    transporter: asText(record.transporterName ?? record.transporter),
    driverName: asPersonName(record.driver, record.driverName ?? record.name),
    phone: asPersonPhone(record.driver, record.phoneNumber ?? record.phone ?? record.mobile),
    vehicleNo: asVehicleNo(record.vehicle, record.vehicleNo ?? record.vehicleNumber ?? record.vehicleName),
    assignedOn: asText(record.assignedOn ?? record.assignedAt ?? record.assignmentDate ?? record.startDate ?? record.fromDate),
    unassignedOn: asText(record.unassignedOn ?? record.unassignedAt ?? record.unassignmentDate ?? record.endDate ?? record.toDate),
    assignedBy: asText(record.assignedByName ?? record.assignedBy ?? record.createdBy),
    duration: formatDuration(record),
    distanceKm: formatDistance(record.distanceKm ?? record.distance ?? record.totalDistance),
  };
};

const unwrapAssignments = (
  response: ApiEnvelope<DriverAssignmentApiRecord[] | DriverAssignmentApiRecord>,
): DriverAssignment[] => {
  const data = unwrapResponse(response);
  if (Array.isArray(data)) return data.map(normalizeAssignment);
  if (data && typeof data === "object") return [normalizeAssignment(data, 0)];
  return [];
};

export const driverAssignmentReportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getDriverAssignmentReport: builder.query<DriverAssignment[], DriverAssignmentReportParams>({
      query: ({ client, transporter, vehicle, from, to }) => ({
        url: "/vehicle/driver-assignment",
        params: { client, transporter, vehicle, from, to },
      }),
      transformResponse: (response: ApiEnvelope<DriverAssignmentApiRecord[] | DriverAssignmentApiRecord>) =>
        unwrapAssignments(response),
      providesTags: (result) => [
        { type: "DriverAssignmentReports" as const, id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "DriverAssignmentReports" as const, id: item.externalId })),
      ],
    }),
  }),
  overrideExisting: false,
});

export const { useGetDriverAssignmentReportQuery, useLazyGetDriverAssignmentReportQuery } =
  driverAssignmentReportApi;
