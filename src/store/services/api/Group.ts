import { api } from "../api";
import type { Group, CreateGroupRequest, UpdateGroupRequest } from "@/interfaces/Group";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type GroupApiRecord = Omit<Group, "externalId"> & { externalId?: string };

const normalizeGroup = (record: GroupApiRecord): Group => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
});

export const groupApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getGroups: builder.query<Group[], void>({
      query: () => "/addGroup/getAll",
      transformResponse: (response: ApiEnvelope<GroupApiRecord[]>) => unwrapList(response).map(normalizeGroup),
      providesTags: (result) => [
        { type: "Groups", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "Groups" as const, id: item.externalId })),
      ],
    }),

    getGroupById: builder.query<Group, string>({
      query: (externalId) => `/addGroup/getById/${externalId}`,
      transformResponse: (response: ApiEnvelope<GroupApiRecord>) => normalizeGroup(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "Groups", id: externalId }],
    }),

    createGroup: builder.mutation<Group, CreateGroupRequest>({
      query: (body) => ({
        url: "/addGroup",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<GroupApiRecord>) => normalizeGroup(unwrapResponse(response)),
      invalidatesTags: [{ type: "Groups", id: "LIST" }],
    }),

    updateGroup: builder.mutation<Group, { externalId: string; body: UpdateGroupRequest }>({
      query: ({ externalId, body }) => ({
        url: `/addGroup/update/${externalId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<GroupApiRecord>) => normalizeGroup(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Groups", id: externalId },
        { type: "Groups", id: "LIST" },
      ],
    }),

    deleteGroup: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/addGroup/delete/${externalId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "Groups", id: externalId },
        { type: "Groups", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetGroupsQuery,
  useGetGroupByIdQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
} = groupApi;
