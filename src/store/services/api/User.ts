import { api } from "../api";
import type { User, CreateUserRequest, UpdateUserRequest } from "@/interfaces/User";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type UserApiRecord = Omit<User, "externalId"> & { externalId?: string };

const normalizeUser = (record: UserApiRecord): User => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
});

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => "/user/getAll",
      transformResponse: (response: ApiEnvelope<UserApiRecord[]>) => unwrapList(response).map(normalizeUser),
      providesTags: (result) => [
        { type: "Users", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "Users" as const, id: item.externalId })),
      ],
    }),

    getUserById: builder.query<User, string>({
      query: (externalId) => `/user/getById/${externalId}`,
      transformResponse: (response: ApiEnvelope<UserApiRecord>) => normalizeUser(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "Users", id: externalId }],
    }),

    createUser: builder.mutation<User, CreateUserRequest>({
      query: (body) => ({
        url: "/user",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<UserApiRecord>) => normalizeUser(unwrapResponse(response)),
      invalidatesTags: [{ type: "Users", id: "LIST" }],
    }),

    updateUser: builder.mutation<User, { externalId: string; body: UpdateUserRequest }>({
      query: ({ externalId, body }) => ({
        url: `/user/update/${externalId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<UserApiRecord>) => normalizeUser(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Users", id: externalId },
        { type: "Users", id: "LIST" },
      ],
    }),

    deleteUser: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/user/delete/${externalId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "Users", id: externalId },
        { type: "Users", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = userApi;
