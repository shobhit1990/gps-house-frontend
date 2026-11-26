import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { RootState } from "../../store";
import { startGlobalLoading, stopGlobalLoading } from "../../slices/globalLoaderSlice";
import { API_CONFIG, AUTH_CONFIG } from "@/config/env";
import { toast } from "@/hooks/use-toast";
import { SessionRevokeReason } from "@/enums/SessionRevokeReason";
import { forceLogout } from "@/utils/forceLogout";

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

const getRequestUrl = (args: string | FetchArgs): string =>
  typeof args === "string" ? args : args.url ?? "";

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

    // Expired/invalid session → clear auth and send user to login.
    // Skip login itself so wrong credentials still show the form error toast.
    if (status === 401) {
      const requestUrl = getRequestUrl(args);
      const isLoginRequest = requestUrl.includes("/user/login");
      if (AUTH_CONFIG.ENABLED && !isLoginRequest) {
        forceLogout(api.dispatch, { reason: SessionRevokeReason.SESSION_EXPIRED });
      }
      return result;
    }

    if (status === 403) {
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
