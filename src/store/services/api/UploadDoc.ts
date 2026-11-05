import { api } from "../api";

type UploadDocumentRequest = {
	file: File;
	documentName: string;
};

type UpdateDocumentRequest = {
	externalId: string;
	body: FormData;
};

export const uploadDocApi = api.injectEndpoints({
	endpoints: (builder) => ({
		getAllDocuments: builder.query<unknown, void>({
			query: () => "/uploadDocument/getAll",
		}),
		getDocumentById: builder.query<unknown, string>({
			query: (externalId) => `/uploadDocument/getById/${encodeURIComponent(externalId)}`,
		}),
		uploadDocument: builder.mutation<unknown, UploadDocumentRequest>({
			query: ({ file, documentName }) => {
				const body = new FormData();
				body.append("file", file);
				body.append("documentName", documentName);

				return {
					url: "/uploadDocument/",
					method: "POST",
					body,
				};
			},
		}),
		updateDocument: builder.mutation<unknown, UpdateDocumentRequest>({
			query: ({ externalId, body }) => ({
				url: `/uploadDocument/update/${encodeURIComponent(externalId)}`,
				method: "PUT",
				body,
			}),
		}),
		deleteDocument: builder.mutation<void, string>({
			query: (externalId) => ({
				url: `/uploadDocument/delete/${encodeURIComponent(externalId)}`,
				method: "DELETE",
			}),
		}),
	}),
	overrideExisting: false,
});

export const {
	useGetAllDocumentsQuery,
	useGetDocumentByIdQuery,
	useUploadDocumentMutation,
	useUpdateDocumentMutation,
	useDeleteDocumentMutation,
} = uploadDocApi;