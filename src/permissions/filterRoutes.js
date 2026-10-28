import { navKeyVisible } from "./can";

function filterCollapseChildren(collapse, role) {
  return collapse.map((item) => filterRouteItem(item, role)).filter(Boolean);
}

function filterRouteItem(route, role) {
  if (route.collapse) {
    const next = filterCollapseChildren(route.collapse, role);
    if (next.length === 0) return null;
    return { ...route, collapse: next };
  }
  if (route.key && !navKeyVisible(role, route.key)) return null;
  return route;
}

export function filterRoutesForRole(routes, role) {
  return routes.map((r) => filterRouteItem(r, role)).filter(Boolean);
}
