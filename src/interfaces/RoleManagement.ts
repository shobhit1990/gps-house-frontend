import { Status } from "@/enums/Status";

export interface RoleApiRecord {
	id?: string | number;
	externalId?: string;
	roleCode?: string;
	name?: string;
	status?: string;
	createdAt?: string;
	updatedAt?: string;
}

export interface RoleRecord {
	id: string | number;
	externalId: string;
	roleCode: string;
	name: string;
	status: Status;
	createdAt?: string;
	updatedAt?: string;
}

export interface RoleMasterRecord {
	id?: string | number;
	externalId?: string;
	roleCode?: string;
	name?: string;
	status?: Status;
	createdAt?: string;
	updatedAt?: string;
}

export interface CreateRoleRequest {
	roleCode: string;
	name: string;
	status: Status;
}

export interface UpdateRoleRequest extends CreateRoleRequest {
	externalId: string;
}
