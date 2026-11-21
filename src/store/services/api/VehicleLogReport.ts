import { api } from "../api";
import type {
  VehicleLog,
  VehicleLogApiRecord,
  VehicleLogRef,
  VehicleLogReportParams,
} from "@/interfaces/VehicleLogReport";
import { unwrapList, type ApiEnvelope } from "../utils/unwrapResponse";

type NestedVehicle = string | VehicleLogRef | null | undefined;

const asVehicleNo = (value: NestedVehicle, fallback?: string | null): string => {
  if (fallback?.trim()) return fallback.trim();
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  return (
    value.vehicle?.trim() ||
    value.vehicleNo?.trim() ||
    value.vehicleNickname?.trim() ||
    value.name?.trim() ||
    ""
  );
};

const asText = (value: string | null | undefined): string => value?.trim() ?? "";

const normalizeVehicleLog = (record: VehicleLogApiRecord): VehicleLog => {
  const externalId = String(record.externalId ?? record.id ?? "");
  return {
    id: String(record.id ?? externalId),
    externalId,
    vehicle: asVehicleNo(record.vehicle, record.vehicleNo),
    modifiedType: asText(record.modifiedType),
    modifiedDate: asText(record.modifiedDate) || asText(record.updatedAt) || asText(record.createdAt),
    createdBy: asText(record.createdBy),
    event: asText(record.event),
    oldData: asText(record.oldData),
    newData: asText(record.newData),
    message: asText(record.message),
  };
};

export const vehicleLogReportApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVehicleLogReport: builder.query<VehicleLog[], VehicleLogReportParams>({
      query: ({ modifiedType, month }) => ({
        url: "/vehicleLogReport",
        params: {
          modifiedType,
          month,
        },
      }),
      transformResponse: (response: ApiEnvelope<VehicleLogApiRecord[]>) =>
        unwrapList(response).map(normalizeVehicleLog),
      providesTags: (result) => [
        { type: "VehicleLogReports" as const, id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "VehicleLogReports" as const, id: item.externalId })),
      ],
    }),
  }),
  overrideExisting: false,
});

export const { useGetVehicleLogReportQuery, useLazyGetVehicleLogReportQuery } = vehicleLogReportApi;
