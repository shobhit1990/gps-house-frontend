export interface CreateDeviceRequest {
	imei: string;
	simNumber: string;
	simOperator: string;
	secondarySimNumber: string;
	secondarySimOperator: string;
	deviceType: string;
	client: string;
	password: string;
	ignitionWireConnected: boolean;
	ignitionWireNotConnected: boolean;
	airConditionWireConnected: boolean;
	attendance: boolean;
	timezoneSetting: boolean;
}

export type UpdateDeviceRequest = Partial<CreateDeviceRequest>;

type InventoryReference = {
	id?: string | number;
	externalId?: string;
};

export interface Device extends CreateDeviceRequest {
	id?: string | number;
	externalId: string;
	active?: boolean;
	createdAt?: string;
	updatedAt?: string;
}

export type DeviceInventoryRecord = Omit<Partial<CreateDeviceRequest>, "deviceType" | "client"> & {
	id?: string | number;
	externalId?: string;
	active?: boolean;
	deviceType?: string | InventoryReference | null;
	client?: string | InventoryReference | null;
};
