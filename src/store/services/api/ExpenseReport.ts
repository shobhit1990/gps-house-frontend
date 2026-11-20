import { api } from "../api";
import type {
  CreateExpenseRequest,
  Expense,
  ExpenseApiRecord,
  ExpensePartyRef,
  ExpenseTypeRef,
  UpdateExpenseRequest,
} from "@/interfaces/Expense";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type NestedParty = string | ExpensePartyRef | null | undefined;
type NestedExpenseType = string | ExpenseTypeRef | null | undefined;

const asId = (value: NestedParty | NestedExpenseType): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return String(value.id ?? "").trim();
};

const asPartyName = (value: NestedParty): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return (value.name ?? value.companyName ?? "").trim();
};

const asExpenseTypeName = (value: NestedExpenseType): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return (value.expenseName ?? value.name ?? "").trim();
};

const asNumber = (value: number | string | undefined): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const normalizeExpense = (record: ExpenseApiRecord): Expense => {
  const amount = asNumber(record.amount) ?? 0;
  return {
    id: record.id ?? "",
    externalId: String(record.externalId ?? record.id ?? ""),
    client: asId(record.client),
    clientName: asPartyName(record.client),
    transporter: asId(record.transporter),
    transporterName: asPartyName(record.transporter),
    expenseName: record.expenseName?.trim() ?? "",
    expenseType: asId(record.expenseType),
    expenseTypeName: asExpenseTypeName(record.expenseType),
    amount,
    expenseDate: record.expenseDate ?? "",
    odometer: asNumber(record.odometer),
    engineHours: asNumber(record.engineHours),
    description: record.description ?? "",
    quantity: asNumber(record.quantity),
    supplier: record.supplier ?? "",
    buyer: record.buyer ?? "",
    vehicleNo: record.vehicleNo ?? "",
    driverName: record.driverName ?? "",
    tripName: record.tripName ?? "",
    createdBy: record.createdBy ?? "",
    role: record.role ?? "",
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
};

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
      transformResponse: (response: ApiEnvelope<ExpenseApiRecord>) =>
        normalizeExpense(unwrapResponse(response)!),
      providesTags: (_result, _error, externalId) => [{ type: "Expenses", id: externalId }],
    }),

    createExpense: builder.mutation<Expense, CreateExpenseRequest>({
      query: (body) => ({
        url: "/expense",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<ExpenseApiRecord>) =>
        normalizeExpense(unwrapResponse(response)!),
      invalidatesTags: [{ type: "Expenses", id: "LIST" }],
    }),

    updateExpense: builder.mutation<Expense, { externalId: string; body: UpdateExpenseRequest }>({
      query: ({ externalId, body }) => ({
        url: `/expense/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<ExpenseApiRecord>) =>
        normalizeExpense(unwrapResponse(response)!),
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
