import type { Status } from "@/enums/Status";

export type PaymentTerm = "monthely" | "quaterly" | "halfYearly" | "yearly";

export interface CreatePaymentDetailsRequest {
  type: string;
  /** Transporter externalId. */
  transporter: string;
  sellingPrice?: number;
  paymentTerm: PaymentTerm;
  installationDate?: string;
  rentalDueDate?: string;
  technicianName?: string;
  rental?: number;
  remark?: string;
  status: Status;
  reason?: string;
}

export type UpdatePaymentDetailsRequest = Partial<CreatePaymentDetailsRequest>;

export interface PaymentDetails extends CreatePaymentDetailsRequest {
  id: string | number;
  externalId: string;
  createdAt?: string;
  updatedAt?: string;
}
