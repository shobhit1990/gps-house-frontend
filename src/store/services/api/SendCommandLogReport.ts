import { api } from "../api";
import type {
	SendCommandLogApiRecord,
	SendCommandLogReportParams,
	SendCommandLogRow,
} from "@/interfaces/SendCommandLogReport";
import { unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

const asText = (value: unknown): string => {
	if (value == null) return "";
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
		return String(value).trim();
	}
	if (Array.isArray(value)) {
		return value.map((item) => asText(item)).filter(Boolean).join(", ");
	}
	if (typeof value === "object") {
		const record = value as Record<string, unknown>;
		return asText(
			record.userName ??
				record.vehicleNo ??
				record.vehicle ??
				record.vehicleNickname ??
				record.companyName ??
				record.name ??
				record.imei ??
				record.externalId ??
				record.id,
		);
	}
	return "";
};

const asNumber = (value: unknown): number => {
	if (value === undefined || value === null || value === "") return 0;
	if (typeof value === "number") return Number.isFinite(value) ? value : 0;
	const trimmed = String(value).trim();
	if (!trimmed) return 0;
	const direct = Number(trimmed);
	return Number.isFinite(direct) ? direct : 0;
};

const normalizeSendCommandLog = (record: SendCommandLogApiRecord, index: number): SendCommandLogRow => {
	const externalId = String(record.externalId ?? record.id ?? index);
	const vehicleNumber =
		(typeof record.vehicle === "string" ? record.vehicle.trim() : "") ||
		asText(record.vehicleNumber) ||
		asText(record.vehicleNo) ||
		asText(record.vehicleName) ||
		(typeof record.vehicle === "object" && record.vehicle
			? asText(
					record.vehicle.vehicleNo ??
						record.vehicle.vehicle ??
						record.vehicle.vehicleNickname ??
						record.vehicle.name,
				)
			: "");

	return {
		id: String(record.id ?? externalId),
		externalId,
		sn: asNumber(record.sn) || index + 1,
		vehicleNumber,
		imei:
			asText(record.imei) ||
			asText(record.deviceImei) ||
			(typeof record.vehicle === "object" && record.vehicle ? asText(record.vehicle.imei) : ""),
		transporter: asText(record.transporterName ?? record.transporter),
		client: asText(record.clientName ?? record.client),
		type: asText(record.type ?? record.commandType),
		message: asText(record.message ?? record.command),
		time: asText(record.time ?? record.sentAt ?? record.createdAt ?? record.at),
	};
};

const unwrapSendCommandLogs = (
	response: ApiEnvelope<SendCommandLogApiRecord[] | SendCommandLogApiRecord>,
): SendCommandLogRow[] => {
	const data = unwrapResponse(response);
	if (Array.isArray(data)) return data.map(normalizeSendCommandLog);
	if (data && typeof data === "object") return [normalizeSendCommandLog(data, 0)];
	return [];
};

export const sendCommandLogReportApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getSendCommandLogReport: builder.query<SendCommandLogRow[], SendCommandLogReportParams>({
			query: ({ client, transporter, vehicle, from, to }) => ({
				url: "/sendCommandLogReport",
				params: { client, transporter, vehicle, from, to },
			}),
			transformResponse: (response: ApiEnvelope<SendCommandLogApiRecord[] | SendCommandLogApiRecord>) =>
				unwrapSendCommandLogs(response),
			providesTags: (result) => [
				{ type: "SendCommandLogReports" as const, id: "LIST" },
				...(result ?? []).map((item) => ({ type: "SendCommandLogReports" as const, id: item.externalId })),
			],
		}),
	}),
	overrideExisting: false,
});

export const { useGetSendCommandLogReportQuery, useLazyGetSendCommandLogReportQuery } = sendCommandLogReportApi;
