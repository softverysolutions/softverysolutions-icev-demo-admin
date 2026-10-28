import { API_BASE_URL } from "../config/api";

export class ExperienceService {
  static async getAuthToken() {
    const { getAuth } = await import("../demo/session");
    const authInstance = getAuth();
    const user = authInstance.currentUser;

    if (!user) {
      throw new Error("User not authenticated");
    }

    return user.getIdToken();
  }

  static async searchExperiences(searchParams = {}) {
    try {
      const token = await this.getAuthToken();

      const requestBody = {
        search: searchParams.search || "",
        page: searchParams.page || 1,
        limit: searchParams.limit || 20,
      };

      if (searchParams.type !== undefined) {
        requestBody.type = searchParams.type;
      }
      if (searchParams.isActive !== undefined) {
        requestBody.isActive = searchParams.isActive;
      }

      const response = await fetch(`${API_BASE_URL}/admin/experiences/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to search experiences: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error searching experiences:", error);
      return { data: [], meta: { currentPage: 1, totalPages: 1, totalItems: 0 } };
    }
  }

  static async getExperienceById(id) {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/experiences/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch experience: ${response.status} - ${errorData.message || "Unknown error"}`
      );
    }

    return response.json();
  }

  static async createExperience(payload) {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/experiences`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to create experience: ${response.status} - ${errorData.message || "Unknown error"}`
      );
    }

    return response.json();
  }

  static async updateExperience(id, payload) {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/experiences/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to update experience: ${response.status} - ${errorData.message || "Unknown error"}`
      );
    }

    return response.json();
  }

  static async deleteExperience(id) {
    const token = await this.getAuthToken();

    const response = await fetch(`${API_BASE_URL}/admin/experiences/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to delete experience: ${response.status} - ${errorData.message || "Unknown error"}`
      );
    }

    return true;
  }
}
