import { api } from "../api";
import type { CreateDeviceRequest, Device, DeviceInventoryRecord, UpdateDeviceRequest } from "@/interfaces/AddDevice";
import { Status } from "@/enums/Status";
import { normalizeReason, statusChangeBody } from "@/lib/statusPayload";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type DeviceApiRecord = Omit<Device, "externalId"> & {
	externalId?: string;
	status?: string | null;
	reason?: string | null;
	active?: boolean | null;
};

function requireResponse<T>(response: ApiEnvelope<T>, resource: string): T {
	const record = unwrapResponse(response);
	if (!record) throw new Error(`The ${resource} response was empty.`);
	return record;
}

const isInactive = (record: DeviceApiRecord): boolean => {
	const status = String(record.status ?? "").trim().toLowerCase();
	if (status === Status.INACTIVE || status === "inactive") return true;
	if (status === Status.ACTIVE || status === "active") return false;
	return record.active === false;
};

const normalizeDevice = (record: DeviceApiRecord): Device => {
	const inactive = isInactive(record);
	return {
		...record,
		externalId: String(record.externalId ?? record.id ?? ""),
		active: !inactive,
		status: inactive ? Status.INACTIVE : Status.ACTIVE,
		reason: normalizeReason(record.reason),
	};
};

export const deviceApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getDevices: builder.query<Device[], void>({
			query: () => "/device/getAll",
			transformResponse: (response: ApiEnvelope<DeviceApiRecord[]>) =>
				unwrapList(response).map(normalizeDevice),
			providesTags: (result) => [
				{ type: "Devices", id: "LIST" },
				...(result ?? []).map((device) => ({ type: "Devices" as const, id: device.externalId })),
			],
		}),

		getDeviceById: builder.query<Device, string>({
			query: (externalId) => `/device/getById/${encodeURIComponent(externalId)}`,
			transformResponse: (response: ApiEnvelope<DeviceApiRecord>) =>
				normalizeDevice(requireResponse(response, "device")),
			providesTags: (_result, _error, externalId) => [{ type: "Devices", id: externalId }],
		}),

		createDevice: builder.mutation<Device, CreateDeviceRequest>({
			query: (body) => ({
				url: "/device",
				method: "POST",
				body,
			}),
			transformResponse: (response: ApiEnvelope<DeviceApiRecord>) =>
				normalizeDevice(requireResponse(response, "device")),
			invalidatesTags: [{ type: "Devices", id: "LIST" }],
		}),

		updateDevice: builder.mutation<Device, { externalId: string; body: UpdateDeviceRequest }>({
			query: ({ externalId, body }) => ({
				url: `/device/update/${encodeURIComponent(externalId)}`,
				method: "PUT",
				body,
			}),
			transformResponse: (response: ApiEnvelope<DeviceApiRecord>) =>
				normalizeDevice(requireResponse(response, "device")),
			invalidatesTags: (_result, _error, { externalId }) => [
				{ type: "Devices", id: externalId },
				{ type: "Devices", id: "LIST" },
			],
		}),

		updateDeviceStatus: builder.mutation<
			Device,
			{ externalId: string; status: Status; reason?: string }
		>({
			query: ({ externalId, status, reason }) => ({
				url: `/device/update/${encodeURIComponent(externalId)}`,
				method: "PUT",
				/** Backend list/UI rely on `active` as well as `status`. */
				body: statusChangeBody(status, reason, {
					active: status === Status.ACTIVE,
					...(reason?.trim() ? { reason: reason.trim() } : {}),
				}),
			}),
			transformResponse: (response: ApiEnvelope<DeviceApiRecord>) =>
				normalizeDevice(requireResponse(response, "device")),
			invalidatesTags: (_result, _error, { externalId }) => [
				{ type: "Devices", id: externalId },
				{ type: "Devices", id: "LIST" },
			],
		}),

		deleteDevice: builder.mutation<void, string>({
			query: (externalId) => ({
				url: `/device/delete/${encodeURIComponent(externalId)}`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, externalId) => [
				{ type: "Devices", id: externalId },
				{ type: "Devices", id: "LIST" },
			],
		}),

		getAvailableDeviceInventory: builder.query<DeviceInventoryRecord[], void>({
			query: () => "/device/inventory/available",
			transformResponse: (response: ApiEnvelope<DeviceInventoryRecord[]>) => unwrapList(response),
		}),

		getDeviceInventoryByImei: builder.query<DeviceInventoryRecord, string>({
			query: (inventoryId) => `/device/inventory/imei/${encodeURIComponent(inventoryId)}`,
			transformResponse: (response: ApiEnvelope<DeviceInventoryRecord>) =>
				requireResponse(response, "device inventory"),
		}),
	}),
	overrideExisting: false,
});

export const {
	useGetDevicesQuery,
	useGetDeviceByIdQuery,
	useLazyGetDeviceByIdQuery,
	useCreateDeviceMutation,
	useUpdateDeviceMutation,
	useUpdateDeviceStatusMutation,
	useDeleteDeviceMutation,
	useLazyGetAvailableDeviceInventoryQuery,
	useLazyGetDeviceInventoryByImeiQuery,
} = deviceApi;