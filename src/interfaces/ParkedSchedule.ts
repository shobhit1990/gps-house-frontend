import type { Status } from "@/enums/Status";

export type ParkedScheduleFrequency = "Daily" | "Weekly" | "Monthly";

export interface CreateParkedScheduleRequest {
  /** Client externalId. */
  client: string;
  /** Transporter externalId. */
  transporter: string;
  /** Vehicle externalId. */
  vehicle: string;
  scheduled: ParkedScheduleFrequency;
  /** yyyy-MM-dd */
  startDate: string;
  /** yyyy-MM-dd */
  endDate: string;
  /** HH:mm */
  scheduledFrom: string;
  /** HH:mm */
  scheduledTill: string;
  status: Status;
  reason?: string;
}

export type UpdateParkedScheduleRequest = Partial<CreateParkedScheduleRequest>;

export interface ParkedSchedule extends CreateParkedScheduleRequest {
  id: string | number;
  externalId: string;
  createdAt?: string;
  updatedAt?: string;
}
