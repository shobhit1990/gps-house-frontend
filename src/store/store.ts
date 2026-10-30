import { configureStore } from "@reduxjs/toolkit";
import { setupListeners } from "@reduxjs/toolkit/query";
import { api, authApi } from "./services/api";
import "./services/api/BillingDetails";
import "./services/api/Client";
import "./services/api/Group";
import "./services/api/JobSheet";
import "./services/api/Master";
import "./services/api/Owner";
import "./services/api/PaymentDetails";
import "./services/api/Technician";
import "./services/api/Transporter";
import "./services/api/User";
import "./services/api/Vehicle";
import authReducer from "./slices/authSlice";
import globalLoaderReducer from "./slices/globalLoaderSlice";

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    [authApi.reducerPath]: authApi.reducer,
    auth: authReducer,
    globalLoader: globalLoaderReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware, authApi.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
