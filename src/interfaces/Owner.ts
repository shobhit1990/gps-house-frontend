import { Status } from "@/enums/Status";

export interface Owner {
    id: string;
    isEditable: boolean|string;
    ownerName: string;
    status: Status;
    createdAt?: string;
    updatedAt?: string;
}