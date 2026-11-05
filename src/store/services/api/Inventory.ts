import { api } from "../api";
import type { CreateInventoryRequest, Inventory, UpdateInventoryRequest } from "@/interfaces/Inventory";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type InventoryApiRecord = Omit<Inventory, "externalId"> & { externalId?: string };

function requireInventory(response: ApiEnvelope<InventoryApiRecord>): InventoryApiRecord {
	const record = unwrapResponse(response);
	if (!record) throw new Error("The inventory response was empty.");
	return record;
}

const normalizeInventory = (record: InventoryApiRecord): Inventory => ({
	...record,
	externalId: String(record.externalId ?? record.id ?? ""),
});

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
				url: "/addInventory/",
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
	}),
	overrideExisting: false,
});

export const {
	useGetInventoryQuery,
	useGetInventoryByIdQuery,
	useCreateInventoryMutation,
	useUpdateInventoryMutation,
	useDeleteInventoryMutation,
} = inventoryApi;