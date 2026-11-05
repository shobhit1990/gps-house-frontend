import type { Status } from "@/enums/Status";

export type AlertAssignee = "user" | "group" | "transporter";

/** One alert record covers a single vehicle and alert type; the assignee's externalId goes under the key named by `alertAssignedTo`. */
export interface CreateAlertRequest {
  alertName: string;
  alertAssignedTo: AlertAssignee;
  /** User externalId, when `alertAssignedTo` is "user". */
  user?: string;
  /** Group externalId, when `alertAssignedTo` is "group". */
  group?: string;
  /** Transporter externalId, when `alertAssignedTo` is "transporter". */
  transporter?: string;
  /** Vehicle externalId. */
  vehicle: string;
  /** Alert type externalId from /master/alert. */
  alertType: string;
  mobile: boolean;
  status: Status;
  reason?: string;
}

export type UpdateAlertRequest = Partial<CreateAlertRequest>;

export interface Alert extends CreateAlertRequest {
  id: string | number;
  externalId: string;
  createdAt?: string;
  updatedAt?: string;
}
