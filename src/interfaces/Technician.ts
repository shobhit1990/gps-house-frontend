import type { Status } from "@/enums/Status";

export interface CreateTechnicianRequest {
  userName: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  name?: string;
  email?: string;
  phone?: number;
  address?: string;
  /** Timezone externalId. */
  timezone: string;
  /** Client externalId. */
  client: string;
  status: Status;
  reason?: string;
}

export type UpdateTechnicianRequest = Partial<CreateTechnicianRequest>;

export interface Technician extends Omit<CreateTechnicianRequest, "password" | "confirmPassword"> {
  id: string | number;
  externalId: string;
  password?: string;
  createdAt?: string;
  updatedAt?: string;
}
