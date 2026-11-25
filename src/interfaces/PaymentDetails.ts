import type { PaymentTerm as PaymentTermEnum } from "@/enums/PaymentTerm";
import type { Status } from "@/enums/Status";

export type PaymentTerm = `${PaymentTermEnum}` | PaymentTermEnum;

export interface CreatePaymentDetailsRequest {
  type: string;
  /** Transporter externalId. */
  transporter: string;
  /** Vehicle externalId — required when `type` is `vehicle`. */
  vehicle?: string;
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
  /** Display label when API nests transporter. */
  transporterName?: string;
  /** Display label when API nests vehicle. */
  vehicleName?: string;
  invoice?: string;
  createdAt?: string;
  updatedAt?: string;
}
