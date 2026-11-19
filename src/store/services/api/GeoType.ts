import { api } from "../api";
import { Status } from "@/enums/Status";
import type {
	CreateGeoTypeRequest,
	DeleteGeoTypeResponse,
	GeoType,
	GeoTypeApiRecord,
	UpdateGeoTypeRequest,
	UpdateGeoTypeStatusRequest,
} from "@/interfaces/GeoType";
import { normalizeReason, statusChangeBody } from "@/lib/statusPayload";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

function normalizeGeoType(record: GeoTypeApiRecord): GeoType {
	const status = record.status?.toLowerCase();
	return {
		id: record.id,
		externalId: String(record.externalId ?? record.id ?? ""),
		geofType: record.geofType ?? record.name ?? "",
		status: Object.values(Status).includes(status as Status) ? (status as Status) : Status.ACTIVE,
		reason: normalizeReason(record.reason) || undefined,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
	};
}

function requireGeoType(response: ApiEnvelope<GeoTypeApiRecord>): GeoTypeApiRecord {
	const record = unwrapResponse(response);
	if (!record) throw new Error("The geo type response was empty.");
	return record;
}

export const geoTypeApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getGeoTypes: builder.query<GeoType[], void>({
			query: () => "/geofType/getAll",
			transformResponse: (response: ApiEnvelope<GeoTypeApiRecord[]>) =>
				unwrapList(response).map(normalizeGeoType),
			providesTags: (result) => [
				{ type: "GeoTypes", id: "LIST" },
				...(result ?? []).map((item) => ({ type: "GeoTypes" as const, id: item.externalId })),
				{ type: "Master", id: "GEOF_TYPE" },
			],
		}),

		getGeoTypeById: builder.query<GeoType, string>({
			query: (externalId) => `/geofType/getById/${encodeURIComponent(externalId)}`,
			transformResponse: (response: ApiEnvelope<GeoTypeApiRecord>) =>
				normalizeGeoType(requireGeoType(response)),
			providesTags: (_result, _error, externalId) => [{ type: "GeoTypes", id: externalId }],
		}),

		createGeoType: builder.mutation<GeoType, CreateGeoTypeRequest>({
			query: (body) => ({
				url: "/geofType/create",
				method: "POST",
				body,
			}),
			transformResponse: (response: ApiEnvelope<GeoTypeApiRecord>) =>
				normalizeGeoType(requireGeoType(response)),
			invalidatesTags: [
				{ type: "GeoTypes", id: "LIST" },
				{ type: "Master", id: "GEOF_TYPE" },
			],
		}),

		updateGeoType: builder.mutation<GeoType, UpdateGeoTypeRequest>({
			query: ({ externalId, geofType }) => ({
				url: `/geofType/update/${encodeURIComponent(externalId)}`,
				method: "PUT",
				body: { geofType },
			}),
			transformResponse: (response: ApiEnvelope<GeoTypeApiRecord>) =>
				normalizeGeoType(requireGeoType(response)),
			invalidatesTags: (_result, _error, { externalId }) => [
				{ type: "GeoTypes", id: externalId },
				{ type: "GeoTypes", id: "LIST" },
				{ type: "Master", id: "GEOF_TYPE" },
			],
		}),

		updateGeoTypeStatus: builder.mutation<GeoType, UpdateGeoTypeStatusRequest>({
			query: ({ externalId, status, reason }) => ({
				url: `/geofType/update/${encodeURIComponent(externalId)}`,
				method: "PUT",
				body: statusChangeBody(status, reason),
			}),
			transformResponse: (response: ApiEnvelope<GeoTypeApiRecord>) =>
				normalizeGeoType(requireGeoType(response)),
			invalidatesTags: (_result, _error, { externalId }) => [
				{ type: "GeoTypes", id: externalId },
				{ type: "GeoTypes", id: "LIST" },
				{ type: "Master", id: "GEOF_TYPE" },
			],
		}),

		deleteGeoType: builder.mutation<DeleteGeoTypeResponse, string>({
			query: (externalId) => ({
				url: `/geofType/delete/${encodeURIComponent(externalId)}`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, externalId) => [
				{ type: "GeoTypes", id: externalId },
				{ type: "GeoTypes", id: "LIST" },
				{ type: "Master", id: "GEOF_TYPE" },
			],
		}),
	}),
	overrideExisting: false,
});

export const {
	useGetGeoTypesQuery,
	useGetGeoTypeByIdQuery,
	useCreateGeoTypeMutation,
	useUpdateGeoTypeMutation,
	useUpdateGeoTypeStatusMutation,
	useDeleteGeoTypeMutation,
} = geoTypeApi;
