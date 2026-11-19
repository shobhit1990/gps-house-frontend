import type { Status } from "@/enums/Status";
import { TicketType } from "@/enums/TicketType";

export const ticketTypes = Object.values(TicketType);

export interface CreateRaiseTicketRequest {
  /** Client externalId. */
  client?: string;
  /** Transporter externalId. */
  transporter?: string;
  /** Vehicle externalId. */
  vehicle?: string;
  ticketType: TicketType | string;
  description: string;
  status: Status;
  reason?: string;
}

export type UpdateRaiseTicketRequest = Partial<CreateRaiseTicketRequest>;

export interface RaiseTicket extends CreateRaiseTicketRequest {
  id: string | number;
  externalId: string;
  ticketId?: string;
  /** Support reply, when the backend returns one. */
  answer?: string;
  createdAt?: string;
  updatedAt?: string;
}
