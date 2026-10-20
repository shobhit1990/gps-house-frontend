import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { RootState } from "../../store";
import { logout, updateTokens } from "../../slices/authSlice";
import { startGlobalLoading, stopGlobalLoading } from "../../slices/globalLoaderSlice";
import type { RefreshTokenResponse } from "@/interfaces";
import { API_CONFIG } from "@/config/env";
import { toast } from "@/hooks/use-toast";

const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth?.token;
    if (token) {
      headers.set("authorization", `Bearer ${token}`);
    }
    return headers;
  },
});

export const baseQueryWithInterceptor: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  const getErrorMessage = (error: FetchBaseQueryError): string => {
    const data = error?.data as { message?: string } | string | undefined;
    if (typeof data === "string") return data;
    if (data && typeof data === "object" && typeof data.message === "string") {
      return data.message;
    }
    return "Request failed. Please try again.";
  };

  api.dispatch(startGlobalLoading());
  let result;
  try {
    result = await baseQuery(args, api, extraOptions);
  } finally {
    api.dispatch(stopGlobalLoading());
  }

  if (result.error) {
    const { status } = result.error as { status?: number };

    if (status === 401) {
      const state = api.getState() as RootState;
      const refreshToken = state.auth?.refreshToken;
      const url =
        typeof args === "string"
          ? args
          : typeof args?.url === "string"
            ? args.url
            : "";
      const isAuthEndpoint =
        url.includes("/auth/login") || url.includes("/auth/refresh");

      if (!refreshToken || isAuthEndpoint) {
        try {
          api.dispatch(logout());
        } catch (_) {
          // no-op
        }
        if (typeof window !== "undefined") {
          const isOnLogin = window.location.pathname.toLowerCase().includes("login");
          if (!isOnLogin) window.location.replace("/login");
        }
        return result;
      }

      api.dispatch(startGlobalLoading());
      let refreshResult;
      try {
        refreshResult = await baseQuery(
          {
            url: "/auth/refresh",
            method: "POST",
            body: { refreshToken },
          },
          api,
          extraOptions
        );
      } finally {
        api.dispatch(stopGlobalLoading());
      }

      if (refreshResult.data) {
        const data = refreshResult.data as RefreshTokenResponse;
        api.dispatch(
          updateTokens({
            token: data.accessToken,
            refreshToken: data.refreshToken,
          })
        );

        api.dispatch(startGlobalLoading());
        let retryResult;
        try {
          retryResult = await baseQuery(args, api, extraOptions);
        } finally {
          api.dispatch(stopGlobalLoading());
        }
        return retryResult;
      }

      try {
        api.dispatch(logout());
      } catch (_) {
        // no-op
      }
      if (typeof window !== "undefined") {
        const isOnLogin = window.location.pathname.toLowerCase().includes("login");
        if (!isOnLogin) window.location.replace("/login");
      }
    } else if (status === 403) {
      toast({
        title: "Forbidden (403)",
        description: getErrorMessage(result.error),
        variant: "destructive",
      });
    } else if (status === 404) {
      console.error("Resource not found");
    } else if (typeof status === "number" && status >= 500) {
      console.error("Server error");
    }
  }

  return result;
};
