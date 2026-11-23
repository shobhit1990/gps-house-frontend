import { api } from "../api";
import { Status } from "@/enums/Status";
import { normalizeReason, statusChangeBody } from "@/lib/statusPayload";
import type {
  CreateLicenseRequest,
  License,
  LicenseApiRecord,
  UpdateLicenseRequest,
  UpdateLicenseStatusRequest,
} from "@/interfaces/License";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

function normalizeStatus(status?: string): Status {
  const value = status?.toLowerCase();
  return Object.values(Status).includes(value as Status) ? (value as Status) : Status.ACTIVE;
}

function normalizeLicense(record: LicenseApiRecord): License {
  return {
    id: record.id,
    externalId: String(record.externalId ?? record.id ?? ""),
    license: record.license ?? record.name ?? "",
    status: normalizeStatus(record.status),
    reason: normalizeReason(record.reason) || undefined,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

function requireLicense(response: ApiEnvelope<LicenseApiRecord>): LicenseApiRecord {
  const record = unwrapResponse(response);
  if (!record) throw new Error("The license response was empty.");
  return record;
}

export const licenseApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getLicenses: builder.query<License[], void>({
      query: () => "/license/getAll",
      transformResponse: (response: ApiEnvelope<LicenseApiRecord[]>) =>
        unwrapList(response).map(normalizeLicense),
      providesTags: (result) => [
        { type: "Licenses", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "Licenses" as const, id: item.externalId })),
        { type: "Master", id: "LICENSE" },
      ],
    }),

    getLicenseById: builder.query<License, string>({
      query: (externalId) => `/license/getById/${encodeURIComponent(externalId)}`,
      transformResponse: (response: ApiEnvelope<LicenseApiRecord>) =>
        normalizeLicense(requireLicense(response)),
      providesTags: (_result, _error, externalId) => [{ type: "Licenses", id: externalId }],
    }),

    createLicense: builder.mutation<License, CreateLicenseRequest>({
      query: (body) => ({
        url: "/license/create",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<LicenseApiRecord>) =>
        normalizeLicense(requireLicense(response)),
      invalidatesTags: [
        { type: "Licenses", id: "LIST" },
        { type: "Master", id: "LICENSE" },
      ],
    }),

    updateLicense: builder.mutation<License, UpdateLicenseRequest>({
      query: ({ externalId, license }) => ({
        url: `/license/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body: { license },
      }),
      transformResponse: (response: ApiEnvelope<LicenseApiRecord>) =>
        normalizeLicense(requireLicense(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Licenses", id: externalId },
        { type: "Licenses", id: "LIST" },
        { type: "Master", id: "LICENSE" },
      ],
    }),

    updateLicenseStatus: builder.mutation<License, UpdateLicenseStatusRequest>({
      query: ({ externalId, status, reason }) => ({
        url: `/license/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body: statusChangeBody(status, reason),
      }),
      transformResponse: (response: ApiEnvelope<LicenseApiRecord>) =>
        normalizeLicense(requireLicense(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Licenses", id: externalId },
        { type: "Licenses", id: "LIST" },
        { type: "Master", id: "LICENSE" },
      ],
    }),

    deleteLicense: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/license/delete/${encodeURIComponent(externalId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "Licenses", id: externalId },
        { type: "Licenses", id: "LIST" },
        { type: "Master", id: "LICENSE" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetLicensesQuery,
  useGetLicenseByIdQuery,
  useCreateLicenseMutation,
  useUpdateLicenseMutation,
  useUpdateLicenseStatusMutation,
  useDeleteLicenseMutation,
} = licenseApi;
