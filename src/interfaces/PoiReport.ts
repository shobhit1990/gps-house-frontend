/** Query params for `GET /poi-report`. */
export type PoiReportParams = {
	/** e.g. `Vehicle Wise` | `Geofence Wise` */
	type: string;
	/** e.g. `Transporter` | `Group` | `GeoFence` */
	filterType: string;
	transporter?: string;
	group?: string;
	/** Comma-separated vehicle ids — Vehicle Wise. */
	vehicle?: string;
	/** Comma-separated geofence ids — Geofence Wise. */
	geofence?: string;
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
			vehicle?: string;
			vehicleNo?: string;
			vehicleNickname?: string;
			poiName?: string;
			geoName?: string;
			address?: string;
			location?: string;
	  }
	| null
	| undefined;

/** Raw API record — field names vary across backends. */
export interface PoiReportApiRecord {
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
	poi?: NestedRef;
	poiName?: string | null;
	geoName?: string | null;
	geofenceName?: string | null;
	inTime?: string | null;
	outTime?: string | null;
	arrivalTime?: string | null;
	departureTime?: string | null;
	startTime?: string | null;
	endTime?: string | null;
	inLoc?: string | null;
	outLoc?: string | null;
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
	/** Summary fields (Vehicle Wise table). */
	visits?: number | string | null;
	visitCount?: number | string | null;
	noOfVisits?: number | string | null;
	numberOfVisits?: number | string | null;
	stop?: string | number | null;
	stopTime?: string | number | null;
	stopMinutes?: number | string | null;
}

export interface PoiReportRow {
	id: string;
	externalId: string;
	sn: number;
	vehicle: string;
	/** No. of visits — summary count or 1 per detail hit. */
	visits: number;
	/** Stop duration / halt at POI (display string). */
	stop: string;
	poiName: string;
	inTime: string;
	outTime: string;
	duration: string;
	location: string;
	distance: string;
	reportType: string;
	remark: string;
}
