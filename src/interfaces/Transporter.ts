export interface CreateTransporterRequest {
  userName: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  client: string;
  timezone: string;
  inactiveTime: number;
  language: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  subscriptionStartDate: string;
  subscriptionDueDate: string;
  subscriptionExtendDate?: string;
  subscriptionExpiryCount?: number;
  maximumRadiusForNearestPOI: string;
  minimumDistanceForAddress: string;
  dataRestriction: string;
  active: boolean;
  overwriteSubscription: boolean;
  inactiveAfterExpiry: boolean;
  status?: string;
  reason?: string;
  roles?: string[];
}

export type UpdateTransporterRequest = Partial<CreateTransporterRequest>;

export interface Transporter extends Omit<CreateTransporterRequest, "password" | "confirmPassword"> {
  id: string | number;
  externalId: string;
  password?: string;
  suspended?: boolean;
  inactiveDate?: string;
  createdAt?: string;
  updatedAt?: string;
}
