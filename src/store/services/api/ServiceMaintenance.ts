import { api } from "../api";
import { Status } from "@/enums/Status";
import type { ServiceMaintenance, CreateServiceMaintenanceRequest, UpdateServiceMaintenanceRequest } from "@/interfaces/ServiceMaintenance";
import { statusChangeBody } from "@/lib/statusPayload";
import { toFormData } from "../utils/formData";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type ServiceMaintenanceApiRecord = Omit<ServiceMaintenance, "externalId"> & { externalId?: string };

const normalizeStatus = (status?: string): Status => {
  const value = String(status ?? "").trim().toLowerCase();
  return value === Status.INACTIVE ? Status.INACTIVE : Status.ACTIVE;
};

const normalizeServiceMaintenance = (record: ServiceMaintenanceApiRecord): ServiceMaintenance => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
  status: normalizeStatus(record?.status as string | undefined),
});

export const serviceMaintenanceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getServiceMaintenances: builder.query<ServiceMaintenance[], void>({
      query: () => "/serviceMaintenance/getAll",
      transformResponse: (response: ApiEnvelope<ServiceMaintenanceApiRecord[]>) => unwrapList(response).map(normalizeServiceMaintenance),
      providesTags: (result) => [
        { type: "ServiceMaintenance", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "ServiceMaintenance" as const, id: item.externalId })),
      ],
    }),

    getServiceMaintenanceById: builder.query<ServiceMaintenance, string>({
      query: (externalId) => `/serviceMaintenance/getById/${encodeURIComponent(externalId)}`,
      transformResponse: (response: ApiEnvelope<ServiceMaintenanceApiRecord>) => normalizeServiceMaintenance(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "ServiceMaintenance", id: externalId }],
    }),

    createServiceMaintenance: builder.mutation<ServiceMaintenance, CreateServiceMaintenanceRequest>({
      query: (body) => ({
        url: "/serviceMaintenance",
        method: "POST",
        body: toFormData(body),
      }),
      transformResponse: (response: ApiEnvelope<ServiceMaintenanceApiRecord>) => normalizeServiceMaintenance(unwrapResponse(response)),
      invalidatesTags: [{ type: "ServiceMaintenance", id: "LIST" }],
    }),

    updateServiceMaintenance: builder.mutation<ServiceMaintenance, { externalId: string; body: UpdateServiceMaintenanceRequest }>({
      query: ({ externalId, body }) => ({
        url: `/serviceMaintenance/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body: toFormData(body),
      }),
      transformResponse: (response: ApiEnvelope<ServiceMaintenanceApiRecord>) => normalizeServiceMaintenance(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "ServiceMaintenance", id: externalId },
        { type: "ServiceMaintenance", id: "LIST" },
      ],
    }),

    updateServiceMaintenanceStatus: builder.mutation<
      ServiceMaintenance,
      { externalId: string; status: Status; reason?: string }
    >({
      query: ({ externalId, status, reason }) => ({
        url: `/serviceMaintenance/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body: statusChangeBody(status, reason),
      }),
      transformResponse: (response: ApiEnvelope<ServiceMaintenanceApiRecord>) =>
        normalizeServiceMaintenance(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "ServiceMaintenance", id: externalId },
        { type: "ServiceMaintenance", id: "LIST" },
      ],
    }),

    deleteServiceMaintenance: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/serviceMaintenance/delete/${encodeURIComponent(externalId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "ServiceMaintenance", id: externalId },
        { type: "ServiceMaintenance", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetServiceMaintenancesQuery,
  useGetServiceMaintenanceByIdQuery,
  useCreateServiceMaintenanceMutation,
  useUpdateServiceMaintenanceMutation,
  useUpdateServiceMaintenanceStatusMutation,
  useDeleteServiceMaintenanceMutation,
} = serviceMaintenanceApi;
