import { api } from "../api";
import type { DriverDetail, CreateDriverDetailRequest, UpdateDriverDetailRequest } from "@/interfaces/DriverDetail";
import { unwrapList, unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

type DriverDetailApiRecord = Omit<DriverDetail, "externalId"> & { externalId?: string };

const normalizeDriverDetail = (record: DriverDetailApiRecord): DriverDetail => ({
	...record,
	externalId: String(record?.externalId ?? record?.id ?? ""),
});

const normalizeDriverDetailResponse = (response: ApiEnvelope<DriverDetailApiRecord>): DriverDetail => {
	const record = unwrapResponse(response);
	if (!record) throw new Error("Driver detail response did not contain a record.");
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
	useDeleteDriverDetailMutation,
} = driverDetailsApi;