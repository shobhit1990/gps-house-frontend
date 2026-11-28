export interface CreateDeviceRequest {
	imei: string;
	simNumber: string;
	simOperator: string;
	/** Optional — omit when empty; API requires exactly 24 digits if sent. */
	secondarySimNumber?: string;
	secondarySimOperator?: string;
	deviceType: string;
	client: string;
	password?: string;
	status?: string;
	reason?: string;
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
	/** Present on some list/detail responses; not sent on create/update. */
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
