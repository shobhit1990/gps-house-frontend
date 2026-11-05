import { api } from "../api";
import { Status } from "@/enums/Status";
import type { CreateRoleRequest, RoleApiRecord, RoleRecord, UpdateRoleRequest } from "@/interfaces/RoleManagement";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

const normalizeStatus = (status?: string): Status => {
	const value = status?.toLowerCase();
	return Object.values(Status).includes(value as Status) ? value as Status : Status.ACTIVE;
};

const normalizeRole = (role: RoleApiRecord): RoleRecord => ({
	id: role.id ?? role.externalId ?? "",
	externalId: String(role.externalId ?? role.id ?? ""),
	roleCode: role.roleCode ?? "",
	name: role.name ?? "",
	status: normalizeStatus(role.status),
	createdAt: role.createdAt,
	updatedAt: role.updatedAt,
});

export const roleApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getRoles: builder.query<RoleRecord[], void>({
			query: () => "/role/get-all",
			transformResponse: (response: ApiEnvelope<RoleApiRecord[]>) => unwrapList(response).map(normalizeRole),
			providesTags: (result) => [
				{ type: "Roles", id: "LIST" },
				...(result ?? []).map((role) => ({ type: "Roles" as const, id: role.externalId })),
			],
		}),
		getRoleById: builder.query<RoleRecord, string>({
			query: (externalId) => `/role/get-by-id/${encodeURIComponent(externalId)}`,
			transformResponse: (response: ApiEnvelope<RoleApiRecord>) => normalizeRole(unwrapResponse(response) ?? {}),
			providesTags: (_result, _error, externalId) => [{ type: "Roles", id: externalId }],
		}),
		createRole: builder.mutation<RoleRecord, CreateRoleRequest>({
			query: (body) => ({
				url: "/role/create",
				method: "POST",
				body,
			}),
			transformResponse: (response: ApiEnvelope<RoleApiRecord>) => normalizeRole(unwrapResponse(response) ?? {}),
			invalidatesTags: [{ type: "Roles", id: "LIST" }, { type: "Roles", id: "MASTER" }],
		}),
		updateRole: builder.mutation<RoleRecord, UpdateRoleRequest>({
			query: ({ externalId, ...body }) => ({
				url: `/role/update/${encodeURIComponent(externalId)}`,
				method: "PUT",
				body,
			}),
			transformResponse: (response: ApiEnvelope<RoleApiRecord>) => normalizeRole(unwrapResponse(response) ?? {}),
			invalidatesTags: (_result, _error, { externalId }) => [
				{ type: "Roles", id: externalId },
				{ type: "Roles", id: "LIST" },
				{ type: "Roles", id: "MASTER" },
			],
		}),
		deleteRole: builder.mutation<void, string>({
			query: (externalId) => ({
				url: `/role/delete/${encodeURIComponent(externalId)}`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, externalId) => [
				{ type: "Roles", id: externalId },
				{ type: "Roles", id: "LIST" },
				{ type: "Roles", id: "MASTER" },
			],
		}),
	}),
	overrideExisting: false,
});

export const {
	useGetRolesQuery,
	useGetRoleByIdQuery,
	useCreateRoleMutation,
	useUpdateRoleMutation,
	useDeleteRoleMutation,
} = roleApi;