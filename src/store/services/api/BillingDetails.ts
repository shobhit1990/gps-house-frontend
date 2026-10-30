import { api } from "../api";
import type { BillingDetails, CreateBillingDetailsRequest, UpdateBillingDetailsRequest } from "@/interfaces/BillingDetails";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type BillingDetailsApiRecord = Omit<BillingDetails, "externalId"> & { externalId?: string };

const normalizeBillingDetails = (record: BillingDetailsApiRecord): BillingDetails => ({
  ...record,
  externalId: String(record?.externalId ?? record?.id ?? ""),
});

export const billingDetailsApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getBillingDetailsList: builder.query<BillingDetails[], void>({
      query: () => "/billingDetail/getAll",
      transformResponse: (response: ApiEnvelope<BillingDetailsApiRecord[]>) => unwrapList(response).map(normalizeBillingDetails),
      providesTags: (result) => [
        { type: "BillingDetails", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "BillingDetails" as const, id: item.externalId })),
      ],
    }),

    getBillingDetailsById: builder.query<BillingDetails, string>({
      query: (externalId) => `/billingDetail/getById/${externalId}`,
      transformResponse: (response: ApiEnvelope<BillingDetailsApiRecord>) => normalizeBillingDetails(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "BillingDetails", id: externalId }],
    }),

    createBillingDetails: builder.mutation<BillingDetails, CreateBillingDetailsRequest>({
      query: (body) => ({
        url: "/billingDetail",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<BillingDetailsApiRecord>) => normalizeBillingDetails(unwrapResponse(response)),
      invalidatesTags: [{ type: "BillingDetails", id: "LIST" }],
    }),

    updateBillingDetails: builder.mutation<BillingDetails, { externalId: string; body: UpdateBillingDetailsRequest }>({
      query: ({ externalId, body }) => ({
        url: `/billingDetail/update/${externalId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<BillingDetailsApiRecord>) => normalizeBillingDetails(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "BillingDetails", id: externalId },
        { type: "BillingDetails", id: "LIST" },
      ],
    }),

    deleteBillingDetails: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/billingDetail/delete/${externalId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "BillingDetails", id: externalId },
        { type: "BillingDetails", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetBillingDetailsListQuery,
  useGetBillingDetailsByIdQuery,
  useCreateBillingDetailsMutation,
  useUpdateBillingDetailsMutation,
  useDeleteBillingDetailsMutation,
} = billingDetailsApi;
