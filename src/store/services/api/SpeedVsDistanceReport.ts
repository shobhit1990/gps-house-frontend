import { api } from "../api";
import type {
	SpeedVsDistanceApiRecord,
	SpeedVsDistanceReportParams,
	SpeedVsDistanceRow,
} from "@/interfaces/SpeedVsDistanceReport";
import { unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

const asText = (value: unknown): string => {
	if (value == null) return "";
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
		return String(value).trim();
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
	if (!Number.isFinite(direct)) return 0;
	return Math.round(direct * 10) / 10;
};

const normalizeSpeedRow = (record: SpeedVsDistanceApiRecord, index: number): SpeedVsDistanceRow => {
	const externalId = String(record.externalId ?? record.id ?? index);
	const vehicle =
		(typeof record.vehicle === "string" ? record.vehicle.trim() : "") ||
		asText(record.vehicleNo) ||
		asText(record.vehicleName) ||
		(typeof record.vehicle === "object" && record.vehicle
			? asText(record.vehicle.vehicleNo ?? record.vehicle.vehicle ?? record.vehicle.vehicleNickname ?? record.vehicle.name)
			: "");

	const km0 = asNumber(record.km0 ?? record.speed0to40 ?? record["0-40"] ?? record.bands?.km0);
	const km40 = asNumber(record.km40 ?? record.speed40to60 ?? record["40-60"] ?? record.bands?.km40);
	const km60 = asNumber(record.km60 ?? record.speed60to80 ?? record["60-80"] ?? record.bands?.km60);
	const km80 = asNumber(record.km80 ?? record.speed80Plus ?? record["80+"] ?? record.bands?.km80);
	const totalFromBands = Math.round((km0 + km40 + km60 + km80) * 10) / 10;
	const total = asNumber(record.totalDistanceKm ?? record.totalDistance ?? record.total) || totalFromBands;

	return {
		id: String(record.id ?? externalId),
		externalId,
		sn: asNumber(record.sn) || index + 1,
		client: asText(record.clientName ?? record.client),
		transporter: asText(record.transporterName ?? record.transporter),
		vehicle,
		km0,
		km40,
		km60,
		km80,
		total,
	};
};

const unwrapSpeedRows = (
	response: ApiEnvelope<SpeedVsDistanceApiRecord[] | SpeedVsDistanceApiRecord>,
): SpeedVsDistanceRow[] => {
	const data = unwrapResponse(response);
	if (Array.isArray(data)) return data.map(normalizeSpeedRow);
	if (data && typeof data === "object") return [normalizeSpeedRow(data, 0)];
	return [];
};

export const speedVsDistanceReportApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getSpeedVsDistanceReport: builder.query<SpeedVsDistanceRow[], SpeedVsDistanceReportParams>({
			query: ({ client, transporter, vehicle, from, to, search = "" }) => ({
				url: "/speed-and-distance-report",
				params: { client, transporter, vehicle, from, to, search },
			}),
			transformResponse: (response: ApiEnvelope<SpeedVsDistanceApiRecord[] | SpeedVsDistanceApiRecord>) =>
				unwrapSpeedRows(response),
			providesTags: (result) => [
				{ type: "SpeedVsDistanceReports" as const, id: "LIST" },
				...(result ?? []).map((item) => ({ type: "SpeedVsDistanceReports" as const, id: item.externalId })),
			],
		}),
	}),
	overrideExisting: false,
});

export const { useGetSpeedVsDistanceReportQuery, useLazyGetSpeedVsDistanceReportQuery } =
	speedVsDistanceReportApi;
