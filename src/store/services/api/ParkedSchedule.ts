import { api } from "../api";
import { Status } from "@/enums/Status";
import type { ParkedSchedule, CreateParkedScheduleRequest, UpdateParkedScheduleRequest } from "@/interfaces/ParkedSchedule";
import { statusChangeBody } from "@/lib/statusPayload";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type ParkedScheduleApiRecord = Omit<ParkedSchedule, "externalId"> & { externalId?: string };

const normalizeStatus = (status?: string): Status => {
  const value = String(status ?? "").trim().toLowerCase();
  return value === Status.INACTIVE ? Status.INACTIVE : Status.ACTIVE;
};

const normalizeParkedSchedule = (record: ParkedScheduleApiRecord): ParkedSchedule => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
  status: normalizeStatus(record?.status as string | undefined),
});

export const parkedScheduleApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getParkedSchedules: builder.query<ParkedSchedule[], void>({
      query: () => "/parkedSchedule/getAll",
      transformResponse: (response: ApiEnvelope<ParkedScheduleApiRecord[]>) => unwrapList(response).map(normalizeParkedSchedule),
      providesTags: (result) => [
        { type: "ParkedSchedules", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "ParkedSchedules" as const, id: item.externalId })),
      ],
    }),

    getParkedScheduleById: builder.query<ParkedSchedule, string>({
      query: (externalId) => `/parkedSchedule/getById/${encodeURIComponent(externalId)}`,
      transformResponse: (response: ApiEnvelope<ParkedScheduleApiRecord>) => normalizeParkedSchedule(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "ParkedSchedules", id: externalId }],
    }),

    createParkedSchedule: builder.mutation<ParkedSchedule, CreateParkedScheduleRequest>({
      query: (body) => ({
        url: "/parkedSchedule",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<ParkedScheduleApiRecord>) => normalizeParkedSchedule(unwrapResponse(response)),
      invalidatesTags: [{ type: "ParkedSchedules", id: "LIST" }],
    }),

    updateParkedSchedule: builder.mutation<ParkedSchedule, { externalId: string; body: UpdateParkedScheduleRequest }>({
      query: ({ externalId, body }) => ({
        url: `/parkedSchedule/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<ParkedScheduleApiRecord>) => normalizeParkedSchedule(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "ParkedSchedules", id: externalId },
        { type: "ParkedSchedules", id: "LIST" },
      ],
    }),

    updateParkedScheduleStatus: builder.mutation<
      ParkedSchedule,
      { externalId: string; status: Status; reason?: string }
    >({
      query: ({ externalId, status, reason }) => ({
        url: `/parkedSchedule/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body: statusChangeBody(status, reason),
      }),
      transformResponse: (response: ApiEnvelope<ParkedScheduleApiRecord>) =>
        normalizeParkedSchedule(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "ParkedSchedules", id: externalId },
        { type: "ParkedSchedules", id: "LIST" },
      ],
    }),

    deleteParkedSchedule: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/parkedSchedule/delete/${encodeURIComponent(externalId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "ParkedSchedules", id: externalId },
        { type: "ParkedSchedules", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetParkedSchedulesQuery,
  useGetParkedScheduleByIdQuery,
  useCreateParkedScheduleMutation,
  useUpdateParkedScheduleMutation,
  useUpdateParkedScheduleStatusMutation,
  useDeleteParkedScheduleMutation,
} = parkedScheduleApi;
