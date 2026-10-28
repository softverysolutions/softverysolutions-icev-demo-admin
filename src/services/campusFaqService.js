import { API_BASE_URL } from "../config/api";

export class CampusFaqService {
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

  static async getCampusFaqs(campusId) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/campus-faqs/campus/${campusId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch campus FAQs: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching campus FAQs:", error);
      throw error;
    }
  }

  static async getCampusFaqById(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/campus-faqs/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch campus FAQ: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching campus FAQ:", error);
      throw error;
    }
  }

  static async createCampusFaq(faqData) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/campus-faqs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(faqData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to create campus FAQ: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating campus FAQ:", error);
      throw error;
    }
  }

  static async updateCampusFaq(id, faqData) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/campus-faqs/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(faqData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to update campus FAQ: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating campus FAQ:", error);
      throw error;
    }
  }

  static async deleteCampusFaq(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/campus-faqs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to delete campus FAQ: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return true;
    } catch (error) {
      console.error("Error deleting campus FAQ:", error);
      throw error;
    }
  }
}
