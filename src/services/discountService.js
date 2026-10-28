import { API_BASE_URL } from "../config/api";

export class DiscountService {
  static async getAuthToken() {
    const { auth } = await import("../demo/session");
    const { getAuth } = await import("../demo/session");
    const authInstance = getAuth();
    const user = authInstance.currentUser;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();
    return token;
  }

  static async getDiscounts(filters = {}) {
    try {
      const token = await this.getAuthToken();
      const { status, type } = filters;

      const queryParams = new URLSearchParams();
      if (status) queryParams.append("status", status);
      if (type) queryParams.append("type", type);

      const url = `${API_BASE_URL}/admin/discounts${
        queryParams.toString() ? `?${queryParams.toString()}` : ""
      }`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch discounts: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching discounts:", error);
      throw error;
    }
  }

  static async getActiveDiscounts() {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/discounts/active`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch active discounts: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching active discounts:", error);
      throw error;
    }
  }

  static async getDiscount(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/discounts/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch discount: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching discount ${id}:`, error);
      throw error;
    }
  }

  static async createDiscount(discountData) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/discounts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(discountData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to create discount: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating discount:", error);
      throw error;
    }
  }

  static async updateDiscount(id, discountData) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/discounts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(discountData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to update discount: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error updating discount ${id}:`, error);
      throw error;
    }
  }

  static async deleteDiscount(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/discounts/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to delete discount: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error deleting discount ${id}:`, error);
      throw error;
    }
  }

  static async updateDiscountStatus(id, status) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/discounts/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to update discount status: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error updating discount status ${id}:`, error);
      throw error;
    }
  }

  static async getImageUploadUrl(id, contentType) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/discounts/${id}/image/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contentType }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to get image upload URL: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error getting image upload URL for discount ${id}:`, error);
      throw error;
    }
  }
}
