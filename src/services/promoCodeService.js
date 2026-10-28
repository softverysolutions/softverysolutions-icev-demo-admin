import { API_BASE_URL } from "../config/api";

export class PromoCodeService {
  static async getAuthToken() {
    const { auth } = await import("../demo/session");
    const { getAuth } = await import("../demo/session");
    const authInstance = getAuth();
    const user = authInstance.currentUser;

    if (!user) {
      throw new Error("User not authenticated");
    }

    return user.getIdToken();
  }

  static async searchPromoCodes(body) {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/promo-codes/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to list promo codes (${response.status})`);
    }

    return response.json();
  }

  static async getPromoCode(id) {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/promo-codes/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to load promo code (${response.status})`);
    }

    return response.json();
  }

  static async createPromoCode(payload) {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/promo-codes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to create promo code (${response.status})`);
    }

    return response.json();
  }

  static async updatePromoCode(id, payload) {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/promo-codes/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to update promo code (${response.status})`);
    }

    return response.json();
  }

  static async deletePromoCode(id) {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/promo-codes/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to delete promo code (${response.status})`);
    }

    return response.json();
  }

  static async getNewUserPromoConfig() {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/promo-codes/new-user-promo-config`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to load new-user promo config (${response.status})`
      );
    }

    const data = await response.json().catch(() => null);
    return data;
  }
  static async updateNewUserPromoConfig(payload) {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/promo-codes/new-user-promo-config`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.message || `Failed to save new-user promo config (${response.status})`
      );
    }

    return response.json();
  }
}
