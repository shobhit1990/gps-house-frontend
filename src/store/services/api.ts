import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithInterceptor } from "./utils/baseQuery";

/** Shared API shell — domain endpoints are added with `api.injectEndpoints` in ./api/*. */
export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithInterceptor,
  tagTypes: ["Auth", "Master", "Owners", "Roles", "Clients", "Transporters", "Vehicles", "Devices", "DeviceTypes", "Inventory", "PaymentDetails", "BillingDetails", "Technicians", "DriverDetails", "JobSheets", "Groups", "Users", "Trips", "TripDetails", "TripEvents", "TripEventDetails", "Alerts", "ServiceMaintenance", "ParkedSchedules", "Announcements", "RaiseTickets", "VehicleConfigs", "Expenses", "Menus"],
  endpoints: () => ({}),
});

export { authApi, useRefreshTokenMutation } from "./api/auth";
export { useLoginMutation } from "./api/login";
