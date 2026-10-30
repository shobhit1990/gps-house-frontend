import { api } from "../api";
import type { Transporter, CreateTransporterRequest, UpdateTransporterRequest } from "@/interfaces/Transporter";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type TransporterApiRecord = Omit<Transporter, "externalId"> & { externalId?: string };

const normalizeTransporter = (record: TransporterApiRecord): Transporter => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
});

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
        url: "/transporter/",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<TransporterApiRecord>) => normalizeTransporter(unwrapResponse(response)),
      invalidatesTags: [{ type: "Transporters", id: "LIST" }],
    }),

    updateTransporter: builder.mutation<Transporter, { externalId: string; body: UpdateTransporterRequest }>({
      query: ({ externalId, body }) => ({
        url: `/transporter/update/${externalId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<TransporterApiRecord>) => normalizeTransporter(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Transporters", id: externalId },
        { type: "Transporters", id: "LIST" },
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
  useCreateTransporterMutation,
  useUpdateTransporterMutation,
  useDeleteTransporterMutation,
} = transporterApi;
