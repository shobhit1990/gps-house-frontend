import { api } from "../api";
import { Status } from "@/enums/Status";
import type { OwnerMaster } from "@/interfaces/OwnerMaster";
import type { Language } from "@/interfaces/Language";
import type { Timezone } from "@/interfaces/Timezone";
import type { DeviceMasterRecord, DeviceTypeMaster } from "@/interfaces/DeviceTypeMaster";
import type { RoleMasterRecord } from "@/interfaces/RoleManagement";
import type {
  AlertTypeMaster,
  ClientMaster,
  ExpenseTypeMaster,
  MasterOption,
  StateMaster,
  TechnicianMaster,
  TransporterMaster,
  VehicleMaster,
} from "@/interfaces/EntityMaster";

type MasterListResponse<T> = T[] | { data?: T[] };
type LanguageMasterRecord = Omit<Language, "language"> & {
  language?: string;
  languageName?: string;
  name?: string;
};
type TimezoneMasterRecord = Omit<Timezone, "timezone"> & {
  timezone?: string;
  timeZone?: string;
  timezoneName?: string;
  timeZoneName?: string;
  name?: string;
};

function unwrapMasterList<T>(response: MasterListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response?.data ?? [];
}

function isActiveRecord<T extends { status?: Status }>(item: T): boolean {
  return !item.status || item.status === Status.ACTIVE;
}

/** Turns master records into unique, non-empty `{ id, name }` dropdown options. */
function toMasterOptions<T extends { id?: string | number; externalId?: string; status?: Status }>(
  response: MasterListResponse<T>,
  getName: (item: T) => string | undefined,
): MasterOption[] {
  const seen = new Set<string>();
  return unwrapMasterList(response)
    .filter(isActiveRecord)
    .flatMap((item) => {
      const name = getName(item)?.trim();
      if (!name || seen.has(name)) return [];
      seen.add(name);
      return [{ id: String(item.externalId ?? item.id ?? name), externalId: item.externalId, name }];
    });
}

export const masterApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOwnerMaster: builder.query<OwnerMaster[], void>({
      query: () => "/master/owner",
      transformResponse: (response: MasterListResponse<OwnerMaster>) =>
        unwrapMasterList(response).filter(isActiveRecord),
      providesTags: [{ type: "Master", id: "OWNER" }],
    }),
    getLanguages: builder.query<Language[], void>({
      query: () => "/master/language",
      transformResponse: (response: MasterListResponse<LanguageMasterRecord>) =>
        unwrapMasterList(response)
          .filter(isActiveRecord)
          .flatMap((item) => {
            const language = item.language ?? item.languageName ?? item.name;
            return language?.trim() ? [{ ...item, language: language.trim() }] : [];
          }),
      providesTags: [{ type: "Master", id: "LANGUAGE" }],
    }),
    getTimezones: builder.query<Timezone[], void>({
      query: () => "/master/timeZone",
      transformResponse: (response: MasterListResponse<TimezoneMasterRecord>) =>
        unwrapMasterList(response)
          .filter(isActiveRecord)
          .flatMap((item) => {
            const timezone = item.timezone ?? item.timeZone ?? item.timezoneName ?? item.timeZoneName ?? item.name;
            return timezone?.trim() ? [{ ...item, timezone: timezone.trim() }] : [];
          }),
      providesTags: [{ type: "Master", id: "TIMEZONE" }],
    }),
    getClientMaster: builder.query<MasterOption[], void>({
      query: () => "/master/client",
      transformResponse: (response: MasterListResponse<ClientMaster>) =>
        toMasterOptions(response, (item) => item.clientName ?? item.company ?? item.name ?? item.username),
      providesTags: [{ type: "Master", id: "CLIENT" }, { type: "Clients", id: "LIST" }],
    }),
    getTransporterMaster: builder.query<MasterOption[], void>({
      query: () => "/master/transporter",
      transformResponse: (response: MasterListResponse<TransporterMaster>) =>
        toMasterOptions(response, (item) => item.transporterName ?? item.company ?? item.name ?? item.username),
      providesTags: [{ type: "Master", id: "TRANSPORTER" }, { type: "Transporters", id: "LIST" }],
    }),
    getTechnicianMaster: builder.query<MasterOption[], void>({
      query: () => "/master/technician",
      transformResponse: (response: MasterListResponse<TechnicianMaster>) =>
        toMasterOptions(response, (item) => item.technicianName ?? item.name ?? item.userName ?? item.username),
      providesTags: [{ type: "Master", id: "TECHNICIAN" }, { type: "Technicians", id: "LIST" }],
    }),
    getVehicleMaster: builder.query<MasterOption[], void>({
      query: () => "/master/vehicle",
      transformResponse: (response: MasterListResponse<VehicleMaster>) =>
        toMasterOptions(response, (item) => item.vehicle ?? item.vehicleNo ?? item.vehicleName ?? item.name),
      providesTags: [{ type: "Master", id: "VEHICLE" }, { type: "Vehicles", id: "LIST" }],
    }),
    getDeviceTypeMaster: builder.query<DeviceTypeMaster[], void>({
      query: () => "/master/deviceType",
      transformResponse: (response: MasterListResponse<DeviceTypeMaster>) =>
        unwrapMasterList(response).filter(isActiveRecord),
      providesTags: [{ type: "Master", id: "DEVICE_TYPE" }, { type: "DeviceTypes", id: "LIST" }],
    }),
    getDeviceMaster: builder.query<MasterOption[], void>({
      query: () => "/master/device",
      transformResponse: (response: MasterListResponse<DeviceMasterRecord>) =>
        toMasterOptions(response, (item) => item.imei ?? item.deviceName ?? item.deviceTypeName),
      providesTags: [{ type: "Master", id: "DEVICE" }, { type: "Devices", id: "LIST" }],
    }),
    getRoleMaster: builder.query<MasterOption[], void>({
      query: () => "/master/role",
      transformResponse: (response: MasterListResponse<RoleMasterRecord>) =>
        toMasterOptions(response, (item) => item.name ?? item.roleCode),
      providesTags: [{ type: "Master", id: "ROLE" }, { type: "Roles", id: "MASTER" }],
    }),
    getStateMaster: builder.query<MasterOption[], void>({
      query: () => "/master/state",
      transformResponse: (response: MasterListResponse<StateMaster>) =>
        toMasterOptions(response, (item) => item.stateName ?? item.name),
      providesTags: [{ type: "Master", id: "STATE" }],
    }),
    getAlertTypeMaster: builder.query<MasterOption[], void>({
      query: () => "/master/alert",
      transformResponse: (response: MasterListResponse<AlertTypeMaster>) =>
        toMasterOptions(response, (item) => item.alertType ?? item.alertName ?? item.name),
      providesTags: [{ type: "Master", id: "ALERT_TYPE" }],
    }),
    getExpenseTypeMaster: builder.query<MasterOption[], void>({
      query: () => "/master/expenseType",
      transformResponse: (response: MasterListResponse<ExpenseTypeMaster>) =>
        toMasterOptions(response, (item) => item.expenseType ?? item.expenseName ?? item.name),
      providesTags: [{ type: "Master", id: "EXPENSE_TYPE" }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetOwnerMasterQuery,
  useGetLanguagesQuery,
  useGetTimezonesQuery,
  useGetClientMasterQuery,
  useGetTransporterMasterQuery,
  useGetTechnicianMasterQuery,
  useGetVehicleMasterQuery,
  useGetDeviceTypeMasterQuery,
  useGetDeviceMasterQuery,
  useGetRoleMasterQuery,
  useGetStateMasterQuery,
  useGetAlertTypeMasterQuery,
  useGetExpenseTypeMasterQuery,
} = masterApi;
