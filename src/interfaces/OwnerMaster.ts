import { Status } from "@/enums/Status";

export interface OwnerMaster {
  id?: string;
  ownerName?: string;
  externalId?: string;

  status?: Status;
  createdAt?: string;
  updatedAt?: string;
}
