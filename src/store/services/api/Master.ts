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
  GeofTypeMaster,
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

function isActiveRecord<T extends { status?: Status | string; active?: boolean }>(item: T): boolean {
  if (typeof item.active === "boolean") return item.active;
  if (!item.status) return true;
  return String(item.status).trim().toLowerCase() === Status.ACTIVE;
}

const masterRefId = (value: unknown): string | undefined => {
  if (value == null || value === "") return undefined;
  if (typeof value === "string" || typeof value === "number") {
    const text = String(value).trim();
    return text || undefined;
  }
  if (typeof value === "object") {
    const record = value as { externalId?: string | number; id?: string | number };
    const text = String(record.externalId ?? record.id ?? "").trim();
    return text || undefined;
  }
  return undefined;
};

/** Turns master records into unique, non-empty `{ id, name }` dropdown options.
 *  Dedupes by id (not display name) so two clients with the same company still appear. */
function toMasterOptions<T extends { id?: string | number; externalId?: string; status?: Status | string; active?: boolean }>(
  response: MasterListResponse<T>,
  getName: (item: T) => string | undefined,
  getExtra?: (item: T) => Partial<MasterOption> | undefined,
  options?: { includeInactive?: boolean },
): MasterOption[] {
  const seen = new Set<string>();
  return unwrapMasterList(response)
    .filter((item) => (options?.includeInactive ? true : isActiveRecord(item)))
    .flatMap((item) => {
      const name = getName(item)?.trim();
      if (!name) return [];
      const id = String(item.externalId ?? item.id ?? name);
      if (seen.has(id)) return [];
      seen.add(id);
      const extra = getExtra?.(item);
      return [{ id, externalId: item.externalId, name, ...extra }];
    });
}

const asTrimmedText = (value: unknown): string | undefined => {
  if (value == null || value === "") return undefined;
  return String(value).trim() || undefined;
};

/** Client dropdowns show only login `userName` (e.g. ravi / roshni). */
function clientMasterLabel(item: ClientMaster): string | undefined {
  return asTrimmedText(
    item.userName ??
    item.name ??
    item.owner_name
  );
}

/** Transporter dropdown: username first, then company — e.g. `shobhit (GPS House)`. */
function transporterMasterLabel(item: TransporterMaster): string | undefined {
  const username = asTrimmedText(
    item.userName ??
    item.username ??
    item.name ??
    item.transporterName,
  );
  const company = asTrimmedText(
    item.companyName ??
    item.company ??
    item.transporterName,
  );
  if (username && company && username !== company) return `${username} (${company})`;
  return username || company || undefined;
}

/** Extra match keys — QA often stores transporter.client as name/username, not UUID. */
function clientMasterExtra(item: ClientMaster): Partial<MasterOption> | undefined {
  const aliases = [
    item.externalId,
    item.id != null ? String(item.id) : undefined,
    item.userName,
    item.name,
    item.owner_name,
  ]
    .map((value) => asTrimmedText(value))
    .filter((value): value is string => Boolean(value));
  const unique = Array.from(new Set(aliases.map((value) => value.toLowerCase())));
  return unique.length > 0 ? { aliases: unique } : undefined;
}

function mapTransporterMaster(response: MasterListResponse<TransporterMaster>): MasterOption[] {
  return toMasterOptions(
    response,
    transporterMasterLabel,
    (item) => {
      const clientRef = masterRefId(item.client) ?? asTrimmedText(item.client);
      return clientRef && clientRef !== "[object Object]" ? { clientRef } : undefined;
    },
    { includeInactive: true },
  );
}

function mapClientMaster(response: MasterListResponse<ClientMaster>): MasterOption[] {
  return toMasterOptions(response, clientMasterLabel, clientMasterExtra, { includeInactive: true });
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
      // Include inactive too — API returns them and dropdowns need every client username.
      transformResponse: (response: MasterListResponse<ClientMaster>) => mapClientMaster(response),
      providesTags: [{ type: "Master", id: "CLIENT" }, { type: "Clients", id: "LIST" }],
    }),
    getTransporterMaster: builder.query<MasterOption[], { client?: string } | void>({
      /** Pass `client` so `/master/transporter?client=<id>` returns that client's transporters. */
      query: (arg) => {
        const client =
          typeof arg === "object" && arg?.client ? String(arg.client).trim() : "";
        return {
          url: "/master/transporter",
          ...(client ? { params: { client } } : {}),
        };
      },
      transformResponse: (response: MasterListResponse<TransporterMaster>) =>
        mapTransporterMaster(response),
      providesTags: (_result, _error, arg) => [
        {
          type: "Master",
          id:
            typeof arg === "object" && arg?.client
              ? `TRANSPORTER-${arg.client}`
              : "TRANSPORTER",
        },
        { type: "Transporters", id: "LIST" },
      ],
    }),
    getTechnicianMaster: builder.query<MasterOption[], void>({
      query: () => "/master/technician",
      transformResponse: (response: MasterListResponse<TechnicianMaster>) => {
        // Keep inactive technicians too — QA/create often saves status "inactive",
        // and JobSheet / Payment dropdowns would otherwise stay empty.
        const seen = new Set<string>();
        return unwrapMasterList(response).flatMap((item) => {
          const name = (
            item.technicianName ??
            item.name ??
            item.userName ??
            item.username ??
            item.companyName
          )?.trim();
          if (!name || seen.has(name)) return [];
          seen.add(name);
          return [{ id: String(item.externalId ?? item.id ?? name), externalId: item.externalId, name }];
        });
      },
      providesTags: [{ type: "Master", id: "TECHNICIAN" }, { type: "Technicians", id: "LIST" }],
    }),
    getVehicleMaster: builder.query<MasterOption[], void>({
      query: () => "/master/vehicle",
      // Include inactive — QA/local often marks vehicles inactive; dropdowns still need them.
      transformResponse: (response: MasterListResponse<VehicleMaster>) =>
        toMasterOptions(
          response,
          (item) => item.vehicle ?? item.vehicleNo ?? item.vehicleName ?? item.name,
          (item) => {
            const clientId = masterRefId(item.client);
            const transporterId = masterRefId(item.transporter);
            return {
              ...(clientId ? { clientId } : {}),
              ...(transporterId ? { transporterId } : {}),
            };
          },
          { includeInactive: true },
        ),
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
        toMasterOptions(response, (item) => item.expenseName ?? item.expenseType ?? item.name),
      providesTags: [{ type: "Master", id: "EXPENSE_TYPE" }, { type: "ExpenseTypes", id: "LIST" }],
    }),
    getGeofTypeMaster: builder.query<MasterOption[], void>({
      query: () => "/master/geofType",
      transformResponse: (response: MasterListResponse<GeofTypeMaster>) =>
        toMasterOptions(
          response,
          (item) => item.geofType ?? item.name ?? item.geofTypeName ?? item.typeName ?? item.geofenceTypeName,
        ),
      providesTags: [{ type: "Master", id: "GEOF_TYPE" }, { type: "GeoTypes", id: "LIST" }],
    }),
  }),
  overrideExisting: false,
});

/**
 * RTK void hooks need `undefined` as first arg for TypeScript.
 * These thin wrappers keep normal `useX()` calls and preserve `data` types.
 */
export const useGetOwnerMasterQuery = (
  options?: Parameters<typeof masterApi.useGetOwnerMasterQuery>[1],
) => masterApi.useGetOwnerMasterQuery(undefined, options);

export const useGetLanguagesQuery = (
  options?: Parameters<typeof masterApi.useGetLanguagesQuery>[1],
) => masterApi.useGetLanguagesQuery(undefined, options);

export const useGetTimezonesQuery = (
  options?: Parameters<typeof masterApi.useGetTimezonesQuery>[1],
) => masterApi.useGetTimezonesQuery(undefined, options);

export const useGetClientMasterQuery = (
  options?: Parameters<typeof masterApi.useGetClientMasterQuery>[1],
) => masterApi.useGetClientMasterQuery(undefined, options);

export const useGetTransporterMasterQuery = (
  arg?: { client?: string },
  options?: Parameters<typeof masterApi.useGetTransporterMasterQuery>[1],
) => masterApi.useGetTransporterMasterQuery(arg, options);

export const useGetTechnicianMasterQuery = (
  options?: Parameters<typeof masterApi.useGetTechnicianMasterQuery>[1],
) => masterApi.useGetTechnicianMasterQuery(undefined, options);

export const useGetVehicleMasterQuery = (
  options?: Parameters<typeof masterApi.useGetVehicleMasterQuery>[1],
) => masterApi.useGetVehicleMasterQuery(undefined, options);

export const useGetDeviceTypeMasterQuery = (
  options?: Parameters<typeof masterApi.useGetDeviceTypeMasterQuery>[1],
) => masterApi.useGetDeviceTypeMasterQuery(undefined, options);

export const useGetDeviceMasterQuery = (
  options?: Parameters<typeof masterApi.useGetDeviceMasterQuery>[1],
) => masterApi.useGetDeviceMasterQuery(undefined, options);

export const useGetRoleMasterQuery = (
  options?: Parameters<typeof masterApi.useGetRoleMasterQuery>[1],
) => masterApi.useGetRoleMasterQuery(undefined, options);

export const useGetStateMasterQuery = (
  options?: Parameters<typeof masterApi.useGetStateMasterQuery>[1],
) => masterApi.useGetStateMasterQuery(undefined, options);

export const useGetAlertTypeMasterQuery = (
  options?: Parameters<typeof masterApi.useGetAlertTypeMasterQuery>[1],
) => masterApi.useGetAlertTypeMasterQuery(undefined, options);

export const useGetExpenseTypeMasterQuery = (
  options?: Parameters<typeof masterApi.useGetExpenseTypeMasterQuery>[1],
) => masterApi.useGetExpenseTypeMasterQuery(undefined, options);

export const useGetGeofTypeMasterQuery = (
  options?: Parameters<typeof masterApi.useGetGeofTypeMasterQuery>[1],
) => masterApi.useGetGeofTypeMasterQuery(undefined, options);
