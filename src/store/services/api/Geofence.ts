import { api } from "../api";
import type { CreateGeofenceRequest, Geofence, UpdateGeofenceRequest } from "@/interfaces/Geofence";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type TypeRef = {
  id?: string | number;
  externalId?: string;
  geofType?: string;
  name?: string;
};

type GeofenceApiRecord = Omit<Partial<Geofence>, "externalId" | "latitude" | "longitude" | "type"> & {
  id?: string | number;
  externalId?: string;
  type?: string | number | TypeRef;
  latitude?: number[] | number | string;
  longitude?: number[] | number | string;
  transitTime?: string | number;
  radius?: string | number;
};

const coordinateArray = (value: GeofenceApiRecord["latitude"]): number[] => {
  const coordinates = Array.isArray(value) ? value : value == null ? [] : [value];
  return coordinates.flatMap((coordinate) => {
    if (typeof coordinate === "string" && !coordinate.trim()) return [];
    const parsed = Number(coordinate);
    return Number.isFinite(parsed) ? [parsed] : [];
  });
};

const typeId = (value: string | number | TypeRef | undefined): string => {
  if (value == null) return "";
  if (typeof value === "object") {
    return String(value.externalId ?? value.id ?? "");
  }
  return String(value);
};

const typeLabel = (value: string | number | TypeRef | undefined): string => {
  if (value == null || typeof value !== "object") return "";
  return String(value.geofType ?? value.name ?? "").trim();
};

const normalizeGeofence = (record: GeofenceApiRecord): Geofence => {
  const id = record.externalId ?? record.id ?? "";

  return {
    ...record,
    id: record.id ?? id,
    externalId: String(id),
    name: record.name ?? "",
    type: typeId(record.type),
    geofType: typeLabel(record.type) || record.geofType || "",
    assignType: record.assignType ?? "",
    geofenceCode: record.geofenceCode ?? "",
    transitTime: String(record.transitTime ?? ""),
    shapes: record.shapes ?? "",
    geoType: record.geoType ?? "",
    latitude: coordinateArray(record.latitude),
    longitude: coordinateArray(record.longitude),
    radius: record.radius == null || record.radius === "" ? 0 : Number(record.radius) || 0,
    status: record.status ?? "",
    reason: record.reason ?? "",
  };
};

export const geofenceApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getGeofences: builder.query<Geofence[], void>({
      query: () => "/geofence/getAll",
      transformResponse: (response: ApiEnvelope<GeofenceApiRecord[]>) =>
        unwrapList(response).map(normalizeGeofence),
      providesTags: (result) => [
        { type: "Geofences", id: "LIST" },
        ...(result ?? []).map((item) => ({
          type: "Geofences" as const,
          id: item.externalId,
        })),
      ],
    }),

    getGeofenceById: builder.query<Geofence, string>({
      query: (externalId) => `/geofence/getById/${encodeURIComponent(externalId)}`,
      transformResponse: (response: ApiEnvelope<GeofenceApiRecord>) => {
        const record = unwrapResponse(response);
        if (!record) throw new Error("Geofence API returned an empty record.");
        return normalizeGeofence(record);
      },
      providesTags: (_result, _error, externalId) => [
        { type: "Geofences", id: externalId },
      ],
    }),

    createGeofence: builder.mutation<void, CreateGeofenceRequest>({
      query: (body) => ({
        url: "/geofence/",
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Geofences", id: "LIST" }],
    }),

    updateGeofence: builder.mutation<
      void,
      { externalId: string; body: UpdateGeofenceRequest }
    >({
      query: ({ externalId, body }) => ({
        url: `/geofence/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body,
      }),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "Geofences", id: externalId },
        { type: "Geofences", id: "LIST" },
      ],
    }),

    deleteGeofence: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/geofence/delete/${encodeURIComponent(externalId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "Geofences", id: externalId },
        { type: "Geofences", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetGeofencesQuery,
  useLazyGetGeofenceByIdQuery,
  useCreateGeofenceMutation,
  useUpdateGeofenceMutation,
  useDeleteGeofenceMutation,
} = geofenceApi;
