/** Query params for `GET /ride-report`. */
export type RideReportParams = {
	client: string;
	transporter: string;
	vehicle: string;
	/** Minimum duration in minutes, e.g. `5`. */
	duration: string | number;
	/** DD/MM/YYYY HH:mm */
	from: string;
	/** DD/MM/YYYY HH:mm */
	to: string;
	search?: string;
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
			address?: string;
			location?: string;
	  }
	| null
	| undefined;

/** Raw API record — field names vary across backends. */
export interface RideReportApiRecord {
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
	startDateTime?: string | null;
	startTime?: string | null;
	startAt?: string | null;
	startCoordinate?: string | null;
	startLat?: string | number | null;
	startLng?: string | number | null;
	sPoi?: string | null;
	startPoi?: string | null;
	startAddress?: string | null;
	endDateTime?: string | null;
	endTime?: string | null;
	endAt?: string | null;
	endCoordinate?: string | null;
	endLat?: string | number | null;
	endLng?: string | number | null;
	ePoi?: string | null;
	endPoi?: string | null;
	endAddress?: string | null;
	totalDistance?: string | number | null;
	distance?: string | number | null;
	duration?: string | number | null;
	reportCount?: string | number | null;
	numberOfReports?: string | number | null;
	count?: string | number | null;
}

export interface RideReportRow {
	id: string;
	externalId: string;
	sn: number;
	vehicleNo: string;
	startDateTime: string;
	startCoordinate: string;
	sPoi: string;
	startAddress: string;
	endDateTime: string;
	endCoordinate: string;
	ePoi: string;
	endAddress: string;
	totalDistance: string;
	duration: string;
	reportCount: string;
}
