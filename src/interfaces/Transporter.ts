export interface CreateTransporterRequest {
  username: string;
  password: string;
  company: string;
  client: string;
  timezone: string;
  inactiveTime: number;
  language: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionStart: string;
  subscriptionDue: string;
  subscriptionExtend?: string;
  subscriptionExpiryCount?: number;
  maxPoiRadius?: number;
  minAddressDistance?: number;
  dataRestriction?: number;
  active: boolean;
  overwriteSubscription: boolean;
  inactiveAfterExpiry: boolean;
  roles: string[];
}

export type UpdateTransporterRequest = Partial<CreateTransporterRequest>;

export interface Transporter extends Omit<CreateTransporterRequest, "password"> {
  id: string | number;
  externalId: string;
  createdAt?: string;
  updatedAt?: string;
}
