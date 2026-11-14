export interface CreateExpenseRequest {
  /** Client externalId. */
  client: string;
  /** Transporter externalId. */
  transporter: string;
  expenseName?: string;
  /** Expense type externalId. */
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

export interface Expense extends CreateExpenseRequest {
  id: string | number;
  externalId: string;
  vehicleNo?: string;
  driverName?: string;
  tripName?: string;
  createdBy?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}
