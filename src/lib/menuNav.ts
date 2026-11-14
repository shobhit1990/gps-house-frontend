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
 * When the backend returns sidebar menus, keep only hardcoded nav entries that
 * match by label/url. If menus are empty, keep the full hardcoded nav so QA
 * still works before master data is seeded.
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

      const children = menu.children
        .map((child) => {
          if (typeof child === "string") {
            const route = routeFor(menu.label, child);
            return isAllowedLabel(child, matchers, route) || isAllowedLabel(menu.label, matchers)
              ? child
              : null;
          }

          const nested = child.children.filter((subChild) => {
            const route = routeFor(menu.label, child.label, subChild);
            return (
              isAllowedLabel(subChild, matchers, route) ||
              isAllowedLabel(child.label, matchers) ||
              isAllowedLabel(menu.label, matchers)
            );
          });

          if (!nested.length && !isAllowedLabel(child.label, matchers) && !isAllowedLabel(menu.label, matchers)) {
            return null;
          }

          return { ...child, children: nested.length ? nested : child.children };
        })
        .filter((child): child is NavChild => child !== null);

      if (!children.length && !isAllowedLabel(menu.label, matchers)) return null;
      return { ...menu, children };
    })
    .filter((menu): menu is T => menu !== null);

  // If backend labels/urls do not align with the hardcoded nav yet, keep full nav.
  return filtered.length ? filtered : navMenus;
}

export type { NavChild, NavMenu };
