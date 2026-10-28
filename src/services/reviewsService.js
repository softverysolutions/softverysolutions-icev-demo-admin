import { API_BASE_URL } from "../config/api";
import { AuthService } from "./authService";

const BASE = `${API_BASE_URL}/admin/reviews`;

export const REVIEW_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  DECLINED: "declined",
  HIDDEN: "hidden",
};

// Review records are per booking; the type tells whether it was a programme or a package.
export const REVIEW_TYPE = {
  CAMPUS: "campus",
  PACKAGE: "package",
  COURSE: "course",
};

async function authHeaders() {
  const token = await AuthService.getIdToken();
  if (!token) throw new Error("User not authenticated");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

async function request(url, { method = "GET", body } = {}) {
  const headers = await authHeaders();
  const response = await fetch(url, {
    method,
    headers,
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = Array.isArray(errorData.message)
      ? errorData.message.join(", ")
      : errorData.message || errorData.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export class ReviewsService {
  static search(payload = {}) {
    return request(`${BASE}/search`, { method: "POST", body: payload });
  }

  static updateStatus(travelId, status) {
    return request(`${BASE}/${travelId}/status`, { method: "PATCH", body: { status } });
  }

  static unblockForOrder(orderId) {
    return request(`${API_BASE_URL}/admin/orders/${orderId}/review/unblock`, {
      method: "POST",
    });
  }
}
