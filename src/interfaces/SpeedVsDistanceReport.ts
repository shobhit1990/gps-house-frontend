/** Query params for `GET /speed-and-distance-report`. */
export type SpeedVsDistanceReportParams = {
	client: string;
	transporter: string;
	vehicle: string;
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
	  }
	| null
	| undefined;

/** Raw API record — speed-band field names vary. */
export interface SpeedVsDistanceApiRecord {
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
	km0?: number | string | null;
	km40?: number | string | null;
	km60?: number | string | null;
	km80?: number | string | null;
	speed0to40?: number | string | null;
	speed40to60?: number | string | null;
	speed60to80?: number | string | null;
	speed80Plus?: number | string | null;
	"0-40"?: number | string | null;
	"40-60"?: number | string | null;
	"60-80"?: number | string | null;
	"80+"?: number | string | null;
	totalDistance?: number | string | null;
	totalDistanceKm?: number | string | null;
	total?: number | string | null;
	bands?: {
		km0?: number | string | null;
		km40?: number | string | null;
		km60?: number | string | null;
		km80?: number | string | null;
	} | null;
}

export interface SpeedVsDistanceRow {
	id: string;
	externalId: string;
	sn: number;
	client: string;
	transporter: string;
	vehicle: string;
	km0: number;
	km40: number;
	km60: number;
	km80: number;
	total: number;
}
