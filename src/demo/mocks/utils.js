import { HttpResponse } from "msw";
import { getAppBaseUrl } from "config/api";

export const API = "*/demo-api";

export const json = (body, init) => HttpResponse.json(body, init);

export const notFound = (message = "Not found") =>
  HttpResponse.json({ statusCode: 404, message }, { status: 404 });

export const badRequest = (message) =>
  HttpResponse.json({ statusCode: 400, message }, { status: 400 });

export const noContent = () => new HttpResponse(null, { status: 204 });

export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return {};
  }
}

let counter = 0;
export const newId = (prefix = "id") =>
  `${prefix}-${Date.now().toString(36)}${(counter++).toString(36)}${Math.random()
    .toString(36)
    .slice(2, 6)}`;

export const nowIso = () => new Date().toISOString();

export function paginate(list, { page = 1, limit = 10 } = {}) {
  const p = Math.max(1, Number(page) || 1);
  const l = Math.max(1, Number(limit) || 10);
  const totalItems = list.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / l));
  return {
    data: list.slice((p - 1) * l, p * l),
    meta: {
      currentPage: p,
      itemsPerPage: l,
      totalItems,
      totalPages,
      page: p,
      limit: l,
      total: totalItems,
    },
  };
}

export const includesText = (value, search) =>
  !search || String(value || "").toLowerCase().includes(String(search).toLowerCase());

export function sortBy(list, field, direction = "asc") {
  if (!field) return list;
  const dir = String(direction).toLowerCase() === "desc" ? -1 : 1;
  return [...list].sort((a, b) => {
    const av = a?.[field];
    const bv = b?.[field];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    return av > bv ? dir : av < bv ? -dir : 0;
  });
}

// Absolute URL of a bundled demo photo (public/demo-images).
export const demoImage = (key) =>
  key ? `${getAppBaseUrl()}/demo-images/${String(key).replace(/\.(jpg|png)$/, "")}.${
    String(key).startsWith("logo-") ? "png" : "jpg"
  }` : null;

/* ---- dates relative to today ---------------------------------------------- */

const pad = (n) => String(n).padStart(2, "0");
export const toDay = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const today = () => toDay(new Date());
export const addDays = (day, days) => {
  const [y, m, d] = day.split("-").map(Number);
  return toDay(new Date(y, m - 1, d + days));
};
export const daysAgoIso = (days, hour = 10) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
export const nextMonday = (day) => {
  const [y, m, d] = day.split("-").map(Number);
  const shift = (8 - new Date(y, m - 1, d).getDay()) % 7;
  return addDays(day, shift);
};
