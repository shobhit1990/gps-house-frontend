import { Status } from "@/enums/Status";

/** Matches `/role/get-all` records. */
export interface RoleApiRecord {
	id?: string | number;
	roleCode?: string;
	name?: string;
	status?: string;
	reason?: string | null;
}

export interface RoleRecord {
	id: string;
	externalId: string;
	roleCode: string;
	name: string;
	status: Status;
	reason: string;
}

export interface RoleMasterRecord {
	id?: string | number;
	externalId?: string;
	roleCode?: string;
	name?: string;
	status?: Status;
}

export interface CreateRoleRequest {
	roleCode: string;
	name: string;
	status: Status;
}

export interface UpdateRoleRequest {
	externalId: string;
	roleCode: string;
	name: string;
	status: Status;
}

export interface UpdateRoleStatusRequest {
	externalId: string;
	status: Status;
	reason?: string;
}
