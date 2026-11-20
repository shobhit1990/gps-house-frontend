export type InventoryStatus = "active" | "inactive";

export interface BulkUploadInventoryRequest {
	assignType: string;
	inventoryType: string;
	file: File;
	/** Present when assignType is client. */
	client?: string;
	/** Present when assignType is technician. */
	technician?: string;
}

export interface CreateInventoryRequest {
	inventoryType: string;
	imei: string;
	simNumber: string;
	simOperator: string;
	secondarySimNumber: string;
	secondarySimOperator: string;
	deviceType: string;
	assignType: string;
	client: string;
	technician?: string | null;
	password: string;
	ignitionWireConnected: boolean;
	airConditionWireConnected: boolean;
	analogSensor: boolean;
	status: InventoryStatus;
	reason: string;
}

export type UpdateInventoryRequest = Partial<CreateInventoryRequest>;

export interface Inventory extends CreateInventoryRequest {
	id?: string | number;
	externalId: string;
	/** Resolved display labels from nested API refs (when present). */
	clientName?: string;
	technicianName?: string;
	deviceTypeName?: string;
	createdAt?: string;
	updatedAt?: string;
}
