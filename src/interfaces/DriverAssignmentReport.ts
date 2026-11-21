/** Query params for `GET /vehicle/driver-assignment`. */
export type DriverAssignmentReportParams = {
  client: string;
  transporter: string;
  vehicle: string;
  /** DD/MM/YYYY HH:mm, e.g. `20/11/2026 00:00` */
  from: string;
  /** DD/MM/YYYY HH:mm, e.g. `20/11/2026 23:59` */
  to: string;
};

type NestedPerson =
  | string
  | {
      id?: string;
      name?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      phoneNumber?: string;
      mobile?: string;
    }
  | null
  | undefined;

type NestedVehicle =
  | string
  | {
      id?: string;
      vehicle?: string;
      vehicleNo?: string;
      vehicleNickname?: string;
      name?: string;
    }
  | null
  | undefined;

/** Raw API record — field names vary across backends. */
export interface DriverAssignmentApiRecord {
  id?: string | number;
  externalId?: string;
  client?: string | null;
  clientName?: string | null;
  transporter?: string | null;
  transporterName?: string | null;
  driver?: NestedPerson;
  driverName?: string | null;
  name?: string | null;
  phone?: string | null;
  phoneNumber?: string | null;
  mobile?: string | null;
  vehicle?: NestedVehicle;
  vehicleNo?: string | null;
  vehicleNumber?: string | null;
  vehicleName?: string | null;
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
  duration?: string | number | null;
  durationHours?: string | number | null;
  durationMinutes?: string | number | null;
  distanceKm?: string | number | null;
  distance?: string | number | null;
  totalDistance?: string | number | null;
}

export interface DriverAssignment {
  id: string;
  externalId: string;
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
