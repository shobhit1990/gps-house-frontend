import { api } from "../api";
import type {
  CreateTransferCoinRequest,
  TransferCoin,
  TransferCoinAssignTo,
  UpdateTransferCoinRequest,
} from "@/interfaces/TransferCoin";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type RefLike = string | { externalId?: string; id?: string | number; name?: string } | null | undefined;

type TransferCoinApiRecord = Omit<TransferCoin, "externalId" | "coins" | "client" | "transporter" | "assignTo"> & {
  externalId?: string;
  coins?: number;
  coinsDebit?: number;
  assignTo?: string;
  client?: RefLike;
  transporter?: RefLike;
};

const asExternalId = (value: RefLike): string | null => {
  if (value == null || value === "") return null;
  if (typeof value === "string") return value;
  const id = value.externalId ?? value.id;
  return id == null || id === "" ? null : String(id);
};

const asDisplayName = (value: RefLike): string => {
  if (!value || typeof value === "string") return "";
  return value.name?.trim() ?? "";
};

const asAssignTo = (record: TransferCoinApiRecord): TransferCoinAssignTo => {
  const raw = String(record?.assignTo ?? "").toLowerCase();
  if (raw === "transporter") return "transporter";
  if (raw === "client") return "client";
  return asExternalId(record?.transporter) ? "transporter" : "client";
};

const normalizeTransferCoin = (record: TransferCoinApiRecord): TransferCoin => {
  const assignTo = asAssignTo(record);
  const client = asExternalId(record?.client);
  const transporter = asExternalId(record?.transporter);
  const coins = Number(record?.coins ?? record?.coinsDebit ?? 0);
  const nestedTo = assignTo === "transporter" ? asDisplayName(record?.transporter) : asDisplayName(record?.client);

  return {
    ...record,
    externalId: String(record?.externalId ?? record?.id ?? ""),
    assignTo,
    client: assignTo === "client" ? client : null,
    transporter: assignTo === "transporter" ? transporter : null,
    coins,
    to: record?.to?.trim() || nestedTo || undefined,
    coinsDebit: Number(record?.coinsDebit ?? coins),
    coinsCredit: Number(record?.coinsCredit ?? 0),
    remainingCoins: Number(record?.remainingCoins ?? 0),
  };
};

export const transferCoinApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getTransferCoins: builder.query<TransferCoin[], void>({
      query: () => "/transferCoin/getAll",
      transformResponse: (response: ApiEnvelope<TransferCoinApiRecord[]>) =>
        unwrapList(response).map(normalizeTransferCoin),
      providesTags: (result) => [
        { type: "TransferCoins", id: "LIST" },
        ...(result ?? []).map((item) => ({ type: "TransferCoins" as const, id: item.externalId })),
      ],
    }),

    getTransferCoinById: builder.query<TransferCoin, string>({
      query: (externalId) => `/transferCoin/getById/${encodeURIComponent(externalId)}`,
      transformResponse: (response: ApiEnvelope<TransferCoinApiRecord>) =>
        normalizeTransferCoin(unwrapResponse(response)!),
      providesTags: (_result, _error, externalId) => [{ type: "TransferCoins", id: externalId }],
    }),

    createTransferCoin: builder.mutation<TransferCoin, CreateTransferCoinRequest>({
      query: (body) => ({
        url: "/transferCoin/",
        method: "POST",
        body: {
          assignTo: body.assignTo,
          client: body.assignTo === "client" ? body.client : null,
          transporter: body.assignTo === "transporter" ? body.transporter : null,
          coins: body.coins,
          status: body.status,
          reason: body.reason,
        },
      }),
      transformResponse: (response: ApiEnvelope<TransferCoinApiRecord>) =>
        normalizeTransferCoin(unwrapResponse(response)!),
      invalidatesTags: [{ type: "TransferCoins", id: "LIST" }],
    }),

    updateTransferCoin: builder.mutation<TransferCoin, { externalId: string; body: UpdateTransferCoinRequest }>({
      query: ({ externalId, body }) => ({
        url: `/transferCoin/update/${encodeURIComponent(externalId)}`,
        method: "PUT",
        body,
      }),
      transformResponse: (response: ApiEnvelope<TransferCoinApiRecord>) =>
        normalizeTransferCoin(unwrapResponse(response)!),
      invalidatesTags: (_result, _error, { externalId }) => [
        { type: "TransferCoins", id: externalId },
        { type: "TransferCoins", id: "LIST" },
      ],
    }),

    deleteTransferCoin: builder.mutation<void, string>({
      query: (externalId) => ({
        url: `/transferCoin/delete/${encodeURIComponent(externalId)}`,
        method: "DELETE",
      }),
      invalidatesTags: (_result, _error, externalId) => [
        { type: "TransferCoins", id: externalId },
        { type: "TransferCoins", id: "LIST" },
      ],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetTransferCoinsQuery,
  useGetTransferCoinByIdQuery,
  useCreateTransferCoinMutation,
  useUpdateTransferCoinMutation,
  useDeleteTransferCoinMutation,
} = transferCoinApi;
