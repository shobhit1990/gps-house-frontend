import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { RootState } from "../../store";
import { logout, updateTokens } from "../../slices/authSlice";
import { startGlobalLoading, stopGlobalLoading } from "../../slices/globalLoaderSlice";
import type { RefreshTokenResponse } from "@/interfaces";
import { API_CONFIG, AUTH_CONFIG } from "@/config/env";
import { toast } from "@/hooks/use-toast";
import { unwrapResponse, type ApiEnvelope } from "./unwrapResponse";

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

/**
 * The refresh currently in flight, shared by every request that gets a 401 at the same time.
 * Without this, a screen that loads several APIs at once (e.g. the Add Vehicle form) sends one
 * /auth/refresh per request; the backend rotates the refresh token on the first one, the rest
 * fail with the old token, and the user is logged out.
 */
let refreshInFlight: Promise<boolean> | null = null;

function refreshAccessToken(
  refreshToken: string,
  api: Parameters<BaseQueryFn>[1],
  extraOptions: Parameters<BaseQueryFn>[2],
): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      api.dispatch(startGlobalLoading());
      try {
        const refreshResult = await baseQuery(
          {
            url: "/auth/refresh",
            method: "POST",
            body: { refreshToken },
          },
          api,
          extraOptions
        );
        const data = unwrapResponse(refreshResult.data as ApiEnvelope<RefreshTokenResponse>);
        if (!data?.accessToken) return false;
        api.dispatch(
          updateTokens({
            token: data.accessToken,
            refreshToken: data.refreshToken,
          })
        );
        return true;
      } finally {
        api.dispatch(stopGlobalLoading());
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

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

  const tokenBeforeRequest = (api.getState() as RootState).auth?.token;
  api.dispatch(startGlobalLoading());
  let result;
  try {
    result = await baseQuery(args, api, extraOptions);
  } finally {
    api.dispatch(stopGlobalLoading());
  }

  if (result.error) {
    const { status } = result.error as { status?: number };

    if (status === 401 && !AUTH_CONFIG.ENABLED) {
      // Auth is switched off, so a 401 is just returned to the caller: no refresh, logout or redirect.
      return result;
    }

    if (status === 401) {
      const state = api.getState() as RootState;
      const refreshToken = state.auth?.refreshToken;
      const url =
        typeof args === "string"
          ? args
          : typeof args?.url === "string"
            ? args.url
            : "";
      const isLoginEndpoint =
        url.includes("/auth/login") || url.includes("/user/login");
      const isAuthEndpoint =
        isLoginEndpoint || url.includes("/auth/refresh");

      if (isLoginEndpoint) {
        return result;
      }

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

      // Another request may already have refreshed the token while this one was in flight.
      const tokenAfterRequest = (api.getState() as RootState).auth?.token;
      const refreshed =
        tokenAfterRequest && tokenAfterRequest !== tokenBeforeRequest
          ? true
          : await refreshAccessToken(refreshToken, api, extraOptions);

      if (refreshed) {
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
