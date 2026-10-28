import { API_BASE_URL } from "../config/api";

const buildAmenityPayload = ({ name, iconUrl }) => {
  const trimmedName = String(name || "").trim();
  const trimmedIcon = String(iconUrl || "").trim();
  return {
    name: trimmedName,
    iconUrl: trimmedIcon || null,
  };
};

export class AmenityService {
  static async getAuthToken() {
    const { AuthService } = await import("services/authService");
    const token = await AuthService.getIdToken();
    if (!token) {
      throw new Error("User not authenticated");
    }
    return token;
  }

  static async getAllAmenities() {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/amenities`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch amenities: ${response.status} - ${errorData.message || "Unknown error"}`
      );
    }

    return await response.json();
  }

  static async getAmenityById(id) {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/amenities/${encodeURIComponent(id)}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch amenity: ${response.status} - ${errorData.message || "Unknown error"}`
      );
    }

    return await response.json();
  }

  static async createAmenity(amenityData) {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/amenities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(buildAmenityPayload(amenityData)),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to create amenity: ${response.status} - ${errorData.message || "Unknown error"}`
      );
    }

    return await response.json();
  }

  static async updateAmenity(id, amenityData) {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/amenities/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(buildAmenityPayload(amenityData)),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to update amenity: ${response.status} - ${errorData.message || "Unknown error"}`
      );
    }

    return await response.json();
  }

  static async deleteAmenity(id) {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/amenities/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to delete amenity: ${response.status} - ${errorData.message || "Unknown error"}`
      );
    }

    return true;
  }
}
