import { api } from "../api";
import type { RaiseTicket, CreateRaiseTicketRequest, UpdateRaiseTicketRequest } from "@/interfaces/RaiseTicket";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type RaiseTicketApiRecord = Omit<RaiseTicket, "externalId"> & { externalId?: string };

const normalizeRaiseTicket = (record: RaiseTicketApiRecord): RaiseTicket => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
});

export const raiseTicketApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getRaiseTickets: builder.query<RaiseTicket[], void>({
      query: () => "/raiseTicket/getAll",
      transformResponse: (response: ApiEnvelope<RaiseTicketApiRecord[]>) => unwrapList(response).map(normalizeRaiseTicket),
      providesTags: (result) => [
        { type: "RaiseTickets", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "RaiseTickets" as const, id: item.externalId })),
      ],
    }),

    getRaiseTicketById: builder.query<RaiseTicket, string>({
      query: (externalId) => `/raiseTicket/getById/${encodeURIComponent(externalId)}`,
      transformResponse: (response: ApiEnvelope<RaiseTicketApiRecord>) => normalizeRaiseTicket(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "RaiseTickets", id: externalId }],
    }),

    createRaiseTicket: builder.mutation<RaiseTicket, CreateRaiseTicketRequest>({
      query: (body) => ({
        url: "/raiseTicket",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<RaiseTicketApiRecord>) => normalizeRaiseTicket(unwrapResponse(response)),
      invalidatesTags: [{ type: "RaiseTickets", id: "LIST" }],
    }),

    updateRaiseTicket: builder.mutation<RaiseTicket, { externalId: string; body: UpdateRaiseTicketRequest }>({
      query: ({ externalId, body }) => ({
        url: `/raiseTicket/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<RaiseTicketApiRecord>) => normalizeRaiseTicket(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "RaiseTickets", id: externalId },
        { type: "RaiseTickets", id: "LIST" },
      ],
    }),

    deleteRaiseTicket: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/raiseTicket/delete/${encodeURIComponent(externalId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "RaiseTickets", id: externalId },
        { type: "RaiseTickets", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetRaiseTicketsQuery,
  useGetRaiseTicketByIdQuery,
  useCreateRaiseTicketMutation,
  useUpdateRaiseTicketMutation,
  useDeleteRaiseTicketMutation,
} = raiseTicketApi;
