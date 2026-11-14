import { api } from "../api";
import type { Client, CreateClientRequest, UpdateClientRequest } from "@/interfaces/Client";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type ClientApiRecord = Omit<Client, "externalId" | "companyName" | "userName" | "owner_name"> & {
  externalId?: string;
  companyName?: string;
  company?: string;
  userName?: string;
  username?: string;
  owner_name?: string;
  ownerName?: string;
};

const normalizeClient = (record: ClientApiRecord): Client => ({
  ...record,
  companyName: record.companyName ?? record.company ?? "",
  userName: record.userName ?? record.username ?? "",
  owner_name: record.owner_name ?? record.ownerName ?? "",
  externalId: String(record?.externalId ?? record?.id ?? ""),
});

export const clientApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getClients: builder.query<Client[], void>({
      query: () => "/client/getAll",
      transformResponse: (response: ApiEnvelope<ClientApiRecord[]>) => unwrapList(response).map(normalizeClient),
      providesTags: (result) => [
        { type: "Clients", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "Clients" as const, id: item.externalId })),
      ],
    }),

    getClientById: builder.query<Client, string>({
      query: (externalId) => `/client/get-by-id/${externalId}`,
      transformResponse: (response: ApiEnvelope<ClientApiRecord>) => normalizeClient(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "Clients", id: externalId }],
    }),

    createClient: builder.mutation<Client, CreateClientRequest>({
      query: (body) => ({
        url: "/client",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<ClientApiRecord>) => normalizeClient(unwrapResponse(response)),
      invalidatesTags: [{ type: "Clients", id: "LIST" }],
    }),

    updateClient: builder.mutation<Client, { externalId: string; body: UpdateClientRequest }>({
      query: ({ externalId, body }) => ({
        url: `/client/update/${externalId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<ClientApiRecord>) => normalizeClient(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Clients", id: externalId },
        { type: "Clients", id: "LIST" },
      ],
    }),

    deleteClient: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/client/delete/${externalId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "Clients", id: externalId },
        { type: "Clients", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetClientsQuery,
  useGetClientByIdQuery,
  useCreateClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} = clientApi;
