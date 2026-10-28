import { API_BASE_URL } from "../config/api";

function toNullableCountryContactField(value) {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed || null;
}

export class CountryService {
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

  static async getAllCountries(filters = {}) {
    try {
      const token = await this.getAuthToken();

      const requestBody = {
        search: filters.search || "",
        page: filters.page || 1,
        limit: filters.limit || 100,
        sortBy: filters.sortBy || "name",
        sortDirection: filters.sortDirection || "asc",
      };

      const response = await fetch(`${API_BASE_URL}/admin/countries/search`, {
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
          `Failed to fetch countries: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching all countries:", error);
      return { data: [], meta: { totalItems: 0, currentPage: 1, totalPages: 0 } };
    }
  }

  static async getCountryById(countryId) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/countries/${countryId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch country: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching country:", error);
      return null;
    }
  }

  static async getCountryName(countryId) {
    if (!countryId) return "Not provided";

    if (!this.countryCache) {
      this.countryCache = {};
    }

    if (this.countryCache[countryId]) {
      return this.countryCache[countryId];
    }

    try {
      const country = await this.getCountryById(countryId);
      if (country && country.name) {
        this.countryCache[countryId] = country.name;
        return country.name;
      }
    } catch (error) {
      console.error(`Error fetching country name for ID ${countryId}:`, error);
    }

    this.countryCache[countryId] = countryId;
    return countryId;
  }

  static async getMultipleCountryNames(countryIds) {
    if (!countryIds || countryIds.length === 0) return "Not provided";

    const countryNames = await Promise.all(countryIds.map((id) => this.getCountryName(id)));

    return countryNames.join(", ");
  }

  static async createCountry(countryData) {
    try {
      const token = await this.getAuthToken();

      const apiData = {
        name: countryData.name,
        engName: countryData.engName || countryData.name,
        subtitle: countryData.subtitle,
        code: countryData.code,
        description: countryData.description,
        idealForStudyAndTravel: countryData.idealForStudyAndTravel,
        highlights: countryData.highlights,
        climate: countryData.climate,
        visaInfo: countryData.visaInfo,
        benefits: countryData.benefits || [],
        techScene: countryData.techScene || "",
        surfSeason: countryData.surfSeason || "",
        tagsShortTerm: countryData.tagsShortTerm || [],
        tagsLongTerm: countryData.tagsLongTerm || [],
        highlightsShortTerm: countryData.highlightsShortTerm || [],
        highlightsLongTerm: countryData.highlightsLongTerm || [],
        isActive: countryData.isActive !== undefined ? countryData.isActive : true,
        localEmergencyNumber: toNullableCountryContactField(countryData.localEmergencyNumber),
      };

      const response = await fetch(`${API_BASE_URL}/admin/countries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to create country: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async updateCountry(id, countryData) {
    try {
      const token = await this.getAuthToken();

      const codeTrim =
        countryData.code != null && String(countryData.code).trim() !== ""
          ? String(countryData.code).trim()
          : "";
      const apiData = {
        name: countryData.name,
        engName: countryData.engName || countryData.name,
        subtitle: countryData.subtitle,
        description: countryData.description,
        idealForStudyAndTravel: countryData.idealForStudyAndTravel,
        highlights: countryData.highlights,
        climate: countryData.climate,
        visaInfo: countryData.visaInfo,
        benefits: countryData.benefits || [],
        techScene: countryData.techScene || "",
        surfSeason: countryData.surfSeason || "",
        tagsShortTerm: countryData.tagsShortTerm || [],
        tagsLongTerm: countryData.tagsLongTerm || [],
        highlightsShortTerm: countryData.highlightsShortTerm || [],
        highlightsLongTerm: countryData.highlightsLongTerm || [],
        isActive: countryData.isActive !== undefined ? countryData.isActive : true,
        localEmergencyNumber: toNullableCountryContactField(countryData.localEmergencyNumber),
      };
      if (codeTrim) {
        apiData.code = codeTrim;
      }

      const response = await fetch(`${API_BASE_URL}/admin/countries/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to update country: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async reorderCountries(items) {
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/admin/countries/reorder`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to reorder countries: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async deleteCountry(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/countries/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to delete country: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async getCountryImageUploadUrl(countryId, contentType) {
    const token = await this.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/country-media/upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ countryId, contentType }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to get country image upload URL: ${response.status} - ${
          errorData.message || "Unknown error"
        }`
      );
    }
    return await response.json();
  }

  static async getCountryFlagUploadUrl(countryId, contentType) {
    const token = await this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/countries/${encodeURIComponent(countryId)}/image/upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ contentType }),
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to get country flag upload URL: ${response.status} - ${
          errorData.message || "Unknown error"
        }`
      );
    }
    return await response.json();
  }

  static async deleteCountryMedia(mediaId) {
    const token = await this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/country-media/${encodeURIComponent(mediaId)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to delete country image: ${response.status} - ${
          errorData.message || "Unknown error"
        }`
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

  static async getCountryProgramTypes(countryId) {
    const token = await this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/countries/${encodeURIComponent(countryId)}/program-types`,
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
        `Failed to fetch country program types: ${response.status} - ${
          errorData.message || "Unknown error"
        }`
      );
    }
    return await response.json();
  }

  static async upsertCountryProgramType(countryId, payload) {
    const token = await this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/countries/${encodeURIComponent(countryId)}/program-types`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to save country program type: ${response.status} - ${
          errorData.message || "Unknown error"
        }`
      );
    }
    return await response.json();
  }

  static async deleteCountryProgramType(countryId, typeKey) {
    const token = await this.getAuthToken();
    const response = await fetch(
      `${API_BASE_URL}/admin/countries/${encodeURIComponent(
        countryId
      )}/program-types/${encodeURIComponent(typeKey)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `Failed to delete country program type: ${response.status} - ${
          errorData.message || "Unknown error"
        }`
      );
    }
    return true;
  }

  static async getAllCountriesList() {
    try {
      const result = await this.getAllCountries({ limit: 1000 });
      return result.data || [];
    } catch (error) {
      console.error("Error fetching all countries list:", error);
      return [];
    }
  }
}
