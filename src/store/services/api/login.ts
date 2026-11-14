import type { LoginRequest, LoginResponse } from "@/interfaces";
import { authApi } from "./auth";
import { unwrapResponse, type ApiEnvelope } from "../utils/unwrapResponse";

export const loginApi = authApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: "/user/login",
        method: "POST",
        body: credentials,
      }),
      // Backend wraps responses as { data: ... }; accept both wrapped and bare shapes.
      transformResponse: (response: ApiEnvelope<LoginResponse>) =>
        unwrapResponse(response) as LoginResponse,
      invalidatesTags: ["Auth"],
    }),
  }),
});

export const { useLoginMutation } = loginApi;
