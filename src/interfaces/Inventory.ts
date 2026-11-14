export type InventoryStatus = "active" | "inactive";

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
	createdAt?: string;
	updatedAt?: string;
}
