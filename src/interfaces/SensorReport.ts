/** Query params for `GET /sensor-report`. */
export type SensorReportParams = {
	client: string;
	transporter: string;
	vehicle: string;
	/** SensorReportType: Panic On, Panic Off, Parked, Unparked, Lock, Unlock, Battery Disconnect */
	reportType: string;
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
export interface SensorReportApiRecord {
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
	type?: string | null;
	reportType?: string | null;
	sensorType?: string | null;
	medium?: string | null;
	createdBy?: NestedRef;
	createdByName?: string | null;
	location?: string | null;
	locations?: string | number | string[] | null;
	added?: string | null;
	createdAt?: string | null;
	at?: string | null;
	address?: string | null;
}

export interface SensorReportRow {
	id: string;
	externalId: string;
	sn: number;
	vehicleNo: string;
	type: string;
	medium: string;
	createdBy: string;
	location: string;
	added: string;
	address: string;
}
