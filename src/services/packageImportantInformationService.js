import { API_BASE_URL } from "../config/api";

export const PACKAGE_IMPORTANT_INFO_CATEGORY = {
  WHAT_TO_BRING: "whatToBring",
  NOT_ALLOWED: "notAllowed",
  GOOD_TO_KNOW: "goodToKnow",
};

function optionText(item) {
  if (typeof item === "string") return item.trim();
  if (item && typeof item === "object") {
    return String(item.text ?? item.label ?? item.title ?? item.value ?? "").trim();
  }
  return "";
}

function extractOptionsPayload(body) {
  if (body == null) return [];
  if (Array.isArray(body)) return body;
  const candidates = [body.data, body.options, body.items, body.results];
  for (const c of candidates) {
    if (Array.isArray(c)) return c;
  }
  return [];
}

export class PackageImportantInformationService {
  static async getAuthToken() {
    const { getAuth } = await import("../demo/session");
    const authInstance = getAuth();
    const user = authInstance.currentUser;
    if (!user) throw new Error("User not authenticated");
    return user.getIdToken();
  }

  static async listOptions(category, search = "") {
    const token = await this.getAuthToken();
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search && String(search).trim()) params.set("search", String(search).trim());
    const qs = params.toString();
    const url = `${API_BASE_URL}/admin/package-important-info-options${qs ? `?${qs}` : ""}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 404) {
      return [];
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to load important information options: ${response.status} — ${
          errorData.message || errorData.error || "Unknown error"
        }`
      );
    }

    const json = await response.json().catch(() => ({}));
    const raw = extractOptionsPayload(json);
    const labels = raw.map(optionText).filter(Boolean);
    return Array.from(new Set(labels));
  }

  static async createOption(category, text) {
    const token = await this.getAuthToken();
    const trimmed = String(text ?? "").trim();
    if (!trimmed) {
      return null;
    }

    const response = await fetch(`${API_BASE_URL}/admin/package-important-info-options`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ category, text: trimmed }),
    });

    if (response.status === 409 || response.status === 422) {
      return null;
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to save custom option: ${response.status} — ${
          errorData.message || errorData.error || "Unknown error"
        }`
      );
    }

    return await response.json().catch(() => ({}));
  }
}
