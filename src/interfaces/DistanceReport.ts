import type { ReportType } from "@/enums/ReportType";
import type { SortOrder } from "@/enums/SortOrder";

/** Query params for `GET /distance-reports`. */
export type DistanceReportParams = {
	client: string;
	transporter: string;
	vehicle: string;
	/** DD/MM/YYYY HH:mm, e.g. 20/11/2026 00:00 */
	from: string;
	/** DD/MM/YYYY HH:mm, e.g. 20/11/2026 23:59 */
	to: string;
	reportType: ReportType | string;
	sortOrder: SortOrder | string;
};

type NestedName =
	| string
	| {
			id?: string | number;
			externalId?: string;
			name?: string;
			vehicle?: string;
			vehicleNo?: string;
			vehicleNickname?: string;
			vehicleAlias?: string;
			alias?: string;
	  }
	| null
	| undefined;

/** Raw API record — field names vary across backends. */
export interface DistanceReportApiRecord {
	id?: string | number;
	externalId?: string;
	client?: NestedName;
	clientName?: string | null;
	transporter?: NestedName;
	transporterName?: string | null;
	vehicle?: NestedName;
	vehicleNo?: string | null;
	vehicleName?: string | null;
	vehicleNickname?: string | null;
	vehicleAlias?: string | null;
	alias?: string | null;
	date?: string | null;
	day?: string | null;
	dayKey?: string | null;
	distance?: number | string | null;
	mileage?: number | string | null;
	totalDistance?: number | string | null;
	totalDistanceKm?: number | string | null;
	byDay?: Record<string, number | string | null> | null;
	dailyDistance?: Record<string, number | string | null> | null;
	dayWise?: Record<string, number | string | null> | null;
	distances?: Record<string, number | string | null> | Array<{ date?: string; day?: string; distance?: number | string; mileage?: number | string }> | null;
	chartData?: Array<{
		date?: string;
		day?: string;
		dayKey?: string;
		distance?: number | string;
		mileage?: number | string;
	}> | null;
}

export type DistanceReportRow = {
	id: string;
	externalId: string;
	client: string;
	transporter: string;
	vehicle: string;
	alias: string;
	byDay: Record<string, number>;
	total: number;
};
