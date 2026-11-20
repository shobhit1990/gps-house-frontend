export interface ExpensePartyRef {
  id?: string;
  name?: string;
  companyName?: string;
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
  expenseName?: string;
  /** Expense type externalId / id. */
  expenseType: string;
  amount: number;
  /** Date/time selected in the expense form. */
  expenseDate: string;
  odometer?: number;
  engineHours?: number;
  description?: string;
  quantity?: number;
  supplier?: string;
  buyer?: string;
}

export type UpdateExpenseRequest = Partial<CreateExpenseRequest>;

/** Raw API record — relations may arrive nested or as id strings. */
export interface ExpenseApiRecord {
  id?: string | number;
  externalId?: string;
  client?: string | ExpensePartyRef | null;
  transporter?: string | ExpensePartyRef | null;
  expenseName?: string;
  expenseType?: string | ExpenseTypeRef | null;
  amount?: number | string;
  expenseDate?: string;
  odometer?: number | string;
  engineHours?: number | string;
  description?: string;
  quantity?: number | string;
  supplier?: string;
  buyer?: string;
  vehicleNo?: string;
  driverName?: string;
  tripName?: string;
  createdBy?: string;
  role?: string;
  status?: string | null;
  reason?: string | null;
  createdAt?: string;
  updatedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
}
