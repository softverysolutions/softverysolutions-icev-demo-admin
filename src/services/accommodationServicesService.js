import { API_BASE_URL } from "../config/api";
import { auth } from "../demo/session";

export class AccommodationServicesService {
  static async getAuthToken() {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    return user.getIdToken();
  }

  static async getServices(accommodationId) {
    const token = await this.getAuthToken();
    const url = `${API_BASE_URL}/admin/accommodations/${accommodationId}/services`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 404) return [];
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to load accommodation services");
    }
    const data = await response.json().catch(() => []);
    return Array.isArray(data) ? data : [];
  }

  static async createServices(accommodationId, body) {
    const token = await this.getAuthToken();
    const url = `${API_BASE_URL}/admin/accommodations/${accommodationId}/services`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to create accommodation services");
    }
    return response.json().catch(() => []);
  }

  static async updateServices(accommodationId, body) {
    const token = await this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/accommodations/${accommodationId}/services`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to update accommodation services");
    }
    return response.json().catch(() => []);
  }

  static async deleteServices(accommodationId, ids) {
    if (!ids || ids.length === 0) return;
    const token = await this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/accommodations/${accommodationId}/services`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids }),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || err.error || "Failed to delete accommodation services");
    }
  }
}
