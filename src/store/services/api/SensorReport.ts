import { api } from "../api";
import type {
	SensorReportApiRecord,
	SensorReportParams,
	SensorReportRow,
} from "@/interfaces/SensorReport";
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

const normalizeSensorReport = (record: SensorReportApiRecord, index: number): SensorReportRow => {
	const externalId = String(record.externalId ?? record.id ?? index);
	const vehicleNo =
		(typeof record.vehicle === "string" ? record.vehicle.trim() : "") ||
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
		vehicleNo,
		type: asText(record.type ?? record.reportType ?? record.sensorType),
		medium: asText(record.medium),
		createdBy: asText(record.createdByName ?? record.createdBy),
		location: asText(record.location ?? record.locations) || "—",
		added: asText(record.added ?? record.createdAt ?? record.at),
		address: asText(record.address) || "—",
	};
};

const unwrapSensorReports = (
	response: ApiEnvelope<SensorReportApiRecord[] | SensorReportApiRecord>,
): SensorReportRow[] => {
	const data = unwrapResponse(response);
	if (Array.isArray(data)) return data.map(normalizeSensorReport);
	if (data && typeof data === "object") return [normalizeSensorReport(data, 0)];
	return [];
};

export const sensorReportApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getSensorReport: builder.query<SensorReportRow[], SensorReportParams>({
			query: ({ client, transporter, vehicle, reportType, from, to, search }) => ({
				url: "/sensor-report",
				params: {
					client,
					transporter,
					vehicle,
					reportType,
					from,
					to,
					...(search?.trim() ? { search: search.trim() } : {}),
				},
			}),
			transformResponse: (response: ApiEnvelope<SensorReportApiRecord[] | SensorReportApiRecord>) =>
				unwrapSensorReports(response),
			providesTags: (result) => [
				{ type: "SensorReports" as const, id: "LIST" },
				...(result ?? []).map((item) => ({ type: "SensorReports" as const, id: item.externalId })),
			],
		}),
	}),
	overrideExisting: false,
});

export const { useGetSensorReportQuery, useLazyGetSensorReportQuery } = sensorReportApi;
