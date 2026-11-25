/** Query params for `GET /idle-summary-report`. */
export type IdleSummaryReportParams = {
	client: string;
	transporter: string;
	vehicle: string;
	/** DD/MM/YYYY HH:mm */
	from: string;
	/** DD/MM/YYYY HH:mm */
	to: string;
	/** Minimum idle duration in minutes, e.g. `5`. */
	duration: string | number;
	/** e.g. `Idle` or `Ignition Off`. */
	status: string;
};

type NestedRef =
	| string
	| {
			id?: string | number;
			userName?: string;
			name?: string;
			companyName?: string;
			vehicle?: string;
			vehicleNo?: string;
			vehicleNickname?: string;
	  }
	| null
	| undefined;

/** Raw API record — field names vary across backends. */
export interface IdleSummaryApiRecord {
	sn?: number | string;
	id?: string | number;
	externalId?: string;
	client?: NestedRef;
	clientName?: string | null;
	transporter?: NestedRef;
	transporterName?: string | null;
	vehicle?: NestedRef;
	vehicleNo?: string | null;
	vehicleName?: string | null;
	vehicleNickname?: string | null;
	totalDuration?: string | number | null;
	duration?: string | number | null;
	idleDuration?: string | number | null;
	hours?: string | number | null;
	minutes?: string | number | null;
	count?: string | number | null;
	idleCount?: string | number | null;
	locations?: string | number | string[] | null;
	location?: string | null;
	address?: string | null;
	status?: string | null;
	at?: string | null;
	createdAt?: string | null;
	startTime?: string | null;
	endTime?: string | null;
}

export interface IdleSummary {
	id: string;
	externalId: string;
	sn: number;
	client: string;
	transporter: string;
	vehicle: string;
	totalDuration: string;
	count: string;
	locations: string;
	status: string;
}
