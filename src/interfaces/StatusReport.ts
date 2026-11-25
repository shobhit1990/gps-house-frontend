/** Query params for `GET /status-report`. */
export type StatusReportParams = {
	client: string;
	transporter: string;
	vehicle: string;
	/** e.g. `Idle`, `Ignition On`. */
	status: string;
	/** DD/MM/YYYY HH:mm */
	from: string;
	/** DD/MM/YYYY HH:mm */
	to: string;
};

type NestedRef =
	| string
	| {
			id?: string | number;
			externalId?: string;
			name?: string;
			address?: string;
			location?: string;
			lat?: number | string;
			lng?: number | string;
			longitude?: number | string;
			latitude?: number | string;
	  }
	| null
	| undefined;

/** Raw API record — field names vary across backends. */
export interface StatusReportApiRecord {
	sn?: number | string;
	id?: string | number;
	externalId?: string;
	status?: string | null;
	statusType?: string | null;
	startDateTime?: string | null;
	startTime?: string | null;
	startAt?: string | null;
	startAddress?: string | null;
	startLoc?: string | null;
	startLocation?: string | null;
	startCoordinate?: string | null;
	startLat?: number | string | null;
	startLng?: number | string | null;
	startLongitude?: number | string | null;
	startLatitude?: number | string | null;
	endDateTime?: string | null;
	endTime?: string | null;
	endAt?: string | null;
	endAddress?: string | null;
	endLoc?: string | null;
	endLocation?: string | null;
	endCoordinate?: string | null;
	endLat?: number | string | null;
	endLng?: number | string | null;
	endLongitude?: number | string | null;
	endLatitude?: number | string | null;
	sPoi?: string | null;
	startPoi?: string | null;
	ePoi?: string | null;
	endPoi?: string | null;
	maxSpeed?: number | string | null;
	maximumSpeed?: number | string | null;
	avgSpeed?: number | string | null;
	averageSpeed?: number | string | null;
	totalDistance?: number | string | null;
	distance?: number | string | null;
	duration?: number | string | null;
	durationSeconds?: number | string | null;
	totalDuration?: number | string | null;
	hours?: number | string | null;
	minutes?: number | string | null;
	seconds?: number | string | null;
	start?: NestedRef;
	end?: NestedRef;
	vehicle?: NestedRef;
	vehicleNo?: string | null;
	vehicleName?: string | null;
}

export interface StatusReportRow {
	id: string;
	externalId: string;
	sn: number;
	status: string;
	startDateTime: string;
	startAddress: string;
	startCoordinate: string;
	endDateTime: string;
	endAddress: string;
	endCoordinate: string;
	sPoi: string;
	ePoi: string;
	maxSpeed: string;
	avgSpeed: string;
	totalDistance: number;
	durationSeconds: number;
}
