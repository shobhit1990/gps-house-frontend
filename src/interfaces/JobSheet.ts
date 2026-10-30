import type { Status } from "@/enums/Status";

export interface CreateJobSheetRequest {
  vehicle: string;
  technician: string;
  contactPersonName: string;
  phone: string;
  instruction?: string;
  status: Status;
  reason?: string;
}

export type UpdateJobSheetRequest = Partial<CreateJobSheetRequest>;

export interface JobSheet extends CreateJobSheetRequest {
  id: string | number;
  externalId: string;
  createdAt?: string;
  updatedAt?: string;
}
