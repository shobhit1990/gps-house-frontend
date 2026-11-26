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

const asVehicleNo = (value: NestedParty, fallback?: string): string => {
  if (fallback?.trim()) return fallback.trim();
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  return (
    value.vehicle?.trim() ||
    value.vehicleNo?.trim() ||
    value.vehicleNickname?.trim() ||
    value.name?.trim() ||
    ""
  );
};

const asDriverName = (value: NestedParty, fallback?: string): string => {
  if (fallback?.trim()) return fallback.trim();
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  return (value.name ?? value.companyName ?? "").trim();
};

const asExpenseTypeName = (value: NestedExpenseType): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  return (value.expenseName ?? value.name ?? "").trim();
};

const asNumber = (value: number | string | null | undefined): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
};

const asText = (value: string | null | undefined): string => value?.trim() ?? "";

const normalizeExpense = (record: ExpenseApiRecord): Expense => {
  const amount = asNumber(record.amount) ?? 0;
  return {
    id: record.id ?? "",
    externalId: String(record.externalId ?? record.id ?? ""),
    client: asId(record.client),
    clientName: asPartyName(record.client),
    transporter: asId(record.transporter),
    transporterName: asPartyName(record.transporter),
    expenseFor: record.expenseFor?.trim() || undefined,
    vehicle: asId(record.vehicle) || undefined,
    driver: asId(record.driver) || undefined,
    expenseName: asText(record.expenseName),
    expenseType: asId(record.expenseType),
    expenseTypeName: asExpenseTypeName(record.expenseType),
    amount,
    expenseDate: record.expenseDate ?? "",
    odometer: asNumber(record.odometer),
    engineHours: asNumber(record.engineHours),
    description: asText(record.description),
    quantity: asNumber(record.quantity),
    supplier: asText(record.supplier),
    buyer: asText(record.buyer),
    vehicleNo: asVehicleNo(record.vehicle, record.vehicleNo),
    driverName: asDriverName(record.driver, record.driverName),
    tripName: asText(record.tripName),
    createdBy: asText(record.createdBy),
    role: asText(record.role),
    status: record.status ?? undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
};

export type ExpenseListParams = {
  client?: string;
  vehicle?: string;
  /** ISO datetime preferred, e.g. 2026-11-25T00:00:00.000Z */
  from?: string;
  to?: string;
};

export const expenseApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getExpenses: builder.query<Expense[], ExpenseListParams | void>({
      query: (arg) => {
        const params =
          arg && typeof arg === "object"
            ? {
                ...(arg.client ? { client: arg.client } : {}),
                ...(arg.vehicle ? { vehicle: arg.vehicle } : {}),
                ...(arg.from ? { from: arg.from } : {}),
                ...(arg.to ? { to: arg.to } : {}),
              }
            : undefined;
        return {
          url: "/expense/getAll",
          params: params && Object.keys(params).length > 0 ? params : undefined,
        };
      },
      transformResponse: (response: ApiEnvelope<ExpenseApiRecord[]>) => {
        try {
          return unwrapList(response).map((item) => normalizeExpense(item ?? {}));
        } catch (error) {
          console.error("Failed to normalize expense list.", error);
          return [];
        }
      },
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
