import { api } from "../api";
import { Status } from "@/enums/Status";
import type { DriverDetail, CreateDriverDetailRequest, UpdateDriverDetailRequest } from "@/interfaces/DriverDetail";
import { normalizeReason, statusChangeBody } from "@/lib/statusPayload";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type NestedParty =
	| string
	| {
			id?: string | number;
			externalId?: string;
			name?: string;
			companyName?: string;
			vehicle?: string;
			vehicleNo?: string;
			vehicleNickname?: string;
	  }
	| null
	| undefined;

type DriverDetailApiRecord = Omit<
	DriverDetail,
	| "externalId"
	| "client"
	| "transporter"
	| "vehicle"
	| "clientName"
	| "transporterName"
	| "vehicleName"
	| "status"
	| "reason"
> & {
	externalId?: string;
	client?: NestedParty;
	transporter?: NestedParty;
	vehicle?: NestedParty;
	status?: Status | string;
	reason?: string | null;
	active?: boolean;
};

const asId = (value: NestedParty): string => {
	if (!value) return "";
	if (typeof value === "string" || typeof value === "number") return String(value).trim();
	return String(value.externalId ?? value.id ?? "").trim();
};

const asPartyName = (value: NestedParty): string => {
	if (!value) return "";
	if (typeof value === "string") return value;
	return (value.name ?? value.companyName ?? "").trim();
};

const asVehicleName = (value: NestedParty): string => {
	if (!value) return "";
	if (typeof value === "string") return value.trim();
	return (
		value.vehicle?.trim() ||
		value.vehicleNo?.trim() ||
		value.vehicleNickname?.trim() ||
		value.name?.trim() ||
		""
	);
};

const normalizeStatus = (status?: string, active?: boolean): Status => {
	const value = String(status ?? "").trim().toLowerCase();
	if (value === Status.INACTIVE || value === "inactive") return Status.INACTIVE;
	if (value === Status.ACTIVE || value === "active") return Status.ACTIVE;
	if (typeof active === "boolean") return active ? Status.ACTIVE : Status.INACTIVE;
	return Status.ACTIVE;
};

const normalizeDriverDetail = (record: DriverDetailApiRecord): DriverDetail => ({
	...record,
	externalId: String(record?.externalId ?? record?.id ?? ""),
	client: asId(record.client),
	clientName: asPartyName(record.client),
	transporter: asId(record.transporter),
	transporterName: asPartyName(record.transporter),
	vehicle: asId(record.vehicle) || undefined,
	vehicleName: asVehicleName(record.vehicle),
	licenseToDrive: Array.isArray(record.licenseToDrive) ? record.licenseToDrive : [],
	geofences: Array.isArray(record.geofences) ? record.geofences : [],
	status: normalizeStatus(record.status, record.active),
	reason: normalizeReason(record.reason),
});

const normalizeDriverDetailResponse = (response: ApiEnvelope<DriverDetailApiRecord>): DriverDetail => {
	const record = unwrapResponse(response);
	if (!record || typeof record !== "object") {
		throw new Error("Driver detail response did not contain a record.");
	}
	return normalizeDriverDetail(record);
};

export const driverDetailsApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getDriverDetails: builder.query<DriverDetail[], void>({
			query: () => "/driverDetail/getAll",
			transformResponse: (response: ApiEnvelope<DriverDetailApiRecord[]>) =>
				unwrapList(response).map(normalizeDriverDetail),
			providesTags: (result) => [
				{ type: "DriverDetails", id: "LIST" },
				...(result ?? []).map((item) => ({ type: "DriverDetails" as const, id: item.externalId })),
			],
		}),

		getDriverDetailById: builder.query<DriverDetail, string>({
			query: (externalId) => `/driverDetail/getById/${encodeURIComponent(externalId)}`,
			transformResponse: normalizeDriverDetailResponse,
			providesTags: (_result, _error, externalId) => [{ type: "DriverDetails", id: externalId }],
		}),

		createDriverDetail: builder.mutation<DriverDetail, CreateDriverDetailRequest>({
			query: (body) => ({
				url: "/driverDetail/",
				method: "POST",
				body,
			}),
			transformResponse: normalizeDriverDetailResponse,
			invalidatesTags: [{ type: "DriverDetails", id: "LIST" }],
		}),

		updateDriverDetail: builder.mutation<DriverDetail, { externalId: string; body: UpdateDriverDetailRequest }>({
			query: ({ externalId, body }) => ({
				url: `/driverDetail/update/${encodeURIComponent(externalId)}`,
				method: "PUT",
				body,
			}),
			transformResponse: normalizeDriverDetailResponse,
			invalidatesTags: (_result, _error, { externalId }) => [
				{ type: "DriverDetails", id: externalId },
				{ type: "DriverDetails", id: "LIST" },
			],
		}),

		updateDriverDetailStatus: builder.mutation<
			void,
			{ externalId: string; status: Status; reason?: string }
		>({
			query: ({ externalId, status, reason }) => ({
				url: `/driverDetail/update/${encodeURIComponent(externalId)}`,
				method: "PUT",
				body: statusChangeBody(status, reason, {
					active: status === Status.ACTIVE,
					...(reason?.trim() ? { reason: reason.trim() } : {}),
				}),
			}),
			invalidatesTags: (_result, _error, { externalId }) => [
				{ type: "DriverDetails", id: externalId },
				{ type: "DriverDetails", id: "LIST" },
			],
		}),

		deleteDriverDetail: builder.mutation<void, string>({
			query: (externalId) => ({
				url: `/driverDetail/delete/${encodeURIComponent(externalId)}`,
				method: "DELETE",
			}),
			invalidatesTags: (_result, _error, externalId) => [
				{ type: "DriverDetails", id: externalId },
				{ type: "DriverDetails", id: "LIST" },
			],
		}),
	}),
	overrideExisting: false,
});

export const {
	useGetDriverDetailsQuery,
	useGetDriverDetailByIdQuery,
	useLazyGetDriverDetailByIdQuery,
	useCreateDriverDetailMutation,
	useUpdateDriverDetailMutation,
	useUpdateDriverDetailStatusMutation,
	useDeleteDriverDetailMutation,
} = driverDetailsApi;