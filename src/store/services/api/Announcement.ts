import { api } from "../api";
import type { Announcement, CreateAnnouncementRequest, UpdateAnnouncementRequest } from "@/interfaces/Announcement";
import { toFormData } from "../utils/formData";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type AnnouncementApiRecord = Omit<Announcement, "externalId"> & { externalId?: string };

/** IMAGE announcements carry a file, so they go out as multipart form data; everything else stays JSON. */
const toAnnouncementBody = (body: UpdateAnnouncementRequest): UpdateAnnouncementRequest | FormData =>
  body.messageImage ? toFormData(body) : body;

const normalizeAnnouncement = (record: AnnouncementApiRecord): Announcement => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
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
  useDeleteAnnouncementMutation,
} = announcementApi;
