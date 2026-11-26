import { api } from "../api";
import type {
  StoppageSummary,
  StoppageSummaryApiRecord,
  StoppageSummaryReportParams,
} from "@/interfaces/StoppageSummaryReport";
import { unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type NestedVehicle = StoppageSummaryApiRecord["vehicle"];

const asText = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value.map((item) => asText(item)).filter(Boolean).join(", ");
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    return asText(
      record.vehicleNo ??
        record.vehicle ??
        record.vehicleNickname ??
        record.name ??
        record.externalId ??
        record.id,
    );
  }
  return "";
};

const asVehicleNo = (value: NestedVehicle, fallback?: unknown): string => {
  const fromFallback = asText(fallback);
  if (fromFallback) return fromFallback;
  return asText(value);
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

const normalizeStoppageSummary = (record: StoppageSummaryApiRecord, index: number): StoppageSummary => {
  const externalId = String(record.externalId ?? record.id ?? index);
  return {
    id: String(record.id ?? externalId),
    externalId,
    vehicle: asVehicleNo(record.vehicle, record.vehicleNo ?? record.vehicleName),
    totalDistance: asNumber(record.totalDistance ?? record.distance),
    runningMinutes: asNumber(record.runningMinutes ?? record.running ?? record.runningTime),
    idleMinutes: asNumber(record.idleMinutes ?? record.idle ?? record.idleTime),
    stopMinutes: asNumber(record.stopMinutes ?? record.stop ?? record.stopTime),
    stops: asNumber(record.stops ?? record.noOfStops ?? record.stopCount),
    avgSpeed: asNumber(record.avgSpeed ?? record.averageSpeed),
    maxSpeed: asNumber(record.maxSpeed ?? record.maximumSpeed),
  };
};

const unwrapStoppageSummaries = (
  response: ApiEnvelope<StoppageSummaryApiRecord[] | StoppageSummaryApiRecord>,
): StoppageSummary[] => {
  const data = unwrapResponse(response);
  if (Array.isArray(data)) return data.map(normalizeStoppageSummary);
  if (data && typeof data === "object") return [normalizeStoppageSummary(data, 0)];
  return [];
};

export const stoppageSummaryReportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getStoppageSummaryReport: builder.query<StoppageSummary[], StoppageSummaryReportParams>({
      query: ({ client, vehicle, duration, startDate, endDate }) => ({
        url: "/vehicle/stoppage-summary",
        params: { client, vehicle, duration, startDate, endDate },
      }),
      transformResponse: (response: ApiEnvelope<StoppageSummaryApiRecord[] | StoppageSummaryApiRecord>) =>
        unwrapStoppageSummaries(response),
      providesTags: (result) => [
        { type: "StoppageSummaryReports" as const, id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "StoppageSummaryReports" as const, id: item.externalId })),
      ],
    }),
  }),
  overrideExisting: true,
});

export const { useGetStoppageSummaryReportQuery, useLazyGetStoppageSummaryReportQuery } =
  stoppageSummaryReportApi;
