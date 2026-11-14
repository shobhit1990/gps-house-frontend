import { api } from "../api";
import type { CreateExpenseRequest, Expense, UpdateExpenseRequest } from "@/interfaces/Expense";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type ExpenseApiRecord = Omit<Expense, "externalId"> & { externalId?: string };

const normalizeExpense = (record: ExpenseApiRecord): Expense => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
});

export const expenseApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getExpenses: builder.query<Expense[], void>({
      query: () => "/expense/getAll",
      transformResponse: (response: ApiEnvelope<ExpenseApiRecord[]>) =>
        unwrapList(response).map(normalizeExpense),
      providesTags: (result) => [
        { type: "Expenses", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "Expenses" as const, id: item.externalId })),
      ],
    }),

    getExpenseById: builder.query<Expense, string>({
      query: (externalId) => `/expense/getById/${encodeURIComponent(externalId)}`,
      transformResponse: (response: ApiEnvelope<ExpenseApiRecord>) => normalizeExpense(unwrapResponse(response)!),
      providesTags: (_result, _error, externalId) => [{ type: "Expenses", id: externalId }],
    }),

    createExpense: builder.mutation<Expense, CreateExpenseRequest>({
      query: (body) => ({
        url: "/expense",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<ExpenseApiRecord>) => normalizeExpense(unwrapResponse(response)!),
      invalidatesTags: [{ type: "Expenses", id: "LIST" }],
    }),

    updateExpense: builder.mutation<Expense, { externalId: string; body: UpdateExpenseRequest }>({
      query: ({ externalId, body }) => ({
        url: `/expense/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<ExpenseApiRecord>) => normalizeExpense(unwrapResponse(response)!),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Expenses", id: externalId },
        { type: "Expenses", id: "LIST" },
      ],
    }),

    deleteExpense: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/expense/delete/${encodeURIComponent(externalId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "Expenses", id: externalId },
        { type: "Expenses", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetExpensesQuery,
  useGetExpenseByIdQuery,
  useLazyGetExpenseByIdQuery,
  useCreateExpenseMutation,
  useUpdateExpenseMutation,
  useDeleteExpenseMutation,
} = expenseApi;