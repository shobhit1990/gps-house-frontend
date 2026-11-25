import { api } from "../api";
import type {
	StatusReportApiRecord,
	StatusReportParams,
	StatusReportRow,
} from "@/interfaces/StatusReport";
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
			record.address ??
				record.location ??
				record.name ??
				record.vehicleNo ??
				record.vehicle ??
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

const dashOrText = (value: unknown, fallback = "--") => {
	const text = asText(value);
	return text || fallback;
};

const formatCoordinate = (lat: unknown, lng: unknown, combined?: unknown) => {
	const fromCombined = asText(combined);
	if (fromCombined) return fromCombined;
	const latitude = asText(lat);
	const longitude = asText(lng);
	if (latitude && longitude) return `${latitude}, ${longitude}`;
	return latitude || longitude || "--";
};

/** Parse duration into seconds from number (seconds or minutes) or strings like `6H 12M 33S` / `HH:MM:SS`. */
const toDurationSeconds = (record: StatusReportApiRecord): number => {
	const explicit = asNumber(record.durationSeconds);
	if (explicit > 0) return explicit;

	const hours = asNumber(record.hours);
	const minutes = asNumber(record.minutes);
	const seconds = asNumber(record.seconds);
	if (hours > 0 || minutes > 0 || seconds > 0) {
		return hours * 3600 + minutes * 60 + seconds;
	}

	const raw = asText(record.duration ?? record.totalDuration);
	if (!raw) return 0;

	const hms = raw.match(/^(\d+):(\d{1,2}):(\d{1,2})$/);
	if (hms) return Number(hms[1]) * 3600 + Number(hms[2]) * 60 + Number(hms[3]);

	const hm = raw.match(/^(\d+):(\d{1,2})$/);
	if (hm) return Number(hm[1]) * 3600 + Number(hm[2]) * 60;

	const labeledH = Number(raw.match(/(\d+)\s*[Hh]/)?.[1] ?? 0);
	const labeledM = Number(raw.match(/(\d+)\s*[Mm]/)?.[1] ?? 0);
	const labeledS = Number(raw.match(/(\d+)\s*[Ss]/)?.[1] ?? 0);
	if (labeledH || labeledM || labeledS) return labeledH * 3600 + labeledM * 60 + labeledS;

	const numeric = asNumber(raw);
	if (numeric <= 0) return 0;
	// Values under a day are treated as seconds; larger likely minutes-as-number from some APIs.
	if (numeric < 86400) return numeric;
	return numeric;
};

const normalizeStatusReport = (record: StatusReportApiRecord, index: number): StatusReportRow => {
	const externalId = String(record.externalId ?? record.id ?? index);
	const startRef = typeof record.start === "object" && record.start ? record.start : null;
	const endRef = typeof record.end === "object" && record.end ? record.end : null;

	return {
		id: String(record.id ?? externalId),
		externalId,
		sn: asNumber(record.sn) || index + 1,
		status: asText(record.status ?? record.statusType) || "—",
		startDateTime: dashOrText(record.startDateTime ?? record.startTime ?? record.startAt, "—"),
		startAddress: dashOrText(
			record.startAddress ?? record.startLoc ?? record.startLocation ?? startRef?.address ?? startRef?.location,
			"—",
		),
		startCoordinate: formatCoordinate(
			record.startLat ?? record.startLatitude ?? startRef?.lat ?? startRef?.latitude,
			record.startLng ?? record.startLongitude ?? startRef?.lng ?? startRef?.longitude,
			record.startCoordinate,
		),
		endDateTime: dashOrText(record.endDateTime ?? record.endTime ?? record.endAt, "—"),
		endAddress: dashOrText(
			record.endAddress ?? record.endLoc ?? record.endLocation ?? endRef?.address ?? endRef?.location,
			"—",
		),
		endCoordinate: formatCoordinate(
			record.endLat ?? record.endLatitude ?? endRef?.lat ?? endRef?.latitude,
			record.endLng ?? record.endLongitude ?? endRef?.lng ?? endRef?.longitude,
			record.endCoordinate,
		),
		sPoi: dashOrText(record.sPoi ?? record.startPoi),
		ePoi: dashOrText(record.ePoi ?? record.endPoi),
		maxSpeed: dashOrText(record.maxSpeed ?? record.maximumSpeed),
		avgSpeed: dashOrText(record.avgSpeed ?? record.averageSpeed),
		totalDistance: asNumber(record.totalDistance ?? record.distance),
		durationSeconds: toDurationSeconds(record),
	};
};

const unwrapStatusReports = (
	response: ApiEnvelope<StatusReportApiRecord[] | StatusReportApiRecord>,
): StatusReportRow[] => {
	const data = unwrapResponse(response);
	if (Array.isArray(data)) return data.map(normalizeStatusReport);
	if (data && typeof data === "object") return [normalizeStatusReport(data, 0)];
	return [];
};

export const statusReportApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getStatusReport: builder.query<StatusReportRow[], StatusReportParams>({
			query: ({ client, transporter, vehicle, status, from, to }) => ({
				url: "/status-report",
				params: { client, transporter, vehicle, status, from, to },
			}),
			transformResponse: (response: ApiEnvelope<StatusReportApiRecord[] | StatusReportApiRecord>) =>
				unwrapStatusReports(response),
			providesTags: (result) => [
				{ type: "StatusReports" as const, id: "LIST" },
				...(result ?? []).map((item) => ({ type: "StatusReports" as const, id: item.externalId })),
			],
		}),
	}),
	overrideExisting: false,
});

export const { useGetStatusReportQuery, useLazyGetStatusReportQuery } = statusReportApi;
