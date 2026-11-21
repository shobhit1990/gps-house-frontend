export interface ExpensePartyRef {
  id?: string;
  name?: string;
  companyName?: string;
  /** Vehicle plate / number when relation is a vehicle. */
  vehicle?: string;
  vehicleNo?: string;
  vehicleNickname?: string;
}

export interface ExpenseTypeRef {
  id?: string;
  expenseName?: string;
  name?: string;
}

export interface CreateExpenseRequest {
  /** Client externalId / id. */
  client: string;
  /** Transporter externalId / id. */
  transporter: string;
  /** Must be VehicleWise | DriverWise */
  expenseFor: string;
  /** Vehicle id when expenseFor is VehicleWise */
  vehicle?: string;
  /** Driver id when expenseFor is DriverWise */
  driver?: string;
  expenseName?: string;
  /** Expense type externalId / id. */
  expenseType: string;
  amount: number;
  /** ISO date/time, e.g. 2026-11-20T15:36:00.000Z */
  expenseDate: string;
  odometer?: number;
  engineHours?: number;
  description?: string;
  quantity?: number;
  supplier?: string;
  buyer?: string;
  status: string;
}

export type UpdateExpenseRequest = Partial<CreateExpenseRequest>;

/** Raw API record — relations may arrive nested or as id strings. */
export interface ExpenseApiRecord {
  id?: string | number;
  externalId?: string;
  client?: string | ExpensePartyRef | null;
  transporter?: string | ExpensePartyRef | null;
  expenseFor?: string | null;
  vehicle?: string | ExpensePartyRef | null;
  driver?: string | ExpensePartyRef | null;
  expenseName?: string | null;
  expenseType?: string | ExpenseTypeRef | null;
  amount?: number | string | null;
  expenseDate?: string | null;
  odometer?: number | string | null;
  engineHours?: number | string | null;
  description?: string | null;
  quantity?: number | string | null;
  supplier?: string | null;
  buyer?: string | null;
  vehicleNo?: string;
  driverName?: string;
  tripName?: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  role?: string;
  status?: string | null;
  reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface Expense {
  id: string | number;
  externalId: string;
  /** Client id for forms / filters. */
  client: string;
  clientName: string;
  /** Transporter id for forms. */
  transporter: string;
  transporterName: string;
  expenseFor?: string;
  vehicle?: string;
  driver?: string;
  expenseName: string;
  /** Expense type id for forms. */
  expenseType: string;
  /** Display name from nested expenseType.expenseName. */
  expenseTypeName: string;
  amount: number;
  expenseDate: string;
  odometer?: number;
  engineHours?: number;
  description?: string;
  quantity?: number;
  supplier?: string;
  buyer?: string;
  vehicleNo?: string;
  driverName?: string;
  tripName?: string;
  createdBy?: string;
  role?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}
