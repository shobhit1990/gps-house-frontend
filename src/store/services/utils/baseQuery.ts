import { fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from "@reduxjs/toolkit/query";
import type { RootState } from "../../store";
import { startGlobalLoading, stopGlobalLoading } from "../../slices/globalLoaderSlice";
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

    // 401: do not call /user/refresh and do not auto-logout (keeps Job Sheet save from kicking the user out).
    if (status === 401) {
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
