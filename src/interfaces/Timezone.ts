

import { Status } from "@/enums/Status";

export interface Timezone {
    id?: string;
    timezone?: string;
    externalId?: string;

    status?: Status;
    createdAt?: string;
    updatedAt?: string;
}