import { api } from "../api";
import type { Group, CreateGroupRequest, UpdateGroupRequest } from "@/interfaces/Group";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type GroupPartyRef = string | number | { externalId?: string | number; id?: string | number; _id?: string | number } | null | undefined;

type GroupApiRecord = Omit<Group, "externalId" | "vehicles" | "transporters"> & {
  externalId?: string;
  vehicles?: GroupPartyRef[] | GroupPartyRef;
  transporters?: GroupPartyRef[] | GroupPartyRef;
  vehicle?: GroupPartyRef[] | GroupPartyRef;
  transporter?: GroupPartyRef[] | GroupPartyRef;
};

const asId = (value: GroupPartyRef): string => {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  return String(value.externalId ?? value.id ?? value._id ?? "").trim();
};

const asIdList = (value: GroupPartyRef[] | GroupPartyRef | undefined): string[] => {
  if (value == null) return [];
  const list = Array.isArray(value) ? value : [value];
  return [...new Set(list.map(asId).filter(Boolean))];
};

const normalizeGroup = (record: GroupApiRecord): Group => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
  vehicles: asIdList(record?.vehicles ?? record?.vehicle),
  transporters: asIdList(record?.transporters ?? record?.transporter),
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
