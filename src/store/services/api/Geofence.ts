import { api } from "../api";
import { toTransitTimeKey, toTransitTimeNumber } from "@/enums/TransitTime";
import type { CreateGeofenceRequest, Geofence, UpdateGeofenceRequest } from "@/interfaces/Geofence";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type TypeRef = {
  id?: string | number;
  externalId?: string;
  geofType?: string;
  name?: string;
};

type CoordinateInput = number[] | number | string | null | undefined;

type GeofenceApiRecord = Omit<Partial<Geofence>, "externalId" | "latitude" | "longitude" | "type" | "transitTime"> & {
  id?: string | number;
  externalId?: string;
  type?: string | number | TypeRef;
  latitude?: CoordinateInput;
  longitude?: CoordinateInput;
  transitTime?: string | number;
  radius?: string | number;
};

const toNumberList = (value: CoordinateInput): number[] => {
  if (value == null || value === "") return [];

  const parts = Array.isArray(value)
    ? value
    : typeof value === "string" && value.includes(",")
      ? value.split(",")
      : [value];

  return parts.flatMap((part) => {
    if (typeof part === "string" && !part.trim()) return [];
    const parsed = Number(part);
    return Number.isFinite(parsed) ? [parsed] : [];
  });
};

const toSingleNumber = (value: CoordinateInput): number | undefined => {
  const list = toNumberList(value);
  return list.length ? list[0] : undefined;
};

const typeId = (value: string | number | TypeRef | undefined): string => {
  if (value == null) return "";
  if (typeof value === "object") return String(value.externalId ?? value.id ?? "");
  return String(value);
};

const typeLabel = (value: string | number | TypeRef | undefined): string => {
  if (value == null || typeof value !== "object") return "";
  return String(value.geofType ?? value.name ?? "").trim();
};

const toRadius = (value: string | number | null | undefined): number => {
  if (value == null || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

/**
 * API body shape:
 * { name, type, assignType, transitTime: 7, shapes, geoType, latitude: 26.87, longitude: 81.02, radius: 500 }
 */
const sanitizeGeofencePayload = <T extends Partial<CreateGeofenceRequest>>(body: T): T => {
  const next = { ...body };

  if (body.transitTime != null && String(body.transitTime).trim() !== "") {
    next.transitTime = toTransitTimeNumber(body.transitTime) as T["transitTime"];
  }

  const latitude = toSingleNumber(body.latitude as CoordinateInput);
  const longitude = toSingleNumber(body.longitude as CoordinateInput);
  if (latitude != null) next.latitude = latitude as T["latitude"];
  if (longitude != null) next.longitude = longitude as T["longitude"];

  if (body.radius != null) {
    const radius = Number(body.radius);
    if (Number.isFinite(radius)) next.radius = radius as T["radius"];
  }

  return next;
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
    transitTime:
      record.transitTime != null && String(record.transitTime).trim()
        ? toTransitTimeKey(record.transitTime)
        : "",
    shapes: record.shapes ?? "",
    geoType: record.geoType ?? "",
    latitude: toNumberList(record.latitude),
    longitude: toNumberList(record.longitude),
    radius: toRadius(record.radius),
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
        ...(result ?? []).map((item) => ({ type: "Geofences" as const, id: item.externalId })),
      ],
    }),

    getGeofenceById: builder.query<Geofence, string>({
      query: (externalId) => `/geofence/getById/${encodeURIComponent(externalId)}`,
      transformResponse: (response: ApiEnvelope<GeofenceApiRecord>) => {
        const record = unwrapResponse(response);
        if (!record) throw new Error("Geofence API returned an empty record.");
        return normalizeGeofence(record);
      },
      providesTags: (_result, _error, externalId) => [{ type: "Geofences", id: externalId }],
    }),

    createGeofence: builder.mutation<void, CreateGeofenceRequest>({
      query: (body) => ({
        url: "/geofence",
        method: "POST",
        body: sanitizeGeofencePayload(body),
      }),
      invalidatesTags: [{ type: "Geofences", id: "LIST" }],
    }),

    updateGeofence: builder.mutation<void, { externalId: string; body: UpdateGeofenceRequest }>({
      query: ({ externalId, body }) => ({
        url: `/geofence/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body: sanitizeGeofencePayload(body),
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
