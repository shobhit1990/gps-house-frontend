import { api } from "../api";
import type { PaymentDetails, CreatePaymentDetailsRequest, UpdatePaymentDetailsRequest } from "@/interfaces/PaymentDetails";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type PaymentDetailsApiRecord = Omit<PaymentDetails, "externalId"> & { externalId?: string };

const normalizePaymentDetails = (record: PaymentDetailsApiRecord): PaymentDetails => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
});

export const paymentDetailsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPaymentDetailsList: builder.query<PaymentDetails[], void>({
      query: () => "/paymentDetails/getAll",
      transformResponse: (response: ApiEnvelope<PaymentDetailsApiRecord[]>) => unwrapList(response).map(normalizePaymentDetails),
      providesTags: (result) => [
        { type: "PaymentDetails", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "PaymentDetails" as const, id: item.externalId })),
      ],
    }),

    getPaymentDetailsById: builder.query<PaymentDetails, string>({
      query: (externalId) => `/paymentDetails/getById/${externalId}`,
      transformResponse: (response: ApiEnvelope<PaymentDetailsApiRecord>) => normalizePaymentDetails(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "PaymentDetails", id: externalId }],
    }),

    createPaymentDetails: builder.mutation<PaymentDetails, CreatePaymentDetailsRequest>({
      query: (body) => ({
        url: "/paymentDetails/",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<PaymentDetailsApiRecord>) => normalizePaymentDetails(unwrapResponse(response)),
      invalidatesTags: [{ type: "PaymentDetails", id: "LIST" }],
    }),

    updatePaymentDetails: builder.mutation<PaymentDetails, { externalId: string; body: UpdatePaymentDetailsRequest }>({
      query: ({ externalId, body }) => ({
        url: `/paymentDetails/update/${externalId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<PaymentDetailsApiRecord>) => normalizePaymentDetails(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "PaymentDetails", id: externalId },
        { type: "PaymentDetails", id: "LIST" },
      ],
    }),

    deletePaymentDetails: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/paymentDetails/delete/${externalId}`,
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
  useCreatePaymentDetailsMutation,
  useUpdatePaymentDetailsMutation,
  useDeletePaymentDetailsMutation,
} = paymentDetailsApi;
