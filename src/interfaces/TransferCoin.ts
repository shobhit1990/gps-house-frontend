import type { Status } from "@/enums/Status";

export type TransferCoinAssignTo = "client" | "transporter";

export interface CreateTransferCoinRequest {
  assignTo: TransferCoinAssignTo;
  /** Client externalId when assignTo is client; otherwise null. */
  client?: string | null;
  /** Transporter externalId when assignTo is transporter; otherwise null. */
  transporter?: string | null;
  coins: number;
  status: Status;
  reason?: string;
}

export type UpdateTransferCoinRequest = Partial<CreateTransferCoinRequest>;

export interface TransferCoin extends CreateTransferCoinRequest {
  id: string | number;
  externalId: string;
  /** Optional display fields returned by the API. */
  from?: string;
  to?: string;
  coinsDebit?: number;
  coinsCredit?: number;
  remainingCoins?: number;
  createdAt?: string;
  updatedAt?: string;
}
