import { api } from "../api";
import type { Alert, CreateAlertRequest, UpdateAlertRequest } from "@/interfaces/Alert";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type AlertApiRecord = Omit<Alert, "externalId"> & { externalId?: string };

const normalizeAlert = (record: AlertApiRecord): Alert => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
});

export const alertApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAlerts: builder.query<Alert[], void>({
      query: () => "/alert/getAll",
      transformResponse: (response: ApiEnvelope<AlertApiRecord[]>) => unwrapList(response).map(normalizeAlert),
      providesTags: (result) => [
        { type: "Alerts", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "Alerts" as const, id: item.externalId })),
      ],
    }),

    getAlertById: builder.query<Alert, string>({
      query: (externalId) => `/alert/getById/${encodeURIComponent(externalId)}`,
      transformResponse: (response: ApiEnvelope<AlertApiRecord>) => normalizeAlert(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "Alerts", id: externalId }],
    }),

    createAlert: builder.mutation<Alert, CreateAlertRequest>({
      query: (body) => ({
        url: "/alert",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<AlertApiRecord>) => normalizeAlert(unwrapResponse(response)),
      invalidatesTags: [{ type: "Alerts", id: "LIST" }],
    }),

    updateAlert: builder.mutation<Alert, { externalId: string; body: UpdateAlertRequest }>({
      query: ({ externalId, body }) => ({
        url: `/alert/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<AlertApiRecord>) => normalizeAlert(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Alerts", id: externalId },
        { type: "Alerts", id: "LIST" },
      ],
    }),

    deleteAlert: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/alert/delete/${encodeURIComponent(externalId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "Alerts", id: externalId },
        { type: "Alerts", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAlertsQuery,
  useGetAlertByIdQuery,
  useCreateAlertMutation,
  useUpdateAlertMutation,
  useDeleteAlertMutation,
} = alertApi;
