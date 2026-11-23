import type { Status } from "@/enums/Status";
import type { UserType } from "@/enums/UserType";

export interface CreateUserRequest {
  userName: string;
  password: string;
  confirmPassword: string;
  /** Group externalId. */
  group: string;
  userType: UserType;
  /** Timezone externalId. */
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

export interface User extends Omit<CreateUserRequest, "password" | "confirmPassword" | "userType"> {
  id: string | number;
  externalId: string;
  password?: string;
  userType?: UserType | string;
  /** Legacy field — prefer `userType`. */
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}
