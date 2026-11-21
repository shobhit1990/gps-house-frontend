import { api } from "../api";
import type { JobSheet, CreateJobSheetRequest, UpdateJobSheetRequest } from "@/interfaces/JobSheet";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type RefLike =
  | string
  | {
      externalId?: string;
      id?: string | number;
      name?: string;
      userName?: string;
      username?: string;
      companyName?: string;
      vehicle?: string;
      vehicleNo?: string;
      vehicleName?: string;
      transporter?: RefLike;
    }
  | null
  | undefined;

type JobSheetApiRecord = Omit<JobSheet, "externalId" | "vehicle" | "technician"> & {
  externalId?: string;
  vehicle?: RefLike;
  technician?: RefLike;
  contactPerson?: string;
  contactPersonName?: string;
};

const asExternalId = (value: RefLike): string => {
  if (value == null || value === "") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  const id = value.externalId ?? value.id;
  return id == null || id === "" ? "" : String(id);
};

const asTechnicianName = (value: RefLike): string => {
  if (!value || typeof value === "string" || typeof value === "number") return "";
  return (
    value.name?.trim() ||
    value.userName?.trim() ||
    value.username?.trim() ||
    value.companyName?.trim() ||
    ""
  );
};

const asVehicleNo = (value: RefLike): string => {
  if (!value) return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  return value.vehicle?.trim() || value.vehicleNo?.trim() || value.vehicleName?.trim() || value.name?.trim() || "";
};

const asTransporterName = (value: RefLike): string => {
  if (!value || typeof value === "string" || typeof value === "number") return "";
  const transporter = value.transporter;
  if (!transporter) return "";
  if (typeof transporter === "string" || typeof transporter === "number") return String(transporter);
  return (
    transporter.name?.trim() ||
    transporter.userName?.trim() ||
    transporter.username?.trim() ||
    transporter.companyName?.trim() ||
    ""
  );
};

const normalizeJobSheet = (record: JobSheetApiRecord | undefined): JobSheet => {
  const safe = record ?? ({} as JobSheetApiRecord);
  return {
    ...safe,
    id: safe.id ?? safe.externalId ?? "",
    externalId: String(safe.externalId ?? safe.id ?? ""),
    vehicle: asExternalId(safe.vehicle),
    technician: asExternalId(safe.technician),
    vehicleNo: asVehicleNo(safe.vehicle) || safe.vehicleNo,
    technicianName: asTechnicianName(safe.technician) || safe.technicianName,
    transporterName: asTransporterName(safe.vehicle) || safe.transporterName,
    contactPersonName: String(safe.contactPersonName ?? safe.contactPerson ?? "").trim(),
    phone: safe.phone != null ? String(safe.phone) : "",
    orderNo: safe.orderNo ?? "",
    instruction: safe.instruction ?? "",
    status: safe.status,
    reason: safe.reason,
    createdAt: safe.createdAt,
    updatedAt: safe.updatedAt,
  };
};

export const jobSheetApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getJobSheets: builder.query<JobSheet[], void>({
      query: () => "/jobsheet/getAll",
      transformResponse: (response: ApiEnvelope<JobSheetApiRecord[]>) => unwrapList(response).map(normalizeJobSheet),
      providesTags: (result) => [
        { type: "JobSheets", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "JobSheets" as const, id: item.externalId })),
      ],
    }),

    getJobSheetById: builder.query<JobSheet, string>({
      query: (externalId) => `/jobsheet/getById/${externalId}`,
      transformResponse: (response: ApiEnvelope<JobSheetApiRecord>) => normalizeJobSheet(unwrapResponse(response)),
      providesTags: (_result, _error, externalId) => [{ type: "JobSheets", id: externalId }],
    }),

    createJobSheet: builder.mutation<JobSheet, CreateJobSheetRequest>({
      query: (body) => ({
        url: "/jobsheet",
        method: "POST",
        body,
      }),
      transformResponse: (response: ApiEnvelope<JobSheetApiRecord>) => normalizeJobSheet(unwrapResponse(response)),
      invalidatesTags: [{ type: "JobSheets", id: "LIST" }],
    }),

    updateJobSheet: builder.mutation<JobSheet, { externalId: string; body: UpdateJobSheetRequest }>({
      query: ({ externalId, body }) => ({
        url: `/jobsheet/update/${externalId}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<JobSheetApiRecord>) => normalizeJobSheet(unwrapResponse(response)),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "JobSheets", id: externalId },
        { type: "JobSheets", id: "LIST" },
      ],
    }),

    deleteJobSheet: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/jobsheet/delete/${externalId}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "JobSheets", id: externalId },
        { type: "JobSheets", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetJobSheetsQuery,
  useGetJobSheetByIdQuery,
  useCreateJobSheetMutation,
  useUpdateJobSheetMutation,
  useDeleteJobSheetMutation,
} = jobSheetApi;
