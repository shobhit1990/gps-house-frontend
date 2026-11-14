import { api } from "../api";
import type { CreateDeviceRequest, Device, DeviceInventoryRecord, UpdateDeviceRequest } from "@/interfaces/AddDevice";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type DeviceApiRecord = Omit<Device, "externalId"> & { externalId?: string };

function requireResponse<T>(response: ApiEnvelope<T>, resource: string): T {
	const record = unwrapResponse(response);
	if (!record) throw new Error(`The ${resource} response was empty.`);
	return record;
}

const normalizeDevice = (record: DeviceApiRecord): Device => ({
	...record,
	externalId: String(record.externalId ?? record.id ?? ""),
});

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
	useDeleteDeviceMutation,
	useLazyGetAvailableDeviceInventoryQuery,
	useLazyGetDeviceInventoryByImeiQuery,
} = deviceApi;