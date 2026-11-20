import { api } from "../api";
import type { CreatePolicyRequest, Policy, UpdatePolicyRequest } from "@/interfaces/Policy";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type PolicyApiRecord = Omit<Policy, "externalId" | "body"> & {
  externalId?: string;
  body?: string;
  content?: string;
  policy?: string;
  description?: string;
};

const normalizePolicy = (record: PolicyApiRecord | undefined): Policy => {
  const safe = record ?? ({} as PolicyApiRecord);
  return {
    ...safe,
    id: safe.id ?? safe.externalId ?? "",
    externalId: String(safe.externalId ?? safe.id ?? ""),
    body: safe.body ?? safe.content ?? safe.policy ?? safe.description ?? "",
    status: safe.status,
    reason: safe.reason,
    createdAt: safe.createdAt,
    updatedAt: safe.updatedAt,
  };
};

export const policyApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getPolicies: builder.query<Policy[], void>({
      query: () => "/policy/getAll",
      transformResponse: (response: ApiEnvelope<PolicyApiRecord[]>) =>
        unwrapList(response).map(normalizePolicy),
      providesTags: (result) => [
        { type: "Policies", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "Policies" as const, id: item.externalId })),
      ],
    }),

    getPolicyById: builder.query<Policy, string>({
      query: (externalId) => `/policy/getById/${encodeURIComponent(externalId)}`,
      transformResponse: (response: ApiEnvelope<PolicyApiRecord>) =>
        normalizePolicy(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "Policies", id: externalId }],
    }),

    createPolicy: builder.mutation<Policy, CreatePolicyRequest>({
      query: (body) => ({
        url: "/policy/create",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<PolicyApiRecord>) =>
        normalizePolicy(unwrapResponse(response)),
      invalidatesTags: [{ type: "Policies", id: "LIST" }],
    }),

    updatePolicy: builder.mutation<Policy, { externalId: string; body: UpdatePolicyRequest }>({
      query: ({ externalId, body }) => ({
        url: `/policy/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<PolicyApiRecord>) =>
        normalizePolicy(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Policies", id: externalId },
        { type: "Policies", id: "LIST" },
      ],
    }),

    deletePolicy: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/policy/delete/${encodeURIComponent(externalId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "Policies", id: externalId },
        { type: "Policies", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetPoliciesQuery,
  useGetPolicyByIdQuery,
  useCreatePolicyMutation,
  useUpdatePolicyMutation,
  useDeletePolicyMutation,
} = policyApi;
