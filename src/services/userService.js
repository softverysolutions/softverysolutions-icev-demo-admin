import { API_BASE_URL } from "../config/api";
import { formatDateOnlyGB } from "../utils/dateUtils";

export class UserService {
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

  static async createUser(userData) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to create user: ${response.status} - ${
            errorData.message || errorData.error || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async getCurrentUser() {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to get current user: ${response.status} - ${
            errorData.message || errorData.error || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async getUserById(userId) {
    try {
      const token = await this.getAuthToken();

      let response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok && response.status === 400) {
        response = await fetch(`${API_BASE_URL}/users/${userId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to get user by ID: ${response.status} - ${
            errorData.message || errorData.error || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async updateCurrentUser(userData) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to update user: ${response.status} - ${
            errorData.message || errorData.error || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async deleteCurrentUser() {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/users`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to delete user: ${response.status} - ${
            errorData.message || errorData.error || "Unknown error"
          }`
        );
      }

      return;
    } catch (error) {
      throw error;
    }
  }

  static async searchUsers(params = {}) {
    try {
      const token = await this.getAuthToken();

      const searchParams = {
        search: params.search || "",
        page: params.page || 1,
        limit: params.limit || 10,
        sortDirection: params.sortDirection || "asc",
      };

      if (params.sortBy) {
        searchParams.sortBy = params.sortBy;
      }

      const response = await fetch(`${API_BASE_URL}/admin/users/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(searchParams),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to search users: ${response.status} - ${
            errorData.message || errorData.error || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static formatUserForTable(user) {
    return {
      id: user.id,
      name:
        user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || "Not provided",
      email: user.email || "Not provided",
      "registration date": user.registrationDate
        ? new Date(user.registrationDate).toLocaleDateString("en-GB")
        : user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-GB")
        : "Not provided",
      "last activity": user.lastActivityDate
        ? new Date(user.lastActivityDate).toLocaleDateString("en-GB")
        : user.updatedAt
        ? new Date(user.updatedAt).toLocaleDateString("en-GB")
        : "Not provided",
      "travels purchased": user.travelsCount || 0,
    };
  }

  static async formatUserForDetail(user) {
    const notProvided = "Not provided";
    const label = (value) =>
      value ? String(value).charAt(0).toUpperCase() + String(value).slice(1) : notProvided;
    const list = (items) => (items && items.length > 0 ? items.join(", ") : notProvided);

    return {
      id: user.id,
      fullName: `${user.firstName || ""} ${user.lastName || ""}`.trim() || notProvided,
      email: user.email || notProvided,
      phoneNumber: user.phoneNumber || notProvided,
      role: "Customer",
      avatarUrl: user.avatarUrl || null,
      dateOfBirth: user.birthDate ? formatDateOnlyGB(user.birthDate) || notProvided : notProvided,
      gender: label(user.gender),
      skillLevel: label(user.skillLevel),
      registrationDate: user.createdAt
        ? new Date(user.createdAt).toLocaleDateString("en-GB")
        : notProvided,
      country: user.countryName || notProvided,
      preferences: {
        interests: list(user.interests),
        travelDurations: user.preferredDuration || notProvided,
        goal: user.goal || notProvided,
        interestCities: list(user.interestCities),
        savedCount: String(user.savedCount ?? 0),
      },
      travels: [],
    };
  }
}
