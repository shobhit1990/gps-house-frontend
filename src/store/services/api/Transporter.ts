import { api } from "../api";
import type { Transporter, CreateTransporterRequest, UpdateTransporterRequest } from "@/interfaces/Transporter";
import { Status } from "@/enums/Status";
import { statusChangeBody } from "@/lib/statusPayload";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type TransporterApiRecord = Omit<Transporter, "externalId" | "active" | "status" | "reason"> & {
  externalId?: string;
  active?: boolean | string | number;
  status?: Status | string;
  reason?: string | null;
};

const asOptionalText = (value: unknown): string | undefined => {
  if (value == null || value === "") return undefined;
  return String(value).trim() || undefined;
};

/** API may send active as boolean, "true"/"false", or only a status string. */
const isTransporterActive = (record: { active?: unknown; status?: unknown }): boolean => {
  const active = record.active;
  if (typeof active === "boolean") return active;
  if (typeof active === "number") return active !== 0;
  if (typeof active === "string") {
    const value = active.trim().toLowerCase();
    if (["false", "0", "inactive", "no"].includes(value)) return false;
    if (["true", "1", "active", "yes"].includes(value)) return true;
  }
  return String(record.status ?? "").trim().toLowerCase() !== Status.INACTIVE;
};

const normalizeTransporter = (record?: TransporterApiRecord | null): Transporter => {
  const safeRecord = record && typeof record === "object" ? record : ({} as TransporterApiRecord);
  const active = isTransporterActive(safeRecord);
  return {
    ...safeRecord,
    id: safeRecord.id ?? "",
    externalId: String(safeRecord.externalId ?? safeRecord.id ?? ""),
    // API may return phone as a number — keep string so forms can safely .trim().
    phone: asOptionalText(safeRecord.phone),
    name: asOptionalText(safeRecord.name),
    email: asOptionalText(safeRecord.email),
    address: asOptionalText(safeRecord.address),
    active,
    status: active ? Status.ACTIVE : Status.INACTIVE,
    reason: asOptionalText(safeRecord.reason),
  };
};

export const transporterApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTransporters: builder.query<Transporter[], void>({
      query: () => "/transporter/getAll",
      transformResponse: (response: ApiEnvelope<TransporterApiRecord[]>) => unwrapList(response).map(normalizeTransporter),
      providesTags: (result) => [
        { type: "Transporters", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "Transporters" as const, id: item.externalId })),
      ],
    }),

    getTransporterById: builder.query<Transporter, string>({
      query: (externalId) => `/transporter/getById/${externalId}`,
      transformResponse: (response: ApiEnvelope<TransporterApiRecord>) => normalizeTransporter(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "Transporters", id: externalId }],
    }),

    createTransporter: builder.mutation<Transporter, CreateTransporterRequest>({
      query: (body) => ({
        url: "/transporter",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<TransporterApiRecord | string>) => {
        const data = unwrapResponse(response);
        if (typeof data === "string") {
          return normalizeTransporter({ id: data } as TransporterApiRecord);
        }
        return normalizeTransporter(data);
      },
      invalidatesTags: [{ type: "Transporters", id: "LIST" }],
    }),

    updateTransporter: builder.mutation<Transporter, { externalId: string; body: UpdateTransporterRequest }>({
      query: ({ externalId, body }) => ({
        url: `/transporter/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<TransporterApiRecord>) => normalizeTransporter(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Transporters", id: externalId },
        { type: "Transporters", id: "LIST" },
        { type: "Master", id: "TRANSPORTER" },
      ],
    }),

    updateTransporterStatus: builder.mutation<
      Transporter,
      { externalId: string; status: Status; reason?: string }
    >({
      query: ({ externalId, status, reason }) => ({
        url: `/transporter/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body: statusChangeBody(status, reason, {
          active: status === Status.ACTIVE,
          // Clear stale inactive reason when reactivating.
          reason: status === Status.INACTIVE ? reason?.trim() || undefined : "",
        }),
      }),
      transformResponse: (response: ApiEnvelope<TransporterApiRecord>) =>
        normalizeTransporter(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Transporters", id: externalId },
        { type: "Transporters", id: "LIST" },
        { type: "Master", id: "TRANSPORTER" },
      ],
    }),

    deleteTransporter: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/transporter/delete/${externalId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "Transporters", id: externalId },
        { type: "Transporters", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTransportersQuery,
  useGetTransporterByIdQuery,
  useLazyGetTransporterByIdQuery,
  useCreateTransporterMutation,
  useUpdateTransporterMutation,
  useUpdateTransporterStatusMutation,
  useDeleteTransporterMutation,
} = transporterApi;
