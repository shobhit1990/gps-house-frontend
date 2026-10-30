import { api } from "../api";
import type { JobSheet, CreateJobSheetRequest, UpdateJobSheetRequest } from "@/interfaces/JobSheet";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type JobSheetApiRecord = Omit<JobSheet, "externalId"> & { externalId?: string };

const normalizeJobSheet = (record: JobSheetApiRecord): JobSheet => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
});

export const jobSheetApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getJobSheets: builder.query<JobSheet[], void>({
      query: () => "/jobsheet/getAll",
      transformResponse: (response: ApiEnvelope<JobSheetApiRecord[]>) => unwrapList(response).map(normalizeJobSheet),
      providesTags: (result) => [
        { type: "JobSheets", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "JobSheets" as const, id: item.externalId })),
      ],
    }),

    getJobSheetById: builder.query<JobSheet, string>({
      query: (externalId) => `/jobsheet/getById/${externalId}`,
      transformResponse: (response: ApiEnvelope<JobSheetApiRecord>) => normalizeJobSheet(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "JobSheets", id: externalId }],
    }),

    createJobSheet: builder.mutation<JobSheet, CreateJobSheetRequest>({
      query: (body) => ({
        url: "/jobsheet",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<JobSheetApiRecord>) => normalizeJobSheet(unwrapResponse(response)),
      invalidatesTags: [{ type: "JobSheets", id: "LIST" }],
    }),

    updateJobSheet: builder.mutation<JobSheet, { externalId: string; body: UpdateJobSheetRequest }>({
      query: ({ externalId, body }) => ({
        url: `/jobsheet/update/${externalId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<JobSheetApiRecord>) => normalizeJobSheet(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "JobSheets", id: externalId },
        { type: "JobSheets", id: "LIST" },
      ],
    }),

    deleteJobSheet: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/jobsheet/delete/${externalId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "JobSheets", id: externalId },
        { type: "JobSheets", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetJobSheetsQuery,
  useGetJobSheetByIdQuery,
  useCreateJobSheetMutation,
  useUpdateJobSheetMutation,
  useDeleteJobSheetMutation,
} = jobSheetApi;
