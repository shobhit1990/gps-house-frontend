import { createSlice } from "@reduxjs/toolkit";

interface GlobalLoaderState {
  pendingRequests: number;
}

const initialState: GlobalLoaderState = {
  pendingRequests: 0,
};

const globalLoaderSlice = createSlice({
  name: "globalLoader",
  initialState,
  reducers: {
    startGlobalLoading: (state) => {
      state.pendingRequests += 1;
    },
    stopGlobalLoading: (state) => {
      state.pendingRequests = Math.max(0, state.pendingRequests - 1);
    },
    resetGlobalLoading: (state) => {
      state.pendingRequests = 0;
    },
  },
});

export const { startGlobalLoading, stopGlobalLoading, resetGlobalLoading } =
  globalLoaderSlice.actions;
export default globalLoaderSlice.reducer;
