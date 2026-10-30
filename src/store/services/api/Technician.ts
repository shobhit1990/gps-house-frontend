import { api } from "../api";
import type { Technician, CreateTechnicianRequest, UpdateTechnicianRequest } from "@/interfaces/Technician";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type TechnicianApiRecord = Omit<Technician, "externalId"> & { externalId?: string };

const normalizeTechnician = (record: TechnicianApiRecord): Technician => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
});

export const technicianApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTechnicians: builder.query<Technician[], void>({
      query: () => "/technician/getAll",
      transformResponse: (response: ApiEnvelope<TechnicianApiRecord[]>) => unwrapList(response).map(normalizeTechnician),
      providesTags: (result) => [
        { type: "Technicians", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "Technicians" as const, id: item.externalId })),
      ],
    }),

    getTechnicianById: builder.query<Technician, string>({
      query: (externalId) => `/technician/getById/${externalId}`,
      transformResponse: (response: ApiEnvelope<TechnicianApiRecord>) => normalizeTechnician(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "Technicians", id: externalId }],
    }),

    createTechnician: builder.mutation<Technician, CreateTechnicianRequest>({
      query: (body) => ({
        url: "/technician",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<TechnicianApiRecord>) => normalizeTechnician(unwrapResponse(response)),
      invalidatesTags: [{ type: "Technicians", id: "LIST" }],
    }),

    updateTechnician: builder.mutation<Technician, { externalId: string; body: UpdateTechnicianRequest }>({
      query: ({ externalId, body }) => ({
        url: `/technician/update/${externalId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<TechnicianApiRecord>) => normalizeTechnician(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Technicians", id: externalId },
        { type: "Technicians", id: "LIST" },
      ],
    }),

    deleteTechnician: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/technician/delete/${externalId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "Technicians", id: externalId },
        { type: "Technicians", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTechniciansQuery,
  useGetTechnicianByIdQuery,
  useCreateTechnicianMutation,
  useUpdateTechnicianMutation,
  useDeleteTechnicianMutation,
} = technicianApi;
