import { api } from "../api";
import type { Vehicle, CreateVehicleRequest, UpdateVehicleRequest } from "@/interfaces/Vehicle";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type VehicleApiRecord = Omit<Vehicle, "externalId"> & { externalId?: string };

const normalizeVehicle = (record: VehicleApiRecord): Vehicle => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
});

export const vehicleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getVehicles: builder.query<Vehicle[], void>({
      query: () => "/vehicle/getAll",
      transformResponse: (response: ApiEnvelope<VehicleApiRecord[]>) => unwrapList(response).map(normalizeVehicle),
      providesTags: (result) => [
        { type: "Vehicles", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "Vehicles" as const, id: item.externalId })),
      ],
    }),

    getVehicleById: builder.query<Vehicle, string>({
      query: (externalId) => `/vehicle/getById/${externalId}`,
      transformResponse: (response: ApiEnvelope<VehicleApiRecord>) => normalizeVehicle(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "Vehicles", id: externalId }],
    }),

    createVehicle: builder.mutation<Vehicle, CreateVehicleRequest>({
      query: (body) => ({
        url: "/vehicle/",
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
  useCreateVehicleMutation,
  useUpdateVehicleMutation,
  useDeleteVehicleMutation,
} = vehicleApi;
