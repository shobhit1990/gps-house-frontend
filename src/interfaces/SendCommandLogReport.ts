/** Query params for `GET /sendCommandLogReport`. */
export type SendCommandLogReportParams = {
	client: string;
	transporter: string;
	vehicle: string;
	/** DD/MM/YYYY HH:mm */
	from: string;
	/** DD/MM/YYYY HH:mm */
	to: string;
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
			imei?: string;
	  }
	| null
	| undefined;

/** Raw API record — field names vary across backends. */
export interface SendCommandLogApiRecord {
	sn?: number | string;
	id?: string | number;
	externalId?: string;
	client?: NestedRef;
	clientName?: string | null;
	transporter?: NestedRef;
	transporterName?: string | null;
	vehicle?: NestedRef;
	vehicleNo?: string | null;
	vehicleNumber?: string | null;
	vehicleName?: string | null;
	vehicleNickname?: string | null;
	imei?: string | null;
	deviceImei?: string | null;
	type?: string | null;
	commandType?: string | null;
	message?: string | null;
	command?: string | null;
	time?: string | null;
	createdAt?: string | null;
	at?: string | null;
	sentAt?: string | null;
}

export interface SendCommandLogRow {
	id: string;
	externalId: string;
	sn: number;
	vehicleNumber: string;
	imei: string;
	transporter: string;
	client: string;
	type: string;
	message: string;
	time: string;
}
