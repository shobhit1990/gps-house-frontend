import { api } from "../api";
import { Status } from "@/enums/Status";
import type { Announcement, CreateAnnouncementRequest, UpdateAnnouncementRequest } from "@/interfaces/Announcement";
import { statusChangeBody } from "@/lib/statusPayload";
import { toFormData } from "../utils/formData";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type AnnouncementApiRecord = Omit<Announcement, "externalId" | "client" | "transporter" | "messageType"> & {
  externalId?: string;
  client?: string | { id?: string | number; externalId?: string; name?: string };
  transporter?: string | { id?: string | number; externalId?: string; name?: string };
  messageType?: string;
};

/** IMAGE announcements carry a file, so they go out as multipart form data; everything else stays JSON. */
const toAnnouncementBody = (body: UpdateAnnouncementRequest): UpdateAnnouncementRequest | FormData =>
  body.messageImage ? toFormData(body) : body;

const normalizeStatus = (status?: string): Status => {
  const value = String(status ?? "").trim().toLowerCase();
  return value === Status.INACTIVE ? Status.INACTIVE : Status.ACTIVE;
};

const refId = (value: AnnouncementApiRecord["client"]): string | undefined => {
  if (value == null || value === "") return undefined;
  if (typeof value === "string" || typeof value === "number") return String(value);
  const id = value.externalId ?? value.id;
  return id == null || id === "" ? undefined : String(id);
};

const normalizeMessageType = (value?: string): Announcement["messageType"] => {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "image" ? "image" : "text";
};

const normalizeAnnouncement = (record: AnnouncementApiRecord): Announcement => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
  client: refId(record?.client),
  transporter: refId(record?.transporter),
  messageType: normalizeMessageType(record?.messageType),
  status: normalizeStatus(record?.status as string | undefined),
});

export const announcementApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getAnnouncements: builder.query<Announcement[], void>({
      query: () => "/announcement/getAll",
      transformResponse: (response: ApiEnvelope<AnnouncementApiRecord[]>) => unwrapList(response).map(normalizeAnnouncement),
      providesTags: (result) => [
        { type: "Announcements", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "Announcements" as const, id: item.externalId })),
      ],
    }),

    getAnnouncementById: builder.query<Announcement, string>({
      query: (externalId) => `/announcement/getById/${encodeURIComponent(externalId)}`,
      transformResponse: (response: ApiEnvelope<AnnouncementApiRecord>) => normalizeAnnouncement(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "Announcements", id: externalId }],
    }),

    createAnnouncement: builder.mutation<Announcement, CreateAnnouncementRequest>({
      query: (body) => ({
        url: "/announcement",
        method: "POST",
        body: toAnnouncementBody(body),
      }),
      transformResponse: (response: ApiEnvelope<AnnouncementApiRecord>) => normalizeAnnouncement(unwrapResponse(response)),
      invalidatesTags: [{ type: "Announcements", id: "LIST" }],
    }),

    updateAnnouncement: builder.mutation<Announcement, { externalId: string; body: UpdateAnnouncementRequest }>({
      query: ({ externalId, body }) => ({
        url: `/announcement/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body: toAnnouncementBody(body),
      }),
      transformResponse: (response: ApiEnvelope<AnnouncementApiRecord>) => normalizeAnnouncement(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Announcements", id: externalId },
        { type: "Announcements", id: "LIST" },
      ],
    }),

    updateAnnouncementStatus: builder.mutation<
      Announcement,
      { externalId: string; status: Status; reason?: string }
    >({
      query: ({ externalId, status, reason }) => ({
        url: `/announcement/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body: statusChangeBody(status, reason),
      }),
      transformResponse: (response: ApiEnvelope<AnnouncementApiRecord>) =>
        normalizeAnnouncement(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Announcements", id: externalId },
        { type: "Announcements", id: "LIST" },
      ],
    }),

    deleteAnnouncement: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/announcement/delete/${encodeURIComponent(externalId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "Announcements", id: externalId },
        { type: "Announcements", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetAnnouncementsQuery,
  useGetAnnouncementByIdQuery,
  useCreateAnnouncementMutation,
  useUpdateAnnouncementMutation,
  useUpdateAnnouncementStatusMutation,
  useDeleteAnnouncementMutation,
} = announcementApi;
