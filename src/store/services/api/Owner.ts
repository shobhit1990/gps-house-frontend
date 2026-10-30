import { api } from "../api";
import { Status } from "@/enums/Status";
import { statusChangeBody } from "@/lib/statusPayload";
import type {
  CreateOwnerRequest,
  DeleteOwnerResponse,
  Owner,
  OwnerApiRecord,
  UpdateOwnerRequest,
  UpdateOwnerStatusRequest,
} from "@/interfaces/Owner";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

function normalizeStatus(status?: string): Status {
  const value = status?.toLowerCase();
  return Object.values(Status).includes(value as Status) ? (value as Status) : Status.ACTIVE;
}

function normalizeOwner(owner: OwnerApiRecord): Owner {
  return {
    id: owner.id,
    externalId: String(owner.externalId ?? owner.id),
    ownerName: owner.ownerName ?? "",
    status: normalizeStatus(owner.status),
    reason: owner.reason,
    createdAt: owner.createdAt,
    updatedAt: owner.updatedAt,
  };
}

export const ownerApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOwners: builder.query<Owner[], void>({
      query: () => "/owner/get-all",
      transformResponse: (response: ApiEnvelope<OwnerApiRecord[]>) => unwrapList(response).map(normalizeOwner),
      providesTags: (result) => [
        { type: "Owners", id: "LIST" },
        ...(result ?? []).map((owner) => ({ type: "Owners" as const, id: owner.externalId })),
      ],
    }),

    getOwnerById: builder.query<Owner, string>({
      query: (externalId) => `/owner/get-by-id/${externalId}`,
      transformResponse: (response: ApiEnvelope<OwnerApiRecord>) => normalizeOwner(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "Owners", id: externalId }],
    }),

    createOwner: builder.mutation<Owner, CreateOwnerRequest>({
      query: ({ ownerName }) => ({
        url: "/owner/create",
        method: "POST",
        body: { ownerName: ownerName },
      }),
      transformResponse: (response: ApiEnvelope<OwnerApiRecord>) => normalizeOwner(unwrapResponse(response)),
      invalidatesTags: [{ type: "Owners", id: "LIST" }],
    }),

    updateOwner: builder.mutation<Owner, UpdateOwnerRequest>({
      query: ({ externalId, ownerName }) => ({
        url: `/owner/update/${externalId}`,
        method: "PUT",
        body: { ownerName: ownerName },
      }),
      transformResponse: (response: ApiEnvelope<OwnerApiRecord>) => normalizeOwner(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Owners", id: externalId },
        { type: "Owners", id: "LIST" },
      ],
    }),

    updateOwnerStatus: builder.mutation<Owner, UpdateOwnerStatusRequest>({
      query: ({ externalId, status, reason }) => ({
        url: `/owner/update/${externalId}`,
        method: "PUT",
        body: statusChangeBody(status, reason),
      }),
      transformResponse: (response: ApiEnvelope<OwnerApiRecord>) => normalizeOwner(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Owners", id: externalId },
        { type: "Owners", id: "LIST" },
      ],
    }),

    deleteOwner: builder.mutation<DeleteOwnerResponse, string>({
      query: (externalId) => ({
        url: `/owner/delete/${externalId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "Owners", id: externalId },
        { type: "Owners", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetOwnersQuery,
  useGetOwnerByIdQuery,
  useCreateOwnerMutation,
  useUpdateOwnerMutation,
  useUpdateOwnerStatusMutation,
  useDeleteOwnerMutation,
} = ownerApi;
