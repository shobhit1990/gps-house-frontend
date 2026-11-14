export interface CreateTransporterRequest {
  userName: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  client: string;
  timezone: string;
  inactiveTime: number;
  language: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  subscriptionStartDate: string;
  subscriptionDueDate: string;
  subscriptionExtend?: string;
  subscriptionExpiryCount?: number;
  maximumRadiusForNearestPOI: string;
  minimumDistanceForAddress: string;
  dataRestriction: string;
  active: boolean;
  overwriteSubscription: boolean;
  inactiveAfterExpiry: boolean;
  roles?: string[];
}

export type UpdateTransporterRequest = Partial<CreateTransporterRequest>;

export interface Transporter extends Omit<CreateTransporterRequest, "password" | "confirmPassword"> {
  id: string | number;
  externalId: string;
  createdAt?: string;
  updatedAt?: string;
}
