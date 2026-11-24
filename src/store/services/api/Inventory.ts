import { api } from "../api";
import type {
	BulkUploadInventoryRequest,
	CreateInventoryRequest,
	Inventory,
	UpdateInventoryRequest,
} from "@/interfaces/Inventory";
import { toFormData } from "../utils/formData";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type RefLike =
	| string
	| {
			externalId?: string;
			id?: string | number;
			name?: string;
			userName?: string;
			username?: string;
			companyName?: string;
			clientName?: string;
			deviceName?: string;
			deviceTypeName?: string;
			technicianName?: string;
	  }
	| null
	| undefined;

type InventoryApiRecord = Omit<Inventory, "externalId" | "client" | "deviceType" | "technician"> & {
	externalId?: string;
	client?: RefLike;
	deviceType?: RefLike;
	technician?: RefLike;
};

const asExternalId = (value: RefLike): string => {
	if (value == null || value === "") return "";
	if (typeof value === "string" || typeof value === "number") return String(value);
	return String(value.externalId ?? value.id ?? "");
};

const asDisplayName = (value: RefLike, keys: Array<keyof NonNullable<Extract<RefLike, object>>> = ["name"]): string => {
	if (value == null || value === "") return "";
	if (typeof value === "string" || typeof value === "number") return "";
	for (const key of keys) {
		const text = value[key];
		if (typeof text === "string" && text.trim()) return text.trim();
	}
	return "";
};

function requireInventory(response: ApiEnvelope<InventoryApiRecord>): InventoryApiRecord {
	const record = unwrapResponse(response);
	if (!record) throw new Error("The inventory response was empty.");
	return record;
}

const normalizeInventory = (record: InventoryApiRecord): Inventory => {
	const clientId = asExternalId(record.client);
	const deviceTypeId = asExternalId(record.deviceType);
	const technicianId = asExternalId(record.technician);

	return {
		...record,
		externalId: String(record.externalId ?? record.id ?? ""),
		client: clientId,
		deviceType: deviceTypeId,
		technician: technicianId || null,
		clientName:
			asDisplayName(record.client, ["name", "clientName", "userName", "username", "companyName"]) ||
			record.clientName,
		deviceTypeName:
			asDisplayName(record.deviceType, ["deviceName", "deviceTypeName", "name"]) ||
			record.deviceTypeName,
		technicianName:
			asDisplayName(record.technician, ["name", "technicianName", "userName", "username", "companyName"]) ||
			record.technicianName,
	};
};

export const inventoryApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getInventory: builder.query<Inventory[], void>({
			query: () => "/addInventory/getAll",
			transformResponse: (response: ApiEnvelope<InventoryApiRecord[]>) =>
				unwrapList(response).map(normalizeInventory),
			providesTags: (result) => [
				{ type: "Inventory", id: "LIST" },
				...(result ?? []).map((item) => ({ type: "Inventory" as const, id: item.externalId })),
			],
		}),

		getInventoryById: builder.query<Inventory, string>({
			query: (externalId) => `/addInventory/getById/${encodeURIComponent(externalId)}`,
			transformResponse: (response: ApiEnvelope<InventoryApiRecord>) =>
				normalizeInventory(requireInventory(response)),
			providesTags: (_result, _error, externalId) => [{ type: "Inventory", id: externalId }],
		}),

		createInventory: builder.mutation<Inventory, CreateInventoryRequest>({
			query: (body) => ({
				url: "/addInventory",
				method: "POST",
				body,
			}),
			transformResponse: (response: ApiEnvelope<InventoryApiRecord>) =>
				normalizeInventory(requireInventory(response)),
			invalidatesTags: [{ type: "Inventory", id: "LIST" }],
		}),

		updateInventory: builder.mutation<Inventory, { externalId: string; body: UpdateInventoryRequest }>({
			query: ({ externalId, body }) => ({
				url: `/addInventory/update/${encodeURIComponent(externalId)}`,
				method: "PUT",
				body,
			}),
			transformResponse: (response: ApiEnvelope<InventoryApiRecord>) =>
				normalizeInventory(requireInventory(response)),
			invalidatesTags: (_result, _error, { externalId }) => [
				{ type: "Inventory", id: externalId },
				{ type: "Inventory", id: "LIST" },
			],
		}),

		deleteInventory: builder.mutation<void, string>({
			query: (externalId) => ({
				url: `/addInventory/delete/${encodeURIComponent(externalId)}`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, externalId) => [
				{ type: "Inventory", id: externalId },
				{ type: "Inventory", id: "LIST" },
			],
		}),

		bulkUploadInventory: builder.mutation<unknown, BulkUploadInventoryRequest>({
			query: ({ assignType, inventoryType, file, client, technician }) => ({
				url: "/addInventory/bulk-upload",
				method: "POST",
				body: toFormData({
					assignType,
					inventoryType,
					file,
					...(client ? { client } : {}),
					...(technician ? { technician } : {}),
				}),
			}),
			invalidatesTags: [{ type: "Inventory", id: "LIST" }],
		}),

		exportInventory: builder.mutation<Blob, void>({
			query: () => ({
				url: "/addInventory/export",
				method: "GET",
				responseHandler: (response) => response.blob(),
			}),
		}),
	}),
	overrideExisting: false,
});

export const {
	useGetInventoryQuery,
	useGetInventoryByIdQuery,
	useCreateInventoryMutation,
	useUpdateInventoryMutation,
	useDeleteInventoryMutation,
	useBulkUploadInventoryMutation,
	useExportInventoryMutation,
} = inventoryApi;
