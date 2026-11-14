import { useEffect } from "react";
import { useDispatch, useSelector } from "@/store/hooks";
import { useLazyGetSidebarMenusQuery } from "@/store/services/api/Menu";
import {
  selectIsAuthenticated,
  selectMenus,
  setMenus,
} from "@/store/slices/authSlice";

/**
 * Loads sidebar menus after auth (login or page refresh) when they are not
 * already present from the login response.
 */
export function MenusBootstrap() {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const menus = useSelector(selectMenus);
  const [fetchSidebarMenus] = useLazyGetSidebarMenusQuery();

  useEffect(() => {
    if (!isAuthenticated || menus.length > 0) return;

    let cancelled = false;

    (async () => {
      try {
        const nextMenus = await fetchSidebarMenus().unwrap();
        if (!cancelled && nextMenus.length > 0) {
          dispatch(setMenus(nextMenus));
        }
      } catch {
        // Sidebar keeps its hardcoded fallback until menus are available.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch, fetchSidebarMenus, isAuthenticated, menus.length]);

  return null;
}
