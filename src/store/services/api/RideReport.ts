import { api } from "../api";
import type { RideReportApiRecord, RideReportParams, RideReportRow } from "@/interfaces/RideReport";
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

const formatCoordinate = (combined: unknown, lat: unknown, lng: unknown) => {
	const fromCombined = asText(combined);
	if (fromCombined) return fromCombined;
	const latitude = asText(lat);
	const longitude = asText(lng);
	if (latitude && longitude) return `${latitude}, ${longitude}`;
	return latitude || longitude || "";
};

const normalizeRideReport = (record: RideReportApiRecord, index: number): RideReportRow => {
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
		startDateTime: asText(record.startDateTime ?? record.startTime ?? record.startAt),
		startCoordinate: formatCoordinate(record.startCoordinate, record.startLat, record.startLng),
		sPoi: asText(record.sPoi ?? record.startPoi) || "—",
		startAddress: asText(record.startAddress) || "—",
		endDateTime: asText(record.endDateTime ?? record.endTime ?? record.endAt),
		endCoordinate: formatCoordinate(record.endCoordinate, record.endLat, record.endLng),
		ePoi: asText(record.ePoi ?? record.endPoi) || "—",
		endAddress: asText(record.endAddress) || "—",
		totalDistance: asText(record.totalDistance ?? record.distance) || "0",
		duration: asText(record.duration) || "—",
		reportCount: asText(record.reportCount ?? record.numberOfReports ?? record.count) || "0",
	};
};

const unwrapRideReports = (
	response: ApiEnvelope<RideReportApiRecord[] | RideReportApiRecord>,
): RideReportRow[] => {
	const data = unwrapResponse(response);
	if (Array.isArray(data)) return data.map(normalizeRideReport);
	if (data && typeof data === "object") return [normalizeRideReport(data, 0)];
	return [];
};

export const rideReportApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getRideReport: builder.query<RideReportRow[], RideReportParams>({
			query: ({ client, transporter, vehicle, duration, from, to, search }) => ({
				url: "/ride-report",
				params: {
					client,
					transporter,
					vehicle,
					duration,
					from,
					to,
					...(search?.trim() ? { search: search.trim() } : {}),
				},
			}),
			transformResponse: (response: ApiEnvelope<RideReportApiRecord[] | RideReportApiRecord>) =>
				unwrapRideReports(response),
			providesTags: (result) => [
				{ type: "RideReports" as const, id: "LIST" },
				...(result ?? []).map((item) => ({ type: "RideReports" as const, id: item.externalId })),
			],
		}),
	}),
	overrideExisting: false,
});

export const { useGetRideReportQuery, useLazyGetRideReportQuery } = rideReportApi;
