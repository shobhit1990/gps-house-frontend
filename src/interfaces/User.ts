import type { Status } from "@/enums/Status";
import type { UserType } from "@/enums/UserType";

export interface CreateUserRequest {
  userName: string;
  password: string;
  confirmPassword: string;
  /** Group id. */
  group: string;
  userType: UserType;
  /** Timezone id. */
  timezone: string;
  companyName: string;
  contactPersonName?: string;
  phone?: string;
  companyAddress?: string;
  dataRestrictionDays?: number;
  isSchoolUser: boolean;
  status: Status;
  reason?: string;
}

export type UpdateUserRequest = Partial<CreateUserRequest>;

export type UserGroupRef =
  | string
  | {
      id?: string;
      externalId?: string;
      groupName?: string;
      name?: string;
    }
  | null
  | undefined;

export type UserTimezoneRef =
  | string
  | {
      id?: string;
      externalId?: string;
      timeZone?: string;
      timezone?: string;
      name?: string;
    }
  | null
  | undefined;

export type UserRoleRef =
  | string
  | {
      id?: string;
      externalId?: string;
      roleCode?: string;
      name?: string;
    }
  | null
  | undefined;

export interface User {
  id: string | number;
  externalId: string;
  userName: string;
  password?: string;
  group: string;
  groupName?: string;
  userType?: UserType | string;
  role?: UserRoleRef;
  timezone: string;
  timezoneName?: string;
  companyName: string;
  contactPersonName?: string;
  phone?: string;
  companyAddress?: string;
  dataRestrictionDays?: number;
  isSchoolUser: boolean;
  status: Status;
  reason?: string;
  createdAt?: string;
  updatedAt?: string;
}
