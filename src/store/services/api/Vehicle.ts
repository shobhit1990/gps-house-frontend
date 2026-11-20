import { api } from "../api";
import type { Vehicle, CreateVehicleRequest, UpdateVehicleRequest } from "@/interfaces/Vehicle";
import { Status } from "@/enums/Status";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type VehicleApiRecord = Omit<Vehicle, "externalId"> & { externalId?: string };

export type SubscriptionReportParams = {
  client?: string;
  transporter?: string;
};

/** @deprecated Use SubscriptionReportParams */
export type SubscriptionExpiredParams = SubscriptionReportParams;

export type SubscriptionExpiredVehicle = {
  id: string;
  externalId: string;
  vehicleNo: string;
  active: "Yes" | "No";
  client: string;
  transporter: string;
  subscriptionStart: string;
  subscriptionDue: string;
};

export type SubscriptionChangedVehicle = {
  id: string;
  externalId: string;
  client: string;
  transporter: string;
  vehicleNo: string;
  changedBy: string;
  changedOn: string;
  preSubDueDate: string;
  newSubDueDate: string;
  preExtendedDate: string;
  newExtendedDate: string;
};

type RefLike =
  | string
  | {
      externalId?: string;
      id?: string | number;
      name?: string;
      userName?: string;
      username?: string;
      companyName?: string;
      vehicle?: string;
      vehicleNo?: string;
    }
  | null
  | undefined;

type SubscriptionExpiredApiRecord = {
  id?: string | number;
  externalId?: string;
  vehicle?: RefLike;
  vehicleNo?: string;
  status?: string;
  active?: boolean | string;
  client?: RefLike;
  transporter?: RefLike;
  subscriptionStartDate?: string;
  subscriptionDueDate?: string;
  subscriptionStart?: string;
  subscriptionDue?: string;
};

type SubscriptionChangedApiRecord = {
  id?: string | number;
  externalId?: string;
  vehicle?: RefLike;
  vehicleNo?: string;
  client?: RefLike;
  transporter?: RefLike;
  changedBy?: RefLike;
  changedOn?: string;
  updatedAt?: string;
  createdAt?: string;
  preSubDueDate?: string;
  previousSubscriptionDueDate?: string;
  preSubscriptionDueDate?: string;
  newSubDueDate?: string;
  newSubscriptionDueDate?: string;
  subscriptionDueDate?: string;
  preExtendedDate?: string;
  previousSubscriptionExtendDate?: string;
  preSubscriptionExtendedDate?: string;
  newExtendedDate?: string;
  newSubscriptionExtendDate?: string;
  subscriptionExtendDate?: string;
};

const normalizeVehicle = (record: VehicleApiRecord): Vehicle => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
});

const refId = (value: RefLike): string => {
  if (value == null || value === "") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return String(value.externalId ?? value.id ?? "");
};

const refName = (value: RefLike): string => {
  if (value == null || value === "") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return (
    value.name?.trim() ||
    value.userName?.trim() ||
    value.username?.trim() ||
    value.companyName?.trim() ||
    value.vehicle?.trim() ||
    value.vehicleNo?.trim() ||
    ""
  );
};

const formatReportDate = (value?: string, withTime = false) => {
  if (!value?.trim()) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value === "--" ? "--" : value;
  }
  const day = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  if (!withTime) return day;
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${hours}:${minutes}`;
};

const displayDateOrDash = (value?: string) => {
  const formatted = formatReportDate(value);
  return formatted || "--";
};

const vehicleNoFromRecord = (record: { vehicle?: RefLike; vehicleNo?: string }) =>
  (typeof record.vehicle === "object" && record.vehicle
    ? record.vehicle.vehicle?.trim() || record.vehicle.vehicleNo?.trim() || record.vehicle.name?.trim()
    : "") ||
  record.vehicleNo?.trim() ||
  (typeof record.vehicle === "string" ? record.vehicle : "") ||
  "";

const normalizeSubscriptionExpired = (record: SubscriptionExpiredApiRecord): SubscriptionExpiredVehicle => {
  const id = String(record.externalId ?? record.id ?? "");
  const activeRaw = record.active ?? record.status;
  const active =
    activeRaw === true ||
    activeRaw === "Yes" ||
    activeRaw === "yes" ||
    activeRaw === Status.ACTIVE
      ? "Yes"
      : "No";

  return {
    id,
    externalId: id,
    vehicleNo: vehicleNoFromRecord(record),
    active,
    client: refName(record.client) || refId(record.client),
    transporter: refName(record.transporter) || refId(record.transporter),
    subscriptionStart: formatReportDate(record.subscriptionStartDate ?? record.subscriptionStart),
    subscriptionDue: formatReportDate(record.subscriptionDueDate ?? record.subscriptionDue),
  };
};

const normalizeSubscriptionChanged = (record: SubscriptionChangedApiRecord): SubscriptionChangedVehicle => {
  const id = String(record.externalId ?? record.id ?? "");
  return {
    id,
    externalId: id,
    client: refName(record.client) || refId(record.client),
    transporter: refName(record.transporter) || refId(record.transporter),
    vehicleNo: vehicleNoFromRecord(record),
    changedBy: refName(record.changedBy) || refId(record.changedBy) || "",
    changedOn: formatReportDate(record.changedOn ?? record.updatedAt ?? record.createdAt, true),
    preSubDueDate: displayDateOrDash(
      record.preSubDueDate ?? record.previousSubscriptionDueDate ?? record.preSubscriptionDueDate,
    ),
    newSubDueDate: displayDateOrDash(
      record.newSubDueDate ?? record.newSubscriptionDueDate ?? record.subscriptionDueDate,
    ),
    preExtendedDate: displayDateOrDash(
      record.preExtendedDate ?? record.previousSubscriptionExtendDate ?? record.preSubscriptionExtendedDate,
    ),
    newExtendedDate: displayDateOrDash(
      record.newExtendedDate ?? record.newSubscriptionExtendDate ?? record.subscriptionExtendDate,
    ),
  };
};

export const vehicleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVehicles: builder.query<Vehicle[], { year?: string } | void>({
      query: (params) =>
        params?.year
          ? { url: "/vehicle/getAll", params: { year: params.year } }
          : "/vehicle/getAll",
      transformResponse: (response: ApiEnvelope<VehicleApiRecord[]>) => unwrapList(response).map(normalizeVehicle),
      providesTags: (result) => [
        { type: "Vehicles", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "Vehicles" as const, id: item.externalId })),
      ],
    }),

    getSubscriptionExpiredVehicles: builder.query<SubscriptionExpiredVehicle[], SubscriptionReportParams>({
      query: ({ client, transporter }) => ({
        url: "/vehicle/subscription-expired",
        params: {
          ...(client ? { client } : {}),
          ...(transporter ? { transporter } : {}),
        },
      }),
      transformResponse: (response: ApiEnvelope<SubscriptionExpiredApiRecord[]>) =>
        unwrapList(response).map(normalizeSubscriptionExpired),
    }),

    getSubscriptionChangedVehicles: builder.query<SubscriptionChangedVehicle[], SubscriptionReportParams>({
      query: ({ client, transporter }) => ({
        url: "/vehicle/subscription-changed",
        params: {
          ...(client ? { client } : {}),
          ...(transporter ? { transporter } : {}),
        },
      }),
      transformResponse: (response: ApiEnvelope<SubscriptionChangedApiRecord[]>) =>
        unwrapList(response).map(normalizeSubscriptionChanged),
    }),

    getVehicleById: builder.query<Vehicle, string>({
      query: (externalId) => `/vehicle/getById/${encodeURIComponent(externalId)}`,
      transformResponse: (response: ApiEnvelope<VehicleApiRecord>) => {
        const record = unwrapResponse(response);
        if (!record) throw new Error("Vehicle API returned an empty record.");
        return normalizeVehicle(record);
      },
      providesTags: (_result, _error, externalId) => [{ type: "Vehicles", id: externalId }],
    }),

    createVehicle: builder.mutation<Vehicle, CreateVehicleRequest>({
      query: (body) => ({
        url: "/vehicle",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<VehicleApiRecord>) => normalizeVehicle(unwrapResponse(response)),
      invalidatesTags: [{ type: "Vehicles", id: "LIST" }],
    }),

    updateVehicle: builder.mutation<Vehicle, { externalId: string; body: UpdateVehicleRequest }>({
      query: ({ externalId, body }) => ({
        url: `/vehicle/update/${externalId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<VehicleApiRecord>) => normalizeVehicle(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Vehicles", id: externalId },
        { type: "Vehicles", id: "LIST" },
      ],
    }),

    deleteVehicle: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/vehicle/delete/${externalId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "Vehicles", id: externalId },
        { type: "Vehicles", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetVehiclesQuery,
  useGetVehicleByIdQuery,
  useLazyGetVehicleByIdQuery,
  useGetSubscriptionExpiredVehiclesQuery,
  useLazyGetSubscriptionExpiredVehiclesQuery,
  useGetSubscriptionChangedVehiclesQuery,
  useLazyGetSubscriptionChangedVehiclesQuery,
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
} = vehicleApi;
