import { api } from "../api";
import { Status } from "@/enums/Status";
import type {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  UserGroupRef,
  UserTimezoneRef,
  UserRoleRef,
} from "@/interfaces/User";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type UserApiRecord = {
  id?: string | number;
  externalId?: string;
  userName?: string;
  password?: string;
  group?: UserGroupRef;
  userType?: string;
  role?: UserRoleRef;
  timezone?: UserTimezoneRef;
  companyName?: string;
  contactPersonName?: string;
  phone?: string | number | null;
  companyAddress?: string;
  dataRestrictionDays?: number;
  isSchoolUser?: boolean;
  status?: string;
  reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;

const refId = (value: unknown): string => {
  if (value == null || value === "") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  const record = asRecord(value);
  if (!record) return "";
  const id = record.externalId ?? record.id;
  return id == null ? "" : String(id);
};

const refLabel = (value: unknown, keys: string[]): string => {
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    return text;
  }
  const record = asRecord(value);
  if (!record) return "";
  for (const key of keys) {
    const text = record[key];
    if (typeof text === "string" && text.trim()) return text.trim();
  }
  return "";
};

const normalizeStatus = (status?: string): Status => {
  const value = status?.toLowerCase();
  return Object.values(Status).includes(value as Status) ? (value as Status) : Status.ACTIVE;
};

const normalizeUser = (record: UserApiRecord): User => {
  const groupId = refId(record.group);
  const timezoneId = refId(record.timezone);
  const roleCode = refLabel(record.role, ["roleCode", "name"]);
  return {
    id: record.id ?? record.externalId ?? "",
    externalId: String(record.externalId ?? record.id ?? ""),
    userName: record.userName ?? "",
    password: record.password,
    group: groupId,
    groupName: refLabel(record.group, ["groupName", "name"]) || undefined,
    userType: record.userType || roleCode || undefined,
    role: record.role,
    timezone: timezoneId,
    timezoneName: refLabel(record.timezone, ["timeZone", "timezone", "name"]) || undefined,
    companyName: record.companyName ?? "",
    contactPersonName: record.contactPersonName ?? undefined,
    phone: record.phone == null ? undefined : String(record.phone),
    companyAddress: record.companyAddress ?? undefined,
    dataRestrictionDays: record.dataRestrictionDays,
    isSchoolUser: Boolean(record.isSchoolUser),
    status: normalizeStatus(record.status),
    reason: record.reason?.trim() || undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
};

export const userApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getUsers: builder.query<User[], void>({
      query: () => "/user/getAll",
      transformResponse: (response: ApiEnvelope<UserApiRecord[]>) =>
        unwrapList(response).map(normalizeUser),
      providesTags: (result) => [
        { type: "Users", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "Users" as const, id: item.externalId })),
      ],
    }),

    getUserById: builder.query<User, string>({
      query: (externalId) => `/user/getById/${externalId}`,
      transformResponse: (response: ApiEnvelope<UserApiRecord>) =>
        normalizeUser(unwrapResponse(response) ?? {}),
      providesTags: (_result, _error, externalId) => [{ type: "Users", id: externalId }],
    }),

    createUser: builder.mutation<User, CreateUserRequest>({
      query: (body) => ({
        url: "/user",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<UserApiRecord>) =>
        normalizeUser(unwrapResponse(response) ?? {}),
      invalidatesTags: [{ type: "Users", id: "LIST" }],
    }),

    updateUser: builder.mutation<User, { externalId: string; body: UpdateUserRequest }>({
      query: ({ externalId, body }) => ({
        url: `/user/update/${externalId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<UserApiRecord>) =>
        normalizeUser(unwrapResponse(response) ?? {}),
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
