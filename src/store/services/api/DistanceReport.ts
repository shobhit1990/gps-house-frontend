import { api } from "../api";
import type {
	DistanceReportApiRecord,
	DistanceReportParams,
	DistanceReportRow,
} from "@/interfaces/DistanceReport";
import { unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

const asText = (value: unknown): string => {
	if (value == null) return "";
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
		return String(value).trim();
	}
	if (typeof value === "object") {
		const record = value as Record<string, unknown>;
		return asText(
			record.vehicleNo ??
				record.vehicle ??
				record.vehicleNickname ??
				record.vehicleAlias ??
				record.alias ??
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
	return Number.isFinite(direct) ? direct : 0;
};

const recordedKm = (value: unknown) => {
	const km = asNumber(value);
	if (km <= 0) return 0;
	return Math.round(km * 10) / 10;
};

/** Normalize assorted date keys into DD/MM/YYYY when possible. */
const normalizeDayKey = (value: unknown): string => {
	const raw = asText(value);
	if (!raw) return "";
	if (/^\d{2}\/\d{2}\/\d{4}$/.test(raw)) return raw;
	const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
	if (iso) return `${iso[3]}/${iso[2]}/${iso[1]}`;
	const date = new Date(raw);
	if (!Number.isNaN(date.getTime())) {
		const day = String(date.getDate()).padStart(2, "0");
		const month = String(date.getMonth() + 1).padStart(2, "0");
		return `${day}/${month}/${date.getFullYear()}`;
	}
	return raw;
};

const mergeDayMap = (target: Record<string, number>, source: Record<string, number>) => {
	for (const [day, km] of Object.entries(source)) {
		target[day] = recordedKm((target[day] ?? 0) + km);
	}
};

const dayMapFromRecord = (record: DistanceReportApiRecord): Record<string, number> => {
	const byDay: Record<string, number> = {};

	const absorbObject = (value: Record<string, number | string | null> | null | undefined) => {
		if (!value || typeof value !== "object") return;
		for (const [key, km] of Object.entries(value)) {
			const day = normalizeDayKey(key);
			if (!day) continue;
			byDay[day] = recordedKm((byDay[day] ?? 0) + recordedKm(km));
		}
	};

	absorbObject(record.byDay ?? undefined);
	absorbObject(record.dailyDistance ?? undefined);
	absorbObject(record.dayWise ?? undefined);
	if (record.distances && !Array.isArray(record.distances)) {
		absorbObject(record.distances);
	}

	const absorbPoints = (
		points:
			| Array<{
					date?: string;
					day?: string;
					dayKey?: string;
					distance?: number | string;
					mileage?: number | string;
			  }>
			| null
			| undefined,
	) => {
		if (!Array.isArray(points)) return;
		for (const point of points) {
			const day = normalizeDayKey(point.dayKey ?? point.day ?? point.date);
			if (!day) continue;
			byDay[day] = recordedKm((byDay[day] ?? 0) + recordedKm(point.distance ?? point.mileage));
		}
	};

	if (Array.isArray(record.distances)) absorbPoints(record.distances);
	absorbPoints(record.chartData ?? undefined);

	const singleDay = normalizeDayKey(record.dayKey ?? record.day ?? record.date);
	if (singleDay) {
		const km = recordedKm(record.distance ?? record.mileage);
		if (km > 0) byDay[singleDay] = recordedKm((byDay[singleDay] ?? 0) + km);
	}

	return byDay;
};

const normalizeDistanceRow = (record: DistanceReportApiRecord, index: number): DistanceReportRow => {
	const byDay = dayMapFromRecord(record);
	const totalFromDays = Object.values(byDay).reduce((sum, km) => sum + km, 0);
	const externalId = String(record.externalId ?? record.id ?? index);
	return {
		id: externalId,
		externalId,
		client: asText(record.clientName ?? record.client),
		transporter: asText(record.transporterName ?? record.transporter),
		vehicle: asText(record.vehicleNo ?? record.vehicleName ?? record.vehicle),
		alias: asText(record.vehicleAlias ?? record.vehicleNickname ?? record.alias) || "—",
		byDay,
		total: recordedKm(record.totalDistanceKm ?? record.totalDistance ?? record.distance) || totalFromDays,
	};
};

const unwrapDistanceRows = (
	response: ApiEnvelope<DistanceReportApiRecord[] | DistanceReportApiRecord | { rows?: DistanceReportApiRecord[]; data?: DistanceReportApiRecord[] }>,
): DistanceReportRow[] => {
	const payload = unwrapResponse(response);
	let list: DistanceReportApiRecord[] = [];
	if (Array.isArray(payload)) {
		list = payload;
	} else if (payload && typeof payload === "object") {
		const nested = payload as { rows?: DistanceReportApiRecord[]; data?: DistanceReportApiRecord[] };
		if (Array.isArray(nested.rows)) list = nested.rows;
		else if (Array.isArray(nested.data)) list = nested.data;
		else list = [payload as DistanceReportApiRecord];
	}

	const grouped = new Map<string, DistanceReportRow>();
	list.forEach((record, index) => {
		const row = normalizeDistanceRow(record, index);
		const key = row.vehicle || row.externalId || String(index);
		const existing = grouped.get(key);
		if (!existing) {
			grouped.set(key, { ...row, id: key, externalId: key });
			return;
		}
		mergeDayMap(existing.byDay, row.byDay);
		existing.total = recordedKm(existing.total + row.total) || Object.values(existing.byDay).reduce((sum, km) => sum + km, 0);
		if (existing.alias === "—" && row.alias !== "—") existing.alias = row.alias;
		if (!existing.client && row.client) existing.client = row.client;
		if (!existing.transporter && row.transporter) existing.transporter = row.transporter;
	});

	return [...grouped.values()];
};

export const distanceReportApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getDistanceReport: builder.query<DistanceReportRow[], DistanceReportParams>({
			query: ({ client, transporter, vehicle, from, to, reportType, sortOrder }) => ({
				url: "/distance-reports",
				params: { client, transporter, vehicle, from, to, reportType, sortOrder },
			}),
			transformResponse: (
				response: ApiEnvelope<
					DistanceReportApiRecord[] | DistanceReportApiRecord | { rows?: DistanceReportApiRecord[]; data?: DistanceReportApiRecord[] }
				>,
			) => unwrapDistanceRows(response),
			providesTags: (result) => [
				{ type: "DistanceReports" as const, id: "LIST" },
				...(result ?? []).map((item) => ({ type: "DistanceReports" as const, id: item.externalId })),
			],
		}),
	}),
	overrideExisting: false,
});

export const { useGetDistanceReportQuery, useLazyGetDistanceReportQuery } = distanceReportApi;
