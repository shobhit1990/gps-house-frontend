import { api } from "../api";
import { Status } from "@/enums/Status";
import type {
	CreateExpenseTypeRequest,
	DeleteExpenseTypeResponse,
	ExpenseType,
	ExpenseTypeApiRecord,
	UpdateExpenseTypeRequest,
	UpdateExpenseTypeStatusRequest,
} from "@/interfaces/ExpenseType";
import { normalizeReason, statusChangeBody } from "@/lib/statusPayload";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

function normalizeExpenseType(record: ExpenseTypeApiRecord): ExpenseType {
	const status = record.status?.toLowerCase();
	return {
		id: record.id,
		externalId: String(record.externalId ?? record.id ?? ""),
		expenseName: record.expenseName ?? record.expenseType ?? record.name ?? "",
		status: Object.values(Status).includes(status as Status) ? (status as Status) : Status.ACTIVE,
		reason: normalizeReason(record.reason) || undefined,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
	};
}

function requireExpenseType(response: ApiEnvelope<ExpenseTypeApiRecord>): ExpenseTypeApiRecord {
	const record = unwrapResponse(response);
	if (!record) throw new Error("The expense type response was empty.");
	return record;
}

export const expenseTypeApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getExpenseTypes: builder.query<ExpenseType[], void>({
			query: () => "/expenseType/getAll",
			transformResponse: (response: ApiEnvelope<ExpenseTypeApiRecord[]>) =>
				unwrapList(response).map(normalizeExpenseType),
			providesTags: (result) => [
				{ type: "ExpenseTypes", id: "LIST" },
				...(result ?? []).map((item) => ({ type: "ExpenseTypes" as const, id: item.externalId })),
				{ type: "Master", id: "EXPENSE_TYPE" },
			],
		}),

		getExpenseTypeById: builder.query<ExpenseType, string>({
			query: (externalId) => `/expenseType/getById/${encodeURIComponent(externalId)}`,
			transformResponse: (response: ApiEnvelope<ExpenseTypeApiRecord>) =>
				normalizeExpenseType(requireExpenseType(response)),
			providesTags: (_result, _error, externalId) => [{ type: "ExpenseTypes", id: externalId }],
		}),

		createExpenseType: builder.mutation<ExpenseType, CreateExpenseTypeRequest>({
			query: (body) => ({
				url: "/expenseType/",
				method: "POST",
				body,
			}),
			transformResponse: (response: ApiEnvelope<ExpenseTypeApiRecord>) =>
				normalizeExpenseType(requireExpenseType(response)),
			invalidatesTags: [
				{ type: "ExpenseTypes", id: "LIST" },
				{ type: "Master", id: "EXPENSE_TYPE" },
			],
		}),

		updateExpenseType: builder.mutation<ExpenseType, UpdateExpenseTypeRequest>({
			query: ({ externalId, expenseName }) => ({
				url: `/expenseType/update/${encodeURIComponent(externalId)}`,
				method: "PUT",
				body: { expenseName },
			}),
			transformResponse: (response: ApiEnvelope<ExpenseTypeApiRecord>) =>
				normalizeExpenseType(requireExpenseType(response)),
			invalidatesTags: (_result, _error, { externalId }) => [
				{ type: "ExpenseTypes", id: externalId },
				{ type: "ExpenseTypes", id: "LIST" },
				{ type: "Master", id: "EXPENSE_TYPE" },
			],
		}),

		updateExpenseTypeStatus: builder.mutation<ExpenseType, UpdateExpenseTypeStatusRequest>({
			query: ({ externalId, status, reason }) => ({
				url: `/expenseType/update/${encodeURIComponent(externalId)}`,
				method: "PUT",
				body: statusChangeBody(status, reason),
			}),
			transformResponse: (response: ApiEnvelope<ExpenseTypeApiRecord>) =>
				normalizeExpenseType(requireExpenseType(response)),
			invalidatesTags: (_result, _error, { externalId }) => [
				{ type: "ExpenseTypes", id: externalId },
				{ type: "ExpenseTypes", id: "LIST" },
				{ type: "Master", id: "EXPENSE_TYPE" },
			],
		}),

		deleteExpenseType: builder.mutation<DeleteExpenseTypeResponse, string>({
			query: (externalId) => ({
				url: `/expenseType/delete/${encodeURIComponent(externalId)}`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, externalId) => [
				{ type: "ExpenseTypes", id: externalId },
				{ type: "ExpenseTypes", id: "LIST" },
				{ type: "Master", id: "EXPENSE_TYPE" },
			],
		}),
	}),
	overrideExisting: false,
});

export const {
	useGetExpenseTypesQuery,
	useGetExpenseTypeByIdQuery,
	useCreateExpenseTypeMutation,
	useUpdateExpenseTypeMutation,
	useUpdateExpenseTypeStatusMutation,
	useDeleteExpenseTypeMutation,
} = expenseTypeApi;
