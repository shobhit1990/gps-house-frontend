import { api } from "../api";
import { Status } from "@/enums/Status";
import type {
	CreateDeviceTypeRequest,
	DeleteDeviceTypeResponse,
	DeviceType,
	DeviceTypeApiRecord,
	UpdateDeviceTypeRequest,
	UpdateDeviceTypeStatusRequest,
} from "@/interfaces/Devicetype";
import { statusChangeBody } from "@/lib/statusPayload";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

function normalizeDeviceType(record: DeviceTypeApiRecord): DeviceType {
	const deviceName = record.deviceName ?? record.deviceTypeName ?? "";
	const status = record.status?.toLowerCase();
	return {
		id: record.id,
		externalId: String(record.externalId ?? record.id ?? ""),
		deviceName,
		deviceTypeName: deviceName,
		status: Object.values(Status).includes(status as Status) ? status as Status : Status.ACTIVE,
		reason: record.reason,
		createdAt: record.createdAt,
		updatedAt: record.updatedAt,
	};
}

function requireDeviceType(response: ApiEnvelope<DeviceTypeApiRecord>): DeviceTypeApiRecord {
	const record = unwrapResponse(response);
	if (!record) throw new Error("The device type response was empty.");
	return record;
}

export const deviceTypeApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getDeviceTypes: builder.query<DeviceType[], void>({
			query: () => "/deviceType/getAll",
			transformResponse: (response: ApiEnvelope<DeviceTypeApiRecord[]>) =>
				unwrapList(response).map(normalizeDeviceType),
			providesTags: (result) => [
				{ type: "DeviceTypes", id: "LIST" },
				...(result ?? []).map((item) => ({ type: "DeviceTypes" as const, id: item.externalId })),
				{ type: "Master", id: "DEVICE_TYPE" },
			],
		}),

		getDeviceTypeById: builder.query<DeviceType, string>({
			query: (externalId) => `/deviceType/getById/${encodeURIComponent(externalId)}`,
			transformResponse: (response: ApiEnvelope<DeviceTypeApiRecord>) =>
				normalizeDeviceType(requireDeviceType(response)),
			providesTags: (_result, _error, externalId) => [{ type: "DeviceTypes", id: externalId }],
		}),

		createDeviceType: builder.mutation<DeviceType, CreateDeviceTypeRequest>({
			query: (body) => ({
				url: "/deviceType/",
				method: "POST",
				body,
			}),
			transformResponse: (response: ApiEnvelope<DeviceTypeApiRecord>) =>
				normalizeDeviceType(requireDeviceType(response)),
			invalidatesTags: [
				{ type: "DeviceTypes", id: "LIST" },
				{ type: "Master", id: "DEVICE_TYPE" },
			],
		}),

		updateDeviceType: builder.mutation<DeviceType, UpdateDeviceTypeRequest>({
			query: ({ externalId, deviceName }) => ({
				url: `/deviceType/update/${encodeURIComponent(externalId)}`,
				method: "PUT",
				body: { deviceName },
			}),
			transformResponse: (response: ApiEnvelope<DeviceTypeApiRecord>) =>
				normalizeDeviceType(requireDeviceType(response)),
			invalidatesTags: (_result, _error, { externalId }) => [
				{ type: "DeviceTypes", id: externalId },
				{ type: "DeviceTypes", id: "LIST" },
				{ type: "Master", id: "DEVICE_TYPE" },
			],
		}),

		updateDeviceTypeStatus: builder.mutation<DeviceType, UpdateDeviceTypeStatusRequest>({
			query: ({ externalId, status, reason }) => ({
				url: `/deviceType/update/${encodeURIComponent(externalId)}`,
				method: "PUT",
				body: statusChangeBody(status, reason),
			}),
			transformResponse: (response: ApiEnvelope<DeviceTypeApiRecord>) =>
				normalizeDeviceType(requireDeviceType(response)),
			invalidatesTags: (_result, _error, { externalId }) => [
				{ type: "DeviceTypes", id: externalId },
				{ type: "DeviceTypes", id: "LIST" },
				{ type: "Master", id: "DEVICE_TYPE" },
			],
		}),

		deleteDeviceType: builder.mutation<DeleteDeviceTypeResponse, string>({
			query: (externalId) => ({
				url: `/deviceType/delete/${encodeURIComponent(externalId)}`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, externalId) => [
				{ type: "DeviceTypes", id: externalId },
				{ type: "DeviceTypes", id: "LIST" },
				{ type: "Master", id: "DEVICE_TYPE" },
			],
		}),
	}),
	overrideExisting: false,
});

export const {
	useGetDeviceTypesQuery,
	useGetDeviceTypeByIdQuery,
	useCreateDeviceTypeMutation,
	useUpdateDeviceTypeMutation,
	useUpdateDeviceTypeStatusMutation,
	useDeleteDeviceTypeMutation,
} = deviceTypeApi;
