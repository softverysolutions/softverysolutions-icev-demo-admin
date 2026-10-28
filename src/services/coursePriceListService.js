import { API_BASE_URL } from "../config/api";

export class CoursePriceListService {
  static normalizeListResponse(data) {
    if (Array.isArray(data)) {
      return data;
    }
    if (Array.isArray(data?.data)) {
      return data.data;
    }
    if (Array.isArray(data?.priceLists)) {
      return data.priceLists;
    }
    return [];
  }

  static async getAuthToken() {
    const { getAuth } = await import("../demo/session");
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    return await user.getIdToken();
  }

  static async listByCourse(courseId) {
    const token = await this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/course-price-lists/course/${courseId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch course price lists: ${response.status} - ${err.message || "Unknown error"}`
      );
    }
    const data = await response.json();
    return this.normalizeListResponse(data);
  }

  static async create(payload) {
    const token = await this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/course-price-lists`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to create course price list: ${response.status} - ${err.message || "Unknown error"}`
      );
    }
    return await response.json();
  }

  static async update(id, payload) {
    const token = await this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/course-price-lists/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to update course price list: ${response.status} - ${err.message || "Unknown error"}`
      );
    }
    return await response.json();
  }

  static async delete(id) {
    const token = await this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/course-price-lists/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      if (err.errorKey === "COURSE_PRICE_LIST_CANNOT_DELETE_NON_FUTURE") {
        throw new Error("Cannot delete active price list. Only future price lists can be deleted.");
      }
      throw new Error(
        `Failed to delete course price list: ${response.status} - ${err.message || "Unknown error"}`
      );
    }
    return true;
  }
}

export default CoursePriceListService;
