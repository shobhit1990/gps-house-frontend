

import { Status } from "@/enums/Status";

export interface ownerMaster {
    id?: string;
    ownerName?: string;
    externalId?: string;

    status?: Status;
    createdAt?: string;
    updatedAt?: string;
}