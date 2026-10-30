import type { Status } from "@/enums/Status";

export interface CreateBillingDetailsRequest {
  transporter: string;
  billingName: string;
  gstNumber?: string;
  billingEmail?: string;
  billingPhone?: string;
  billingAddress?: string;
  paymentMode?: string;
  status: Status;
}

export type UpdateBillingDetailsRequest = Partial<CreateBillingDetailsRequest>;

export interface BillingDetails extends CreateBillingDetailsRequest {
  id: string | number;
  externalId: string;
  createdAt?: string;
  updatedAt?: string;
}
