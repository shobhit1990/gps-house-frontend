import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "./utils/baseQuery";

/** Shared tag shell — domain APIs live in their own createApi modules. */
export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Auth", "Master"],
  endpoints: () => ({}),
});

export { authApi, useLoginMutation, useRefreshTokenMutation } from "./api/auth";
