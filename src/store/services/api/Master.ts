import { api } from "../api";
import { Status } from "@/enums/Status";
import type { OwnerMaster } from "@/interfaces/OwnerMaster";
import type { Language } from "@/interfaces/Language";
import type { Timezone } from "@/interfaces/Timezone";
import type {
  ClientMaster,
  MasterOption,
  TechnicianMaster,
  TransporterMaster,
  VehicleMaster,
} from "@/interfaces/EntityMaster";

type MasterListResponse<T> = T[] | { data?: T[] };

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
      transformResponse: (response: MasterListResponse<Language>) =>
        unwrapMasterList(response).filter(isActiveRecord),
      providesTags: [{ type: "Master", id: "LANGUAGE" }],
    }),
    getTimezones: builder.query<Timezone[], void>({
      query: () => "/master/timeZone",
      transformResponse: (response: MasterListResponse<Timezone>) =>
        unwrapMasterList(response).filter(isActiveRecord),
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
} = masterApi;
