/** Query params for `GET /sim-tracking-report`. */
export type SimTrackingReportParams = {
	/** e.g. `Active` | `Inactive` — omit for all. */
	status?: string;
};

type NestedRef =
	| string
	| {
			id?: string | number;
			externalId?: string;
			name?: string;
			vehicle?: string;
			vehicleNo?: string;
			vehicleNickname?: string;
			userName?: string;
			username?: string;
	  }
	| null
	| undefined;

/** Raw API record — field names vary across backends. */
export interface SimTrackingApiRecord {
	sn?: number | string;
	id?: string | number;
	externalId?: string;
	vehicle?: NestedRef;
	vehicleNo?: string | null;
	vehicleName?: string | null;
	vehicleNickname?: string | null;
	vehicleStatus?: string | null;
	status?: string | null;
	createdBy?: NestedRef;
	simNo?: string | number | null;
	simNumber?: string | number | null;
	sim?: string | number | null;
	consent?: string | null;
	startDate?: string | null;
	endDate?: string | null;
	frequency?: string | number | null;
	frequencyMinutes?: string | number | null;
	nextUpdate?: string | null;
	trackCount?: string | number | null;
	message?: string | null;
	remainingCoins?: string | number | null;
	coins?: string | number | null;
}

export interface SimTrackingRow {
	id: string;
	externalId: string;
	vehicleNo: string;
	vehicleStatus: "Active" | "Inactive" | string;
	createdBy: string;
	simNo: string;
	consent: string;
	startDate: string;
	endDate: string;
	frequency: string;
	nextUpdate: string;
	trackCount: string;
	message: string;
}

export type SimTrackingReportResult = {
	rows: SimTrackingRow[];
	remainingCoins: number;
};
