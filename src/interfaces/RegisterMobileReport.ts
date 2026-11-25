/** Query params for `GET /register-mobile-report`. */
export type RegisterMobileReportParams = {
	client: string;
	/** e.g. `client`, `transporter`, `user`. */
	type: string;
	transporter?: string;
};

type NestedRef =
	| string
	| {
			id?: string | number;
			userName?: string;
			username?: string;
			name?: string;
			companyName?: string;
	  }
	| null
	| undefined;

/** Raw API record — field names vary across backends. */
export interface RegisterMobileApiRecord {
	sn?: number | string;
	id?: string | number;
	externalId?: string;
	client?: NestedRef;
	clientName?: string | null;
	userType?: string | null;
	type?: string | null;
	transporter?: NestedRef;
	transporterName?: string | null;
	username?: string | null;
	userName?: string | null;
	name?: string | null;
	activeCount?: string | number | null;
	count?: string | number | null;
	mobileCount?: string | number | null;
}

export interface RegisterMobileRow {
	id: string;
	externalId: string;
	sn: number;
	username: string;
	activeCount: string;
	userType: string;
	client: string;
	transporter: string;
}
