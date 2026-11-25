/** Query params for `GET /driver-assignment`. */
export type DriverAssignmentReportParams = {
	client: string;
	transporter: string;
	vehicle: string;
	/** DD/MM/YYYY HH:mm, e.g. `20/11/2026 00:00` */
	from: string;
	/** DD/MM/YYYY HH:mm, e.g. `20/11/2026 23:59` */
	to: string;
};

type NestedRef =
	| string
	| {
			id?: string | number;
			userName?: string;
			name?: string;
			companyName?: string;
			email?: string;
			phone?: string | number;
			ownerName?: string;
			firstName?: string;
			lastName?: string;
			phoneNumber?: string;
			mobile?: string;
			vehicle?: string;
			vehicleNo?: string;
			vehicleNickname?: string;
			owner?: { id?: string; ownerName?: string } | null;
	  }
	| null
	| undefined;

type TravelBlock = {
	startTime?: string | null;
	endTime?: string | null;
	distanceMeters?: number | string | null;
	distanceKm?: number | string | null;
	runningMs?: number | string | null;
	idleMs?: number | string | null;
	stopMs?: number | string | null;
	maxSpeed?: number | string | null;
	avgSpeed?: number | string | null;
} | null;

/** Raw API record for driver-assignment report. */
export interface DriverAssignmentApiRecord {
	sn?: number | string;
	id?: string | number;
	externalId?: string;
	vehicle?: NestedRef;
	vehicleNo?: string | null;
	vehicleNumber?: string | null;
	vehicleName?: string | null;
	vehicleNickname?: string | null;
	mileage?: number | string | null;
	hours?: string | number | null;
	minutes?: string | number | null;
	client?: NestedRef;
	clientName?: string | null;
	transporter?: NestedRef;
	transporterName?: string | null;
	driver?: NestedRef;
	driverName?: string | null;
	name?: string | null;
	ownerName?: string | null;
	ownedBy?: string | null;
	phone?: string | number | null;
	phoneNumber?: string | null;
	mobile?: string | null;
	assignedOn?: string | null;
	assignedAt?: string | null;
	assignmentDate?: string | null;
	startDate?: string | null;
	fromDate?: string | null;
	unassignedOn?: string | null;
	unassignedAt?: string | null;
	unassignmentDate?: string | null;
	endDate?: string | null;
	toDate?: string | null;
	assignedBy?: string | null;
	assignedByName?: string | null;
	createdBy?: string | null;
	subscriptionStartDate?: string | null;
	subscriptionDueDate?: string | null;
	createdAt?: string | null;
	updatedAt?: string | null;
	duration?: string | number | null;
	durationHours?: string | number | null;
	durationMinutes?: string | number | null;
	distanceKm?: string | number | null;
	distance?: string | number | null;
	totalDistance?: string | number | null;
	travel?: TravelBlock;
}

export interface DriverAssignment {
	id: string;
	externalId: string;
	sn: number;
	client: string;
	transporter: string;
	driverName: string;
	phone: string;
	vehicleNo: string;
	assignedOn: string;
	unassignedOn: string;
	assignedBy: string;
	duration: string;
	distanceKm: string;
}
