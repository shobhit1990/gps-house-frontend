import { Status } from "@/enums/Status";

export interface ExpenseTypeApiRecord {
	id?: string | number;
	externalId?: string;
	expenseName?: string;
	expenseType?: string;
	name?: string;
	status?: string;
	reason?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface ExpenseType {
	id?: string | number;
	externalId: string;
	expenseName: string;
	status: Status;
	reason?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface CreateExpenseTypeRequest {
	expenseName: string;
}

export interface UpdateExpenseTypeRequest {
	externalId: string;
	expenseName: string;
}

export interface UpdateExpenseTypeStatusRequest {
	externalId: string;
	status: Status;
	reason?: string;
}

export interface DeleteExpenseTypeResponse {
	success: boolean;
	id: string | number;
}
