import { api } from "../api";
import type {
	GeofenceReportApiRecord,
	GeofenceReportParams,
	GeofenceReportRow,
} from "@/interfaces/GeofenceReport";
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
			record.geoName ??
				record.geofenceName ??
				record.vehicleNo ??
				record.vehicle ??
				record.vehicleNickname ??
				record.companyName ??
				record.userName ??
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

const formatHaltTime = (record: GeofenceReportApiRecord): string => {
	const raw = asText(record.haltTime ?? record.duration ?? record.totalDuration);
	if (raw && /[HhMm:]/.test(raw)) return raw;

	const totalMinutes = asNumber(record.haltTime ?? record.duration ?? record.totalDuration);
	if (totalMinutes <= 0) return raw || "—";
	const h = Math.floor(totalMinutes / 60);
	const m = Math.round(totalMinutes % 60);
	if (h > 0 && m > 0) return `${h}H ${m}M`;
	if (h > 0) return `${h}H`;
	return `${m}M`;
};

const normalizeGeofenceRow = (record: GeofenceReportApiRecord, index: number): GeofenceReportRow => {
	const externalId = String(record.externalId ?? record.id ?? index);
	const vehicle =
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

	const geoName =
		asText(record.geoName) ||
		asText(record.geofenceName) ||
		asText(record.geofence) ||
		"—";

	return {
		id: String(record.id ?? externalId),
		externalId,
		sn: asNumber(record.sn) || index + 1,
		client: asText(record.clientName ?? record.client),
		transporter: asText(record.transporterName ?? record.transporter),
		vehicle: vehicle || "—",
		geoName,
		inTime: asText(record.inTime ?? record.arrivalTime ?? record.startTime) || "—",
		outTime: asText(record.outTime ?? record.departureTime ?? record.endTime) || "—",
		inLoc: asText(record.inLoc ?? record.inLocation ?? record.location) || "—",
		outLoc: asText(record.outLoc ?? record.outLocation ?? record.address) || "—",
		haltTime: formatHaltTime(record),
		distance: asText(record.distance) || "—",
		reportType: asText(record.reportType ?? record.type) || "—",
		remark: asText(record.remark ?? record.status) || "—",
	};
};

const unwrapGeofenceRows = (
	response: ApiEnvelope<
		| GeofenceReportApiRecord[]
		| GeofenceReportApiRecord
		| { rows?: GeofenceReportApiRecord[]; data?: GeofenceReportApiRecord[]; list?: GeofenceReportApiRecord[] }
	>,
): GeofenceReportRow[] => {
	const data = unwrapResponse(response);
	if (Array.isArray(data)) return data.map(normalizeGeofenceRow);
	if (data && typeof data === "object") {
		const nested = data as {
			rows?: GeofenceReportApiRecord[];
			data?: GeofenceReportApiRecord[];
			list?: GeofenceReportApiRecord[];
		};
		const list = nested.rows ?? nested.data ?? nested.list;
		if (Array.isArray(list)) return list.map(normalizeGeofenceRow);
		return [normalizeGeofenceRow(data as GeofenceReportApiRecord, 0)];
	}
	return [];
};

export const geofenceReportApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getGeofenceReport: builder.query<GeofenceReportRow[], GeofenceReportParams>({
			query: ({ client, transporter, vehicle, duration, from, to }) => ({
				url: "/geofence-report",
				params: { client, transporter, vehicle, duration, from, to },
			}),
			transformResponse: (
				response: ApiEnvelope<
					| GeofenceReportApiRecord[]
					| GeofenceReportApiRecord
					| { rows?: GeofenceReportApiRecord[]; data?: GeofenceReportApiRecord[]; list?: GeofenceReportApiRecord[] }
				>,
			) => {
				try {
					return unwrapGeofenceRows(response);
				} catch (error) {
					console.error("Failed to normalize geofence report.", error);
					return [];
				}
			},
			providesTags: (result) => [
				{ type: "GeofenceReports" as const, id: "LIST" },
				...(result ?? []).map((item) => ({ type: "GeofenceReports" as const, id: item.externalId })),
			],
		}),
	}),
	overrideExisting: false,
});

export const { useGetGeofenceReportQuery, useLazyGetGeofenceReportQuery } = geofenceReportApi;
