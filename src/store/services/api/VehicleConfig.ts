import { api } from "../api";
import type { VehicleConfig, CreateVehicleConfigRequest, UpdateVehicleConfigRequest } from "@/interfaces/VehicleConfig";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type VehicleConfigApiRecord = Omit<VehicleConfig, "externalId"> & { externalId?: string };

const normalizeVehicleConfig = (record: VehicleConfigApiRecord): VehicleConfig => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
});

export const vehicleConfigApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVehicleConfigs: builder.query<VehicleConfig[], void>({
      query: () => "/vehicleConfig/getAll",
      transformResponse: (response: ApiEnvelope<VehicleConfigApiRecord[]>) => unwrapList(response).map(normalizeVehicleConfig),
      providesTags: (result) => [
        { type: "VehicleConfigs", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "VehicleConfigs" as const, id: item.externalId })),
      ],
    }),

    getVehicleConfigById: builder.query<VehicleConfig, string>({
      query: (externalId) => `/vehicleConfig/getById/${encodeURIComponent(externalId)}`,
      transformResponse: (response: ApiEnvelope<VehicleConfigApiRecord>) => normalizeVehicleConfig(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "VehicleConfigs", id: externalId }],
    }),

    createVehicleConfig: builder.mutation<VehicleConfig, CreateVehicleConfigRequest>({
      query: (body) => ({
        url: "/vehicleConfig",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<VehicleConfigApiRecord>) => normalizeVehicleConfig(unwrapResponse(response)),
      invalidatesTags: [{ type: "VehicleConfigs", id: "LIST" }],
    }),

    updateVehicleConfig: builder.mutation<VehicleConfig, { externalId: string; body: UpdateVehicleConfigRequest }>({
      query: ({ externalId, body }) => ({
        url: `/vehicleConfig/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<VehicleConfigApiRecord>) => normalizeVehicleConfig(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "VehicleConfigs", id: externalId },
        { type: "VehicleConfigs", id: "LIST" },
      ],
    }),

    deleteVehicleConfig: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/vehicleConfig/delete/${encodeURIComponent(externalId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "VehicleConfigs", id: externalId },
        { type: "VehicleConfigs", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetVehicleConfigsQuery,
  useGetVehicleConfigByIdQuery,
  useCreateVehicleConfigMutation,
  useUpdateVehicleConfigMutation,
  useDeleteVehicleConfigMutation,
} = vehicleConfigApi;
