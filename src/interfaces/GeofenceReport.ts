/** Query params for `GET /geofence-report`. */
export type GeofenceReportParams = {
	client: string;
	transporter: string;
	vehicle: string;
	/** e.g. `All` or duration enum label */
	duration: string;
	/** ISO local datetime, e.g. `2026-11-23T00:00:00` */
	from: string;
	/** ISO local datetime, e.g. `2026-11-23T23:59:00` */
	to: string;
};

type NestedRef =
	| string
	| {
			id?: string | number;
			externalId?: string;
			name?: string;
			companyName?: string;
			userName?: string;
			vehicle?: string;
			vehicleNo?: string;
			vehicleNickname?: string;
			geoName?: string;
			geofenceName?: string;
			address?: string;
			location?: string;
	  }
	| null
	| undefined;

/** Raw API record — field names vary across backends. */
export interface GeofenceReportApiRecord {
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
	geoName?: string | null;
	geofenceName?: string | null;
	geofence?: NestedRef;
	inTime?: string | null;
	outTime?: string | null;
	arrivalTime?: string | null;
	departureTime?: string | null;
	startTime?: string | null;
	endTime?: string | null;
	inLoc?: string | null;
	outLoc?: string | null;
	inLocation?: string | null;
	outLocation?: string | null;
	location?: string | null;
	address?: string | null;
	haltTime?: string | number | null;
	duration?: string | number | null;
	totalDuration?: string | number | null;
	distance?: string | number | null;
	reportType?: string | null;
	type?: string | null;
	remark?: string | null;
	status?: string | null;
}

export interface GeofenceReportRow {
	id: string;
	externalId: string;
	sn: number;
	client: string;
	transporter: string;
	vehicle: string;
	geoName: string;
	inTime: string;
	outTime: string;
	inLoc: string;
	outLoc: string;
	haltTime: string;
	distance: string;
	reportType: string;
	remark: string;
}
