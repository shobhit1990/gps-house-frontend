import { api } from "../api";
import type {
	DriverAssignment,
	DriverAssignmentApiRecord,
	DriverAssignmentReportParams,
} from "@/interfaces/DriverAssignmentReport";
import { unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type NestedRef = NonNullable<DriverAssignmentApiRecord["client"]>;

const asText = (value: unknown): string => {
	if (value == null) return "";
	if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
		return String(value).trim();
	}
	if (typeof value === "object") {
		const record = value as Record<string, unknown>;
		return asText(
			record.userName ??
				record.ownerName ??
				record.companyName ??
				record.name ??
				record.vehicleNo ??
				record.vehicle ??
				record.vehicleNickname ??
				record.phone ??
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

const nestedPhone = (value: NestedRef): string => {
	if (!value || typeof value === "string") return "";
	return asText(value.phoneNumber ?? value.phone ?? value.mobile);
};

const nestedName = (value: NestedRef): string => {
	if (!value) return "";
	if (typeof value === "string") return value.trim();
	const owner = value.owner && typeof value.owner === "object" ? asText(value.owner.ownerName) : "";
	return asText(value.userName) || asText(value.name) || asText(value.companyName) || owner;
};

const formatDateTime = (value: unknown): string => {
	const raw = asText(value);
	if (!raw) return "";
	const date = new Date(raw);
	if (Number.isNaN(date.getTime())) return raw;
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const formatDuration = (record: DriverAssignmentApiRecord): string => {
	const hours = asNumber(record.hours ?? record.durationHours);
	const minutes = asNumber(record.minutes ?? record.durationMinutes);
	if (hours > 0 || minutes > 0) {
		if (hours > 0 && minutes > 0) return `${hours}H ${minutes}M`;
		if (hours > 0) return `${hours}H`;
		return `${minutes}M`;
	}

	const raw = asText(record.duration);
	if (raw && /[HhMm:]/.test(raw)) return raw;

	const travelMs = asNumber(record.travel?.runningMs);
	if (travelMs > 0) {
		const totalMinutes = Math.round(travelMs / 60000);
		const h = Math.floor(totalMinutes / 60);
		const m = totalMinutes % 60;
		if (h > 0 && m > 0) return `${h}H ${m}M`;
		if (h > 0) return `${h}H`;
		return `${m}M`;
	}

	const durationMinutes =
		asNumber(record.durationMinutes) ||
		(asNumber(record.durationHours) > 0 ? asNumber(record.durationHours) * 60 : asNumber(record.duration));
	if (durationMinutes <= 0) return raw || "—";
	const h = Math.floor(durationMinutes / 60);
	const m = Math.round(durationMinutes % 60);
	if (h > 0 && m > 0) return `${h}H ${m}M`;
	if (h > 0) return `${h}H`;
	return `${m}M`;
};

const formatDistance = (value: unknown): string => {
	const km = asNumber(value);
	if (!Number.isFinite(km) || km < 0) {
		const text = asText(value);
		return text || "—";
	}
	if (km === 0) return "0";
	return Number.isInteger(km) ? String(km) : String(Math.round(km * 10) / 10);
};

const normalizeAssignment = (record: DriverAssignmentApiRecord, index: number): DriverAssignment => {
	const externalId = String(record.externalId ?? record.id ?? index);
	const vehicleNo =
		(typeof record.vehicle === "string" ? record.vehicle.trim() : "") ||
		asText(record.vehicleNo) ||
		asText(record.vehicleNumber) ||
		asText(record.vehicleName) ||
		(typeof record.vehicle === "object" && record.vehicle
			? asText(record.vehicle.vehicleNo ?? record.vehicle.vehicle ?? record.vehicle.vehicleNickname ?? record.vehicle.name)
			: "");

	const driverName =
		asText(record.driverName) ||
		asText(record.ownerName) ||
		(typeof record.driver === "object" || typeof record.driver === "string" ? nestedName(record.driver) : "") ||
		asText(record.name);

	const phone =
		asText(record.phoneNumber ?? record.phone ?? record.mobile) ||
		nestedPhone(record.driver) ||
		nestedPhone(record.client) ||
		nestedPhone(record.transporter);

	const assignedOn = formatDateTime(
		record.assignedOn ??
			record.assignedAt ??
			record.assignmentDate ??
			record.travel?.startTime ??
			record.subscriptionStartDate ??
			record.createdAt ??
			record.startDate ??
			record.fromDate,
	);

	const unassignedOn = formatDateTime(
		record.unassignedOn ??
			record.unassignedAt ??
			record.unassignmentDate ??
			record.travel?.endTime ??
			record.subscriptionDueDate ??
			record.updatedAt ??
			record.endDate ??
			record.toDate,
	);

	return {
		id: String(record.id ?? externalId),
		externalId,
		sn: asNumber(record.sn) || index + 1,
		client: nestedName(record.client) || asText(record.clientName),
		transporter: nestedName(record.transporter) || asText(record.transporterName),
		driverName,
		phone,
		vehicleNo,
		assignedOn,
		unassignedOn,
		assignedBy: asText(record.assignedByName ?? record.assignedBy ?? record.createdBy ?? record.ownedBy),
		duration: formatDuration(record),
		distanceKm: formatDistance(
			record.travel?.distanceKm ?? record.distanceKm ?? record.distance ?? record.totalDistance ?? record.mileage,
		),
	};
};

const unwrapAssignments = (
	response: ApiEnvelope<DriverAssignmentApiRecord[] | DriverAssignmentApiRecord>,
): DriverAssignment[] => {
	const data = unwrapResponse(response);
	if (Array.isArray(data)) return data.map(normalizeAssignment);
	if (data && typeof data === "object") return [normalizeAssignment(data, 0)];
	return [];
};

export const driverAssignmentReportApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getDriverAssignmentReport: builder.query<DriverAssignment[], DriverAssignmentReportParams>({
			query: ({ client, transporter, vehicle, from, to }) => ({
				url: "/driver-assignment",
				params: { client, transporter, vehicle, from, to },
			}),
			transformResponse: (response: ApiEnvelope<DriverAssignmentApiRecord[] | DriverAssignmentApiRecord>) =>
				unwrapAssignments(response),
			providesTags: (result) => [
				{ type: "DriverAssignmentReports" as const, id: "LIST" },
				...(result ?? []).map((item) => ({ type: "DriverAssignmentReports" as const, id: item.externalId })),
			],
		}),
	}),
	overrideExisting: false,
});

export const { useGetDriverAssignmentReportQuery, useLazyGetDriverAssignmentReportQuery } =
	driverAssignmentReportApi;
