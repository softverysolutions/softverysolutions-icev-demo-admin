import { API_BASE_URL } from "../config/api";
import { UserService } from "./userService";

const BASE = `${API_BASE_URL}/admin/users`;

function getAuthToken() {
  return UserService.getAuthToken();
}

export function apiRoleToUi(role) {
  if (!role) return "";
  const r = String(role);
  if (r === "SuperAdmin") return "super_admin";
  if (r === "Admin") return "admin";
  if (r === "Consultant") return "consultant";
  return r;
}

export function uiRoleToApi(role) {
  if (!role) return "";
  const r = String(role);
  if (r === "super_admin") return "SuperAdmin";
  if (r === "admin") return "Admin";
  if (r === "consultant") return "Consultant";
  return r;
}

export function mapAdminRowToManager(row) {
  if (!row) return null;
  const name = [row.firstName, row.lastName].filter(Boolean).join(" ").trim() || "—";
  return {
    id: row.id,
    name,
    email: row.email || "—",
    role: apiRoleToUi(row.role),
    status: row.isActive === true ? "active" : "inactive",
    createdAt: row.createdAt ?? null,
    lastLoginAt: row.lastActivityAt ?? null,
  };
}

function normalizeSearchMeta(data, params, limitUsed) {
  const meta = data?.meta || {};
  const totalItems = Number(meta.totalItems);
  const itemsPerPage = Number(meta.itemsPerPage) || Number(limitUsed) || 10;
  const totalPagesRaw = Number(meta.totalPages);
  const currentPage = Number(meta.currentPage) || Number(params.page) || 1;
  const computedTotalPages =
    Number.isFinite(totalItems) && totalItems >= 0 && itemsPerPage > 0
      ? Math.max(1, Math.ceil(totalItems / itemsPerPage))
      : 1;
  const totalPages =
    Number.isFinite(totalPagesRaw) && totalPagesRaw > 0 ? totalPagesRaw : computedTotalPages;

  return {
    currentPage,
    totalPages: Math.max(1, totalPages),
    totalItems: Number.isFinite(totalItems) ? totalItems : 0,
    itemsPerPage,
  };
}

export async function searchAdminUsers(params = {}) {
  const token = await getAuthToken();
  const limit = params.limit ?? 10;
  const body = {
    search: params.search || undefined,
    page: params.page ?? 1,
    limit,
    sortDirection: (params.sortDirection || "asc").toLowerCase() === "desc" ? "desc" : "asc",
  };

  if (Array.isArray(params.roles) && params.roles.length > 0) {
    body.roles = params.roles;
  }

  const response = await fetch(`${BASE}/admin-management/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (response.ok) {
    const rows = (data.data || []).map(mapAdminRowToManager);
    return {
      data: rows,
      meta: normalizeSearchMeta(data, params, limit),
    };
  }

  const fallbackResponse = await fetch(`${API_BASE_URL}/admin/users/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const fallbackData = await fallbackResponse.json().catch(() => ({}));
  if (!fallbackResponse.ok) {
    const message =
      fallbackData.message || fallbackData.error || data.message || data.error || "Search failed";
    const code = fallbackData.code || fallbackData.error || data.code || data.error;
    const err = new Error(typeof message === "string" ? message : "Search failed");
    err.code = code;
    throw err;
  }

  const rows = (fallbackData.data || []).filter((u) =>
    ["SuperAdmin", "Admin", "Consultant"].includes(u?.role)
  );
  const fbLimit = fallbackData.limit ?? limit;
  const fbTotal = Number(fallbackData.total) || rows.length;
  const fbPage = Number(fallbackData.page) || Number(params.page) || 1;
  const fbTotalPages =
    fbLimit > 0 ? Math.max(1, Math.ceil(fbTotal / fbLimit)) : 1;
  return {
    data: rows.map(mapAdminRowToManager),
    meta: {
      currentPage: fbPage,
      totalPages: fbTotalPages,
      totalItems: fbTotal,
      itemsPerPage: fbLimit,
    },
  };
}

export async function createAdminUser(body) {
  const token = await getAuthToken();
  const response = await fetch(`${BASE}/admin-management`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      firstName: body.firstName,
      lastName: body.lastName || undefined,
      email: body.email,
      role: uiRoleToApi(body.role),
      password: body.password,
      isActive: body.isActive !== false,
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const code = data.code || data.error;
    const rawMessage = data.message || data.error || "Create failed";
    const message = Array.isArray(rawMessage) ? rawMessage[0] : rawMessage;
    const err = new Error(typeof message === "string" ? message : "Create failed");
    err.code = code;
    err.apiErrors = Array.isArray(rawMessage)
      ? rawMessage
      : typeof rawMessage === "string"
      ? [rawMessage]
      : [];
    throw err;
  }

  return mapAdminRowToManager(data);
}

export async function updateAdminUserRole(userId, role) {
  const token = await getAuthToken();
  const response = await fetch(`${BASE}/role`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      userId,
      role: uiRoleToApi(role),
    }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const code = data.code || data.error;
    const message = data.message || data.error || "Update role failed";
    const err = new Error(typeof message === "string" ? message : "Update role failed");
    err.code = code;
    throw err;
  }

  return data;
}

export async function deactivateAdminUser(id) {
  const token = await getAuthToken();
  const response = await fetch(`${BASE}/admin-management/${id}/deactivate`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const code = data.code || data.error;
    const message = data.message || data.error || "Deactivate failed";
    const err = new Error(typeof message === "string" ? message : "Deactivate failed");
    err.code = code;
    throw err;
  }

  return mapAdminRowToManager(data);
}

export async function activateAdminUser(id) {
  const token = await getAuthToken();
  const response = await fetch(`${BASE}/admin-management/${id}/activate`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const code = data.code || data.error;
    const message = data.message || data.error || "Activate failed";
    const err = new Error(typeof message === "string" ? message : "Activate failed");
    err.code = code;
    throw err;
  }

  return mapAdminRowToManager(data);
}
