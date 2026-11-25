import { api } from "../api";
import type {
	IdleSummary,
	IdleSummaryApiRecord,
	IdleSummaryReportParams,
} from "@/interfaces/IdleSummaryReport";
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
				record.address ??
				record.location ??
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

const formatDuration = (record: IdleSummaryApiRecord): string => {
	const raw = asText(record.totalDuration ?? record.idleDuration ?? record.duration);
	if (raw && /[HhMm:]/.test(raw)) return raw;

	const hours = asNumber(record.hours);
	const minutes = asNumber(record.minutes);
	if (hours > 0 || minutes > 0) {
		if (hours > 0 && minutes > 0) return `${hours}H ${minutes}M`;
		if (hours > 0) return `${hours}H`;
		return `${minutes}M`;
	}

	const totalMinutes = asNumber(record.totalDuration ?? record.idleDuration ?? record.duration);
	if (totalMinutes <= 0) return raw || "—";
	const h = Math.floor(totalMinutes / 60);
	const m = Math.round(totalMinutes % 60);
	if (h > 0 && m > 0) return `${h}H ${m}M`;
	if (h > 0) return `${h}H`;
	return `${m}M`;
};

const normalizeIdleSummary = (record: IdleSummaryApiRecord, index: number): IdleSummary => {
	const externalId = String(record.externalId ?? record.id ?? index);
	const vehicle =
		(typeof record.vehicle === "string" ? record.vehicle.trim() : "") ||
		asText(record.vehicleNo) ||
		asText(record.vehicleName) ||
		(typeof record.vehicle === "object" && record.vehicle
			? asText(record.vehicle.vehicleNo ?? record.vehicle.vehicle ?? record.vehicle.vehicleNickname ?? record.vehicle.name)
			: "");

	return {
		id: String(record.id ?? externalId),
		externalId,
		sn: asNumber(record.sn) || index + 1,
		client: asText(record.clientName ?? record.client),
		transporter: asText(record.transporterName ?? record.transporter),
		vehicle,
		totalDuration: formatDuration(record),
		count: asText(record.count ?? record.idleCount) || "0",
		locations: asText(record.locations ?? record.location ?? record.address) || "—",
		status: asText(record.status),
	};
};

const unwrapIdleSummaries = (
	response: ApiEnvelope<IdleSummaryApiRecord[] | IdleSummaryApiRecord>,
): IdleSummary[] => {
	const data = unwrapResponse(response);
	if (Array.isArray(data)) return data.map(normalizeIdleSummary);
	if (data && typeof data === "object") return [normalizeIdleSummary(data, 0)];
	return [];
};

export const idleSummaryReportApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getIdleSummaryReport: builder.query<IdleSummary[], IdleSummaryReportParams>({
			query: ({ client, transporter, vehicle, from, to, duration, status }) => ({
				url: "/idle-summary-report",
				params: { client, transporter, vehicle, from, to, duration, status },
			}),
			transformResponse: (response: ApiEnvelope<IdleSummaryApiRecord[] | IdleSummaryApiRecord>) =>
				unwrapIdleSummaries(response),
			providesTags: (result) => [
				{ type: "IdleSummaryReports" as const, id: "LIST" },
				...(result ?? []).map((item) => ({ type: "IdleSummaryReports" as const, id: item.externalId })),
			],
		}),
	}),
	overrideExisting: false,
});

export const { useGetIdleSummaryReportQuery, useLazyGetIdleSummaryReportQuery } = idleSummaryReportApi;
