import { api } from "../api";
import { toPaymentTerm } from "@/enums/PaymentTerm";
import { Status } from "@/enums/Status";
import type {
  CreatePaymentDetailsRequest,
  PaymentDetails,
  UpdatePaymentDetailsRequest,
} from "@/interfaces/PaymentDetails";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type RefValue =
  | string
  | number
  | {
      id?: string | number;
      externalId?: string;
      name?: string;
      transporterName?: string;
      vehicle?: string;
      vehicleNo?: string;
      vehicleNickname?: string;
    };

type PaymentDetailsApiRecord = Omit<
  Partial<PaymentDetails>,
  "externalId" | "transporter" | "vehicle" | "paymentTerm" | "status"
> & {
  id?: string | number;
  externalId?: string;
  transporter?: RefValue;
  vehicle?: RefValue;
  paymentTerm?: string;
  status?: string;
  sellingPrice?: string | number;
  rental?: string | number;
};

const refId = (value: RefValue | undefined) => {
  if (value == null) return "";
  if (typeof value === "object") return String(value.externalId ?? value.id ?? "");
  return String(value);
};

const refName = (value: RefValue | undefined) => {
  if (value == null || typeof value !== "object") return "";
  return String(
    value.transporterName ??
      value.vehicleNo ??
      value.vehicle ??
      value.vehicleNickname ??
      value.name ??
      "",
  ).trim();
};

const toNumber = (value: string | number | null | undefined) => {
  if (value == null || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

const toDateOnly = (value?: string) => {
  const day = String(value ?? "").trim().slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : String(value ?? "").trim();
};

const toStatus = (value?: string) =>
  String(value ?? "").trim().toLowerCase() === Status.INACTIVE ? Status.INACTIVE : Status.ACTIVE;

const normalizePaymentDetails = (record: PaymentDetailsApiRecord): PaymentDetails => {
  const id = record.externalId ?? record.id ?? "";
  const transporterId = refId(record.transporter);
  const vehicleId = refId(record.vehicle);

  return {
    ...record,
    id: record.id ?? id,
    externalId: String(id),
    type: record.type ?? "",
    transporter: transporterId || (typeof record.transporter === "string" ? record.transporter : ""),
    transporterName: refName(record.transporter) || record.transporterName || "",
    sellingPrice: toNumber(record.sellingPrice),
    paymentTerm: toPaymentTerm(record.paymentTerm),
    installationDate: toDateOnly(record.installationDate),
    rentalDueDate: toDateOnly(record.rentalDueDate),
    technicianName: record.technicianName ?? "",
    rental: toNumber(record.rental),
    remark: record.remark ?? "",
    status: toStatus(record.status),
    reason: record.reason ?? "",
    vehicle: vehicleId || (typeof record.vehicle === "string" ? record.vehicle : "") || record.vehicleName || "",
    vehicleName: refName(record.vehicle) || record.vehicleName || "",
    invoice: record.invoice ?? "",
  };
};

const requireRecord = (response: ApiEnvelope<PaymentDetailsApiRecord>) => {
  const record = unwrapResponse(response);
  if (!record) throw new Error("Payment details API returned an empty record.");
  return record;
};

export const paymentDetailsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentDetailsList: builder.query<PaymentDetails[], void>({
      query: () => "/paymentDetails/getAll",
      transformResponse: (response: ApiEnvelope<PaymentDetailsApiRecord[]>) =>
        unwrapList(response).map(normalizePaymentDetails),
      providesTags: (result) => [
        { type: "PaymentDetails", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "PaymentDetails" as const, id: item.externalId })),
      ],
    }),

    getPaymentDetailsById: builder.query<PaymentDetails, string>({
      query: (externalId) => `/paymentDetails/getById/${encodeURIComponent(externalId)}`,
      transformResponse: (response: ApiEnvelope<PaymentDetailsApiRecord>) =>
        normalizePaymentDetails(requireRecord(response)),
      providesTags: (_result, _error, externalId) => [{ type: "PaymentDetails", id: externalId }],
    }),

    createPaymentDetails: builder.mutation<PaymentDetails, CreatePaymentDetailsRequest>({
      query: (body) => ({
        url: "/paymentDetails",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<PaymentDetailsApiRecord>) =>
        normalizePaymentDetails(requireRecord(response)),
      invalidatesTags: [{ type: "PaymentDetails", id: "LIST" }],
    }),

    updatePaymentDetails: builder.mutation<PaymentDetails, { externalId: string; body: UpdatePaymentDetailsRequest }>({
      query: ({ externalId, body }) => ({
        url: `/paymentDetails/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<PaymentDetailsApiRecord>) =>
        normalizePaymentDetails(requireRecord(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "PaymentDetails", id: externalId },
        { type: "PaymentDetails", id: "LIST" },
      ],
    }),

    deletePaymentDetails: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/paymentDetails/delete/${encodeURIComponent(externalId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "PaymentDetails", id: externalId },
        { type: "PaymentDetails", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPaymentDetailsListQuery,
  useGetPaymentDetailsByIdQuery,
  useLazyGetPaymentDetailsByIdQuery,
  useCreatePaymentDetailsMutation,
  useUpdatePaymentDetailsMutation,
  useDeletePaymentDetailsMutation,
} = paymentDetailsApi;
