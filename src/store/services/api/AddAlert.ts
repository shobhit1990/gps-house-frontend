import { api } from "../api";
import type { Alert, CreateAlertRequest, UpdateAlertRequest } from "@/interfaces/Alert";
import type { NotificationListItem, NotificationListParams } from "@/interfaces/NotificationList";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type AlertApiRecord = Omit<Alert, "externalId"> & { externalId?: string };

type NotificationApiRecord = Record<string, unknown> & {
  id?: string | number;
  externalId?: string;
};

const asText = (value: unknown) => {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const nested =
      record.vehicleNo ??
      record.vehicle ??
      record.name ??
      record.alertType ??
      record.alertName ??
      record.label ??
      record.externalId ??
      record.id;
    return asText(nested);
  }
  return "";
};

const formatAdded = (value: unknown) => {
  const raw = asText(value);
  if (!raw) return "";
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;
  return date.toLocaleString();
};

const normalizeAlert = (record: AlertApiRecord): Alert => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
});

const normalizeNotification = (record: NotificationApiRecord, index: number): NotificationListItem => {
  const externalId = String(record.externalId ?? record.id ?? `notification-${index}`);
  const lat = asText(record.latitude ?? record.lat);
  const lng = asText(record.longitude ?? record.lng ?? record.lon);
  const coords = lat && lng ? `${lat}, ${lng}` : "";
  return {
    id: externalId,
    externalId,
    vehicleNo: asText(record.vehicleNo ?? record.vehicle ?? record.vehicleName),
    type: asText(record.type ?? record.notification ?? record.alertType ?? record.alertName),
    location: asText(record.location) || coords,
    message: asText(record.message ?? record.alertMessage ?? record.description),
    address: asText(record.address ?? record.fullAddress),
    added: formatAdded(record.added ?? record.createdAt ?? record.timestamp ?? record.time),
    client: asText(record.clientName ?? record.client),
    transporter: asText(record.transporterName ?? record.transporter),
  };
};

const notificationParams = (params: NotificationListParams) => {
  const query: Record<string, string> = {};
  if (params.client) query.client = params.client;
  if (params.transporter) query.transporter = params.transporter;
  if (params.vehicle) query.vehicle = params.vehicle;
  if (params.notification) query.notification = params.notification;
  return query;
};

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

    getNotificationList: builder.query<NotificationListItem[], NotificationListParams>({
      query: (params) => ({
        url: "/alert/getAll",
        params: notificationParams(params),
      }),
      transformResponse: (response: ApiEnvelope<NotificationApiRecord[]>) =>
        unwrapList(response).map(normalizeNotification),
      providesTags: (result) => [
        { type: "Alerts", id: "NOTIFICATIONS" },
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
  useGetNotificationListQuery,
  useGetAlertByIdQuery,
  useCreateAlertMutation,
  useUpdateAlertMutation,
  useDeleteAlertMutation,
} = alertApi;
