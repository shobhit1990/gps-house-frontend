import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "../utils/baseQuery";
import {
  RefreshTokenRequest,
  RefreshTokenResponse,
} from "@/interfaces";

export const authApi = createApi({
  reducerPath: "authApi",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Auth"],
  endpoints: (builder) => ({
    refreshToken: builder.mutation<RefreshTokenResponse, RefreshTokenRequest>({
      query: (data) => ({
        url: "/auth/refresh",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["Auth"],
    }),
  }),
});

export const { useRefreshTokenMutation } = authApi;
