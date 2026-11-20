import type { MenuItem } from "@/interfaces/Menu";

type NavChild = string | { label: string; children: string[] };
type NavMenu = { label: string; to?: string; children: NavChild[] };

function collectMenuMatchers(menus: MenuItem[]): { labels: Set<string>; urls: Set<string> } {
  const labels = new Set<string>();
  const urls = new Set<string>();

  const visit = (items: MenuItem[]) => {
    for (const item of items) {
      if (item.label) labels.add(item.label.trim().toLowerCase());
      if (item.key) labels.add(item.key.trim().toLowerCase());
      if (item.url) {
        const normalized = item.url.startsWith("/") ? item.url : `/${item.url}`;
        urls.add(normalized.toLowerCase());
      }
      if (item.children?.length) visit(item.children);
    }
  };

  visit(menus);
  return { labels, urls };
}

function isAllowedLabel(label: string, matchers: { labels: Set<string>; urls: Set<string> }, route?: string) {
  const key = label.trim().toLowerCase();
  if (matchers.labels.has(key)) return true;
  if (route && matchers.urls.has(route.toLowerCase())) return true;
  return false;
}

/**
 * Hardcoded nav is the source of truth for labels/routes.
 * When `/menu/sidebar` returns menus, keep matching hardcoded entries.
 * If a parent (e.g. Master) is allowed, keep all its hardcoded children
 * so new pages like Driver License stay visible before backend menu seeding.
 * If menus are empty, keep the full hardcoded nav.
 */
export function filterNavMenusByPermissions<T extends NavMenu>(
  navMenus: T[],
  menus: MenuItem[],
  routeFor: (...labels: string[]) => string | undefined,
): T[] {
  if (!menus.length) return navMenus;

  const matchers = collectMenuMatchers(menus);

  const filtered = navMenus
    .map((menu) => {
      if (menu.to) {
        return isAllowedLabel(menu.label, matchers, menu.to) ? menu : null;
      }

      // Parent allowed → keep every hardcoded child.
      if (isAllowedLabel(menu.label, matchers)) {
        return menu;
      }

      const children = menu.children
        .map((child) => {
          if (typeof child === "string") {
            const route = routeFor(menu.label, child);
            return isAllowedLabel(child, matchers, route) ? child : null;
          }

          const nested = child.children.filter((subChild) => {
            const route = routeFor(menu.label, child.label, subChild);
            return isAllowedLabel(subChild, matchers, route) || isAllowedLabel(child.label, matchers);
          });

          if (!nested.length && !isAllowedLabel(child.label, matchers)) {
            return null;
          }

          return { ...child, children: nested.length ? nested : child.children };
        })
        .filter((child): child is NavChild => child !== null);

      // Some children matched → keep parent with those children, and also
      // keep unmatched siblings so newly added hardcoded pages remain visible.
      if (!children.length) return null;
      return { ...menu, children: menu.children };
    })
    .filter((menu): menu is T => menu !== null);

  // If backend labels/urls do not align with the hardcoded nav yet, keep full nav.
  return filtered.length ? filtered : navMenus;
}

export type { NavChild, NavMenu };
