import type { Status } from "@/enums/Status";

export interface CreateJobSheetRequest {
  vehicle: string;
  technician: string;
  contactPersonName: string;
  phone: string;
  orderNo?: string;
  instruction?: string;
  status: Status;
  reason?: string;
}

export type UpdateJobSheetRequest = Partial<CreateJobSheetRequest>;

export interface JobSheet extends CreateJobSheetRequest {
  id: string | number;
  externalId: string;
  /** Resolved display labels from nested API refs (when present). */
  vehicleNo?: string;
  technicianName?: string;
  transporterName?: string;
  createdAt?: string;
  updatedAt?: string;
}
