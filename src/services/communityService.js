import { API_BASE_URL } from "../config/api";
import { AuthService } from "./authService";

const BASE = `${API_BASE_URL}/admin/community/posts`;

export const POST_STATUS = {
  FLAGGED: "flagged",
  PUBLISHED: "published",
  HIDDEN: "hidden",
};

async function request(url, { method = "GET", body } = {}) {
  const token = await AuthService.getIdToken();
  if (!token) throw new Error("User not authenticated");
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body != null ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Request failed (${response.status})`);
  }

  if (response.status === 204) return null;
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export class CommunityService {
  static search(payload = {}) {
    return request(`${BASE}/search`, { method: "POST", body: payload });
  }

  static getPost(id) {
    return request(`${BASE}/${id}`);
  }

  static moderate(id, payload) {
    return request(`${BASE}/${id}`, { method: "PATCH", body: payload });
  }
}
