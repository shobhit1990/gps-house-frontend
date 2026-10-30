import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "./utils/baseQuery";

/** Shared API shell — domain endpoints are added with `api.injectEndpoints` in ./api/*. */
export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Auth", "Master", "Owners", "Clients", "Transporters", "Vehicles", "PaymentDetails", "BillingDetails", "Technicians", "JobSheets", "Groups", "Users", "Trips", "TripDetails", "TripEvents", "TripEventDetails"],
  endpoints: () => ({}),
});

export { authApi, useLoginMutation, useRefreshTokenMutation } from "./api/auth";
