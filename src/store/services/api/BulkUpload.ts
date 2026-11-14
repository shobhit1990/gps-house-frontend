import { api } from "../api";

export const bulkUploadApi = api.injectEndpoints({
	endpoints: (builder) => ({
		exportServiceMaintenanceDemo: builder.mutation<Blob, void>({
			query: () => ({
				url: "/service-maintenance/export",
				responseHandler: (response) => response.blob(),
			}),
		}),
		uploadServiceMaintenance: builder.mutation<unknown, File>({
			query: (file) => {
				const body = new FormData();
				body.append("file", file);

				return {
					url: "/service-maintenance/bulk-upload",
					method: "POST",
					body,
				};
			},
			invalidatesTags: [{ type: "ServiceMaintenance", id: "LIST" }],
		}),
	}),
	overrideExisting: false,
});

export const {
	useExportServiceMaintenanceDemoMutation,
	useUploadServiceMaintenanceMutation,
} = bulkUploadApi;