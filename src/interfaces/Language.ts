

import { Status } from "@/enums/Status";

export interface Language {
    id?: string;
    language: string;
    externalId?: string;

    status?: Status;
    createdAt?: string;
    updatedAt?: string;
}