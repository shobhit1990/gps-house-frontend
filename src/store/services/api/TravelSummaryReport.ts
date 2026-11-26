import { api } from "../api";
import type {
  TravelSummary,
  TravelSummaryApiRecord,
  TravelSummaryReportParams,
} from "@/interfaces/TravelSummaryReport";
import { unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type NestedVehicle = TravelSummaryApiRecord["vehicle"];

/** Coerce API scalars / `{ id, name }` refs to a safe display string. */
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
        record.address ??
        record.location ??
        record.name ??
        record.userName ??
        record.username ??
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
  if (hours || minutes) return (Number(hours ?? 0) * 60) + Number(minutes ?? 0);
  const colon = trimmed.match(/^(\d+):(\d+)$/);
  if (colon) return (Number(colon[1]) * 60) + Number(colon[2]);
  return 0;
};

const normalizeTravelSummary = (record: TravelSummaryApiRecord, index: number): TravelSummary => {
  const externalId = String(record.externalId ?? record.id ?? index);
  return {
    id: String(record.id ?? externalId),
    externalId,
    vehicle: asVehicleNo(record.vehicle, record.vehicleNo ?? record.vehicleName),
    startAddress: asText(record.startAddress ?? record.startLoc ?? record.startLocation),
    endAddress: asText(record.endAddress ?? record.endLoc ?? record.endLocation),
    totalDistance: asNumber(record.totalDistance ?? record.distance),
    runningMinutes: asNumber(record.runningMinutes ?? record.running ?? record.runningTime),
    idleMinutes: asNumber(record.idleMinutes ?? record.idle ?? record.idleTime),
    stopMinutes: asNumber(record.stopMinutes ?? record.stop ?? record.stopTime),
    overSpeedMinutes: asNumber(record.overSpeedMinutes ?? record.overSpeed ?? record.overspeed),
    overSpeedCount: asNumber(record.overSpeedCount ?? record.overspeedcount ?? record.overSpeedCnt),
  };
};

const unwrapTravelSummaries = (
  response: ApiEnvelope<
    | TravelSummaryApiRecord[]
    | TravelSummaryApiRecord
    | { rows?: TravelSummaryApiRecord[]; data?: TravelSummaryApiRecord[]; list?: TravelSummaryApiRecord[] }
  >,
): TravelSummary[] => {
  try {
    const data = unwrapResponse(response);
    if (Array.isArray(data)) return data.map(normalizeTravelSummary);
    if (data && typeof data === "object") {
      const nested = data as {
        rows?: TravelSummaryApiRecord[];
        data?: TravelSummaryApiRecord[];
        list?: TravelSummaryApiRecord[];
      };
      const list = nested.rows ?? nested.data ?? nested.list;
      if (Array.isArray(list)) return list.map(normalizeTravelSummary);
      return [normalizeTravelSummary(data as TravelSummaryApiRecord, 0)];
    }
    return [];
  } catch (error) {
    console.error("Failed to normalize travel summary report.", error);
    return [];
  }
};

export const travelSummaryReportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTravelSummaryReport: builder.query<TravelSummary[], TravelSummaryReportParams>({
      query: ({ client, transporter, vehicle, from, to }) => ({
        url: "/travelSummaryReport",
        params: { client, transporter, vehicle, from, to },
      }),
      transformResponse: (
        response: ApiEnvelope<
          | TravelSummaryApiRecord[]
          | TravelSummaryApiRecord
          | { rows?: TravelSummaryApiRecord[]; data?: TravelSummaryApiRecord[]; list?: TravelSummaryApiRecord[] }
        >,
      ) => unwrapTravelSummaries(response),
      providesTags: (result) => [
        { type: "TravelSummaryReports" as const, id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "TravelSummaryReports" as const, id: item.externalId })),
      ],
    }),
  }),
  overrideExisting: true,
});

export const { useGetTravelSummaryReportQuery, useLazyGetTravelSummaryReportQuery } = travelSummaryReportApi;
