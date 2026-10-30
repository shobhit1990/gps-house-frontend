import type { Status } from "@/enums/Status";

export interface CreateUserRequest {
  userName: string;
  password: string;
  confirmPassword: string;
  /** Group externalId. */
  group: string;
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

export interface User extends Omit<CreateUserRequest, "password" | "confirmPassword"> {
  id: string | number;
  externalId: string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}
