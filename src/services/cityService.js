import { API_BASE_URL } from "../config/api";

function optionalTextToNull(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

function optionalLongDescriptionToNull(value) {
  if (value == null) return null;
  const html = String(value).trim();
  if (!html) return null;
  const textOnly = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim();
  if (!textOnly) return null;
  return html;
}

export function buildCityApiPayload(data) {
  return {
    name: String(data.name ?? "").trim(),
    engName: optionalTextToNull(data.engName) || optionalTextToNull(data.name),
    subtitle: optionalTextToNull(data.subtitle),
    description: optionalTextToNull(data.description),
    longDescription: optionalLongDescriptionToNull(data.longDescription),
    climateDescription: optionalTextToNull(data.climateDescription),
    climateWinter: optionalTextToNull(data.climateWinter),
    climateSpring: optionalTextToNull(data.climateSpring),
    climateSummer: optionalTextToNull(data.climateSummer),
    climateAutumn: optionalTextToNull(data.climateAutumn),
    costMonthlyAverage: optionalTextToNull(data.costMonthlyAverage),
    costRent: optionalTextToNull(data.costRent),
    costUtilities: optionalTextToNull(data.costUtilities),
    costFood: optionalTextToNull(data.costFood),
    costTransport: optionalTextToNull(data.costTransport),
    climateImageUrl: optionalTextToNull(data.climateImageUrl),
    costOfLivingImageUrl: optionalTextToNull(data.costOfLivingImageUrl),
    techScene: optionalTextToNull(data.techScene),
    surfSeason: optionalTextToNull(data.surfSeason),
    countryId: data.countryId,
    ...(typeof data.isActive === "boolean" ? { isActive: data.isActive } : {}),
    benefits: Array.isArray(data.benefits)
      ? data.benefits.map((s) => String(s).trim()).filter(Boolean)
      : [],
  };
}

export class CityService {
  static async getAuthToken() {
    const { getAuth } = await import("../demo/session");
    const authInstance = getAuth();
    const user = authInstance.currentUser;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();
    return token;
  }

  static async getCities() {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/cities/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          search: "",
          page: 1,
          limit: 100,
          sortBy: "name",
          sortDirection: "asc",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch cities: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      throw error;
    }
  }

  static async getAllCities() {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/cities/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          search: "",
          page: 1,
          limit: 1000,
          sortBy: "name",
          sortDirection: "asc",
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch cities: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      throw error;
    }
  }

  static async getCitiesByCountry(countryId) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/cities/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          search: "",
          page: 1,
          limit: 100,
          sortBy: "name",
          sortDirection: "asc",
          filters: { countryIds: [countryId] },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch cities: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      throw error;
    }
  }

  static async getCityById(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/cities/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch city: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async searchCities(params = {}) {
    try {
      const token = await this.getAuthToken();
      const requestBody = {
        search: params.search || "",
        page: params.page || 1,
        limit: params.limit ?? 100,
        sortBy: params.sortBy || "name",
        sortDirection: params.sortDirection || "asc",
      };
      if (params.filters?.countryIds?.length) {
        requestBody.filters = { countryIds: params.filters.countryIds };
      }
      const response = await fetch(`${API_BASE_URL}/admin/cities/search`, {
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
          `Failed to search cities: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async createCity(data) {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/admin/cities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildCityApiPayload(data)),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to create city: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async updateCity(id, data) {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/admin/cities/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(buildCityApiPayload(data)),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to update city: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async deleteCity(id) {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/admin/cities/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to delete city: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }
      return true;
    } catch (error) {
      throw error;
    }
  }

  static async getCityImageUploadUrl(cityId, contentType) {
    const token = await this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/city-media/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ cityId, contentType }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to get city image upload URL: ${response.status} - ${
          errorData.message || "Unknown error"
        }`
      );
    }
    return await response.json();
  }

  static async deleteCityMedia(mediaId) {
    const token = await this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/city-media/${encodeURIComponent(mediaId)}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to delete city image: ${response.status} - ${errorData.message || "Unknown error"}`
      );
    }
    if (response.status === 204) return true;
    const text = await response.text();
    if (!text) return true;
    try {
      return JSON.parse(text);
    } catch {
      return true;
    }
  }
}
