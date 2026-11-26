import { api } from "../api";
import type {
	RegisterMobileApiRecord,
	RegisterMobileReportParams,
	RegisterMobileRow,
} from "@/interfaces/RegisterMobileReport";
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
				record.username ??
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
	return Number.isFinite(direct) ? direct : 0;
};

const normalizeRegisterMobile = (record: RegisterMobileApiRecord, index: number): RegisterMobileRow => {
	const externalId = String(record.externalId ?? record.id ?? index);
	return {
		id: String(record.id ?? externalId),
		externalId,
		sn: asNumber(record.sn) || index + 1,
		username: asText(record.username ?? record.userName ?? record.name),
		activeCount: asText(record.activeCount ?? record.mobileCount ?? record.count) || "0",
		userType: asText(record.userType ?? record.type),
		client: asText(record.clientName ?? record.client),
		transporter: asText(record.transporterName ?? record.transporter),
	};
};

const unwrapRegisterMobile = (
	response: ApiEnvelope<RegisterMobileApiRecord[] | RegisterMobileApiRecord>,
): RegisterMobileRow[] => {
	const data = unwrapResponse(response);
	if (Array.isArray(data)) return data.map(normalizeRegisterMobile);
	if (data && typeof data === "object") return [normalizeRegisterMobile(data, 0)];
	return [];
};

export const registerMobileReportApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getRegisterMobileReport: builder.query<RegisterMobileRow[], RegisterMobileReportParams>({
			query: ({ client, type, user, transporter }) => ({
				url: "/register-mobile-report",
				params: {
					client,
					type,
					...(user ? { user } : {}),
					...(transporter ? { transporter } : {}),
				},
			}),
			transformResponse: (response: ApiEnvelope<RegisterMobileApiRecord[] | RegisterMobileApiRecord>) =>
				unwrapRegisterMobile(response),
			providesTags: (result) => [
				{ type: "RegisterMobileReports" as const, id: "LIST" },
				...(result ?? []).map((item) => ({ type: "RegisterMobileReports" as const, id: item.externalId })),
			],
		}),
	}),
	overrideExisting: false,
});

export const { useGetRegisterMobileReportQuery, useLazyGetRegisterMobileReportQuery } = registerMobileReportApi;
