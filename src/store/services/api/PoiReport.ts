import { api } from "../api";
import type {
	PoiReportApiRecord,
	PoiReportParams,
	PoiReportRow,
} from "@/interfaces/PoiReport";
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
			record.poiName ??
				record.geoName ??
				record.geofenceName ??
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

const formatDuration = (record: PoiReportApiRecord): string => {
	const raw = asText(record.duration ?? record.haltTime ?? record.totalDuration);
	if (raw && /[HhMm:]/.test(raw)) return raw;

	const totalMinutes = asNumber(record.duration ?? record.haltTime ?? record.totalDuration);
	if (totalMinutes <= 0) return raw || "—";
	const h = Math.floor(totalMinutes / 60);
	const m = Math.round(totalMinutes % 60);
	if (h > 0 && m > 0) return `${h}H ${m}M`;
	if (h > 0) return `${h}H`;
	return `${m}M`;
};

const normalizePoiRow = (record: PoiReportApiRecord, index: number): PoiReportRow => {
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

	const poiName =
		asText(record.poiName) ||
		asText(record.geoName) ||
		asText(record.geofenceName) ||
		asText(record.poi) ||
		"—";

	return {
		id: String(record.id ?? externalId),
		externalId,
		sn: asNumber(record.sn) || index + 1,
		vehicle: vehicle || "—",
		poiName,
		inTime: asText(record.inTime ?? record.arrivalTime ?? record.startTime) || "—",
		outTime: asText(record.outTime ?? record.departureTime ?? record.endTime) || "—",
		duration: formatDuration(record),
		location:
			asText(record.location ?? record.address ?? record.inLoc ?? record.outLoc) || "—",
		distance: asText(record.distance) || "—",
		reportType: asText(record.reportType ?? record.type) || "—",
		remark: asText(record.remark ?? record.status) || "—",
	};
};

const unwrapPoiRows = (
	response: ApiEnvelope<
		| PoiReportApiRecord[]
		| PoiReportApiRecord
		| { rows?: PoiReportApiRecord[]; data?: PoiReportApiRecord[]; list?: PoiReportApiRecord[] }
	>,
): PoiReportRow[] => {
	const data = unwrapResponse(response);
	if (Array.isArray(data)) return data.map(normalizePoiRow);
	if (data && typeof data === "object") {
		const nested = data as {
			rows?: PoiReportApiRecord[];
			data?: PoiReportApiRecord[];
			list?: PoiReportApiRecord[];
		};
		const list = nested.rows ?? nested.data ?? nested.list;
		if (Array.isArray(list)) return list.map(normalizePoiRow);
		return [normalizePoiRow(data as PoiReportApiRecord, 0)];
	}
	return [];
};

export const poiReportApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getPoiReport: builder.query<PoiReportRow[], PoiReportParams>({
			query: ({ type, filterType, transporter, group, vehicle, from, to }) => ({
				url: "/poi-report",
				params: {
					type,
					filterType,
					...(transporter ? { transporter } : {}),
					...(group ? { group } : {}),
					vehicle,
					from,
					to,
				},
			}),
			transformResponse: (
				response: ApiEnvelope<
					| PoiReportApiRecord[]
					| PoiReportApiRecord
					| { rows?: PoiReportApiRecord[]; data?: PoiReportApiRecord[]; list?: PoiReportApiRecord[] }
				>,
			) => {
				try {
					return unwrapPoiRows(response);
				} catch (error) {
					console.error("Failed to normalize POI report.", error);
					return [];
				}
			},
			providesTags: (result) => [
				{ type: "PoiReports" as const, id: "LIST" },
				...(result ?? []).map((item) => ({ type: "PoiReports" as const, id: item.externalId })),
			],
		}),
	}),
	overrideExisting: false,
});

export const { useGetPoiReportQuery, useLazyGetPoiReportQuery } = poiReportApi;
