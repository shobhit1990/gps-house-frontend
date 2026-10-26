import { api } from "../api";
import { Status } from "@/enums/Status";
import type { ownerMaster } from "@/interfaces/OwnerMaster";
import type { Language } from "@/interfaces/Language";
import type { Timezone } from "@/interfaces/Timezone";

type MasterListResponse<T> = T[] | { data?: T[] };

function unwrapMasterList<T>(response: MasterListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return response?.data ?? [];
}

function isActiveRecord<T extends { status?: Status }>(item: T): boolean {
  return !item.status || item.status === Status.ACTIVE;
}

export const masterApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getOwnerMaster: builder.query<ownerMaster[], void>({
      query: () => "/master/owner",
      transformResponse: (response: MasterListResponse<ownerMaster>) =>
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
  }),
  overrideExisting: false,
});

export const {
  useGetOwnerMasterQuery,
  useGetLanguagesQuery,
  useGetTimezonesQuery,
} = masterApi;
