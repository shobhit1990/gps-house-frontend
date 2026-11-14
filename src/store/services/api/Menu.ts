import type { MenuItem } from "@/interfaces/Menu";
import { api } from "../api";
import { unwrapList, type ApiEnvelope } from "../utils/unwrapResponse";

export const menuApi = api.injectEndpoints({
  endpoints: (builder) => ({
    getSidebarMenus: builder.query<MenuItem[], void>({
      query: () => "/menu/sidebar",
      transformResponse: (response: ApiEnvelope<MenuItem[]>) => unwrapList(response),
      providesTags: [{ type: "Menus", id: "SIDEBAR" }],
    }),
  }),
});

export const { useGetSidebarMenusQuery, useLazyGetSidebarMenusQuery } = menuApi;
