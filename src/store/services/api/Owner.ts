import { createApi } from "@reduxjs/toolkit/query/react";
import { statusChangeBody } from "@/lib/statusPayload";
import { baseQueryWithInterceptor } from "../utils/baseQuery";

export type OwnerPayload = {
  ownerName: string;
};

export type OwnerResponse = {
  id: string | number;
  externalId: string;
  ownerName: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

const normalizeOwner = (owner: any): OwnerResponse => {
  const normalizedStatus =
    typeof owner?.status === "string"
      ? owner.status.charAt(0).toUpperCase() +
      owner.status.slice(1).toLowerCase()
      : owner?.status ?? "Active";

  return {
    id: owner?.id,
    externalId: owner.id,
    ownerName: owner?.name ?? "",
    status: normalizedStatus,
    createdAt: owner?.createdAt,
    updatedAt: owner?.updatedAt,
  };
};

export const ownersApi = createApi({
  reducerPath: "ownersApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Owners"],

  endpoints: (builder) => ({
    createOwner: builder.mutation<OwnerResponse, OwnerPayload>({
      query: (payload) => ({
        url: "/owner/create",
        method: "POST",
        body: payload,
      }),

      invalidatesTags: [{ type: "Owners", id: "LIST" }],
    }),

    getOwners: builder.query<OwnerResponse[], void>({
      query: () => ({
        url: "/owner/get-all",
        method: "GET",
      }),

      transformResponse: (response: any) => {
        const list = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response)
            ? response
            : [];

        return list.map(normalizeOwner);
      },

      providesTags: (result) =>
        result
          ? [
            { type: "Owners", id: "LIST" },

            ...result.map((owner) => ({
              type: "Owners" as const,
              id: owner .id,
            })),
          ]
          : [{ type: "Owners", id: "LIST" }],
    }),

    getOwnerById: builder.query<OwnerResponse, string>({
      query: (externalId) => ({
        url: `/owner/get-by-id/${externalId}`,
        method: "GET",
      }),

      transformResponse: (response: any) => {
        return normalizeOwner(response?.data ?? response);
      },

      providesTags: (result, error, externalId) => [
        {
          type: "Owners",
          id: externalId,
        },
      ],
    }),

    updateOwner: builder.mutation<
      OwnerResponse,
      {
        externalId: string;
        ownerName: string;
      }
    >({
      query: ({ externalId, ownerName }) => ({
        url: `/owner/update/${externalId}`,
        method: "PUT",
        body: {
          name: ownerName,
        },
      }),

      transformResponse: (response: any) => {
        return normalizeOwner(response?.data ?? response);
      },

      invalidatesTags: (result, error, { externalId }) => [
        {
          type: "Owners",
          id: externalId,
        },
        {
          type: "Owners",
          id: "LIST",
        },
      ],
    }),

    deleteOwner: builder.mutation<
      {
        success: boolean;
        id: string | number;
      },
      string
    >({
      query: (externalId) => ({
        url: `/owner/delete/${externalId}`,
        method: "DELETE",
      }),

      invalidatesTags: (result, error, externalId) => [
        {
          type: "Owners",
          id: externalId,
        },
        {
          type: "Owners",
          id: "LIST",
        },
      ],
    }),

    updateOwnerStatus: builder.mutation<
      OwnerResponse,
      {
        id: string | number;
        externalId: string;
        status: string;
        reason?: string;
      }
    >({
      query: ({ externalId, status, reason }) => ({
        url: `/owner/update/${externalId}`,
        method: "PUT",
        body: statusChangeBody(status, reason),
      }),

      invalidatesTags: (result, error, { id }) => [
        {
          type: "Owners",
          id,
        },
        {
          type: "Owners",
          id: "LIST",
        },
      ],
    }),
  }),
});

export const {
  useCreateOwnerMutation,
  useGetOwnersQuery,
  useGetOwnerByIdQuery,
  useUpdateOwnerMutation,
  useDeleteOwnerMutation,
  useUpdateOwnerStatusMutation,
} = ownersApi;