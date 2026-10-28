import { API_BASE_URL } from "../config/api";
import { AuthService } from "./authService";

export class CountryFaqService {
  static async getAuthToken() {
    const token = await AuthService.getIdToken();
    if (!token) throw new Error("User not authenticated");
    return token;
  }

  static async getByCountryId(countryId) {
    const token = await this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/country-faqs/country/${countryId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to fetch country FAQs: ${response.status} - ${errorData.message || "Unknown error"}`
      );
    }
    return await response.json();
  }

  static async create(data) {
    const token = await this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/country-faqs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        countryId: data.countryId,
        question: data.question,
        answer: data.answer,
        order: data.order ?? 0,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to create country FAQ: ${response.status} - ${errorData.message || "Unknown error"}`
      );
    }
    return await response.json();
  }

  static async update(id, data) {
    const token = await this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/country-faqs/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        countryId: data.countryId,
        question: data.question,
        answer: data.answer,
        order: data.order ?? 0,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to update country FAQ: ${response.status} - ${errorData.message || "Unknown error"}`
      );
    }
    return await response.json();
  }

  static async remove(id) {
    const token = await this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/country-faqs/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to delete country FAQ: ${response.status} - ${errorData.message || "Unknown error"}`
      );
    }
    return true;
  }
}
