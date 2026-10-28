import { API_BASE_URL } from "../config/api";

import { ImageProcessingUtils } from "../utils/imageUtils";
import { buildAccommodationSearchRequest } from "../utils/accommodationFilterUtils";
import { toNullableRichText, toNullableString } from "../utils/richtextUtils";

const appendAccommodationHostFields = (apiData, accommodationData) => {
  apiData.accommodationInstructions = toNullableRichText(accommodationData.accommodationInstructions);
  apiData.accommodationInstructionsNote = toNullableString(
    accommodationData.accommodationInstructionsNote
  );
  apiData.accommodationContactType = toNullableString(accommodationData.accommodationContactType);
  apiData.accommodationContactName = toNullableString(accommodationData.accommodationContactName);
  apiData.hostPhone = toNullableString(accommodationData.hostPhone);
  apiData.hostWhatsapp = toNullableString(accommodationData.hostWhatsapp);
  apiData.hostEmail = toNullableString(accommodationData.hostEmail);
  apiData.houseRules = toNullableRichText(accommodationData.houseRules);
};

export class AccommodationService {
  static addCreatedAccommodation(accommodationId) {
    if (!this.createdAccommodations) {
      this.createdAccommodations = [];
    }
    this.createdAccommodations.push(accommodationId);
  }

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

  static async getAccommodationById(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/accommodations/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch accommodation: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async getAccommodationsBySchoolId(schoolId = null) {
    try {
      const token = await this.getAuthToken();

      const requestBody = {
        search: "",
        page: 1,
        limit: 100,
        sortBy: "name",
        sortDirection: "asc",
        filter: schoolId
          ? {
              schoolIds: [schoolId],
            }
          : {},
      };

      const response = await fetch(`${API_BASE_URL}/admin/accommodations/search`, {
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
          `Failed to fetch accommodations: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching accommodations by school ID:", error);
      return { data: [], meta: { totalItems: 0, currentPage: 1, totalPages: 0 } };
    }
  }

  static async getAllAccommodations(filters = {}) {
    try {
      const token = await this.getAuthToken();

      const requestBody = buildAccommodationSearchRequest(filters);

      const response = await fetch(`${API_BASE_URL}/admin/accommodations/search`, {
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
          `Failed to fetch accommodations: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching all accommodations:", error);
      return { data: [], meta: { totalItems: 0, currentPage: 1, totalPages: 0 } };
    }
  }

  static async createAccommodation(accommodationData) {
    try {
      const token = await this.getAuthToken();

      const apiData = {
        name: accommodationData.name,
        category: accommodationData.category || "residence",
        type: accommodationData.type || "Private",
        bathroomType: accommodationData.bathroomType || "Ensuite",
        regimeType: accommodationData.regimeType || "NoMeals",
        schoolId: accommodationData.schoolId,
        isActive: accommodationData.isActive !== undefined ? Boolean(accommodationData.isActive) : true,
        cityId: accommodationData.cityId,
        currency: accommodationData.currency || "EUR",
        address: accommodationData.address || "",
        minAge: parseInt(accommodationData.minAge) || 18,
        maxAge: parseInt(accommodationData.maxAge) || 65,
        description: accommodationData.description || "",
        url: accommodationData.url || "",
        amenityIds: Array.isArray(accommodationData.amenityIds)
          ? accommodationData.amenityIds.filter((id) => typeof id === "string" && id.length > 0)
          : [],
        campusIds: Array.isArray(accommodationData.campusIds)
          ? accommodationData.campusIds.filter((id) => typeof id === "string" && id.length > 0)
          : [],
      };
      appendAccommodationHostFields(apiData, accommodationData);

      if (accommodationData.simplePrices && accommodationData.simplePrices.length > 0) {
        apiData.simplePrices = accommodationData.simplePrices;
      }
      if (accommodationData.flexiblePrices && accommodationData.flexiblePrices.length > 0) {
        apiData.flexibleDurationPrices = accommodationData.flexiblePrices;
      }
      if (accommodationData.fixedPrices && accommodationData.fixedPrices.length > 0) {
        apiData.fixedDurationPrices = accommodationData.fixedPrices;
      }

      if (accommodationData.images && accommodationData.images.length > 0) {
        const { MediaService } = await import("./mediaService");
        const uploadedImages = await MediaService.uploadAccommodationImages(
          accommodationData.images,
          accommodationData.name
        );
        apiData.images = uploadedImages;
      }

      apiData.fullPaymentDiscount = accommodationData.fullPaymentDiscount ?? null;

      const response = await fetch(`${API_BASE_URL}/admin/accommodations`, {
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
          `Failed to create accommodation: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      const result = await response.json();
      this.addCreatedAccommodation(result.id);
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async updateAccommodation(id, accommodationData) {
    try {
      const token = await this.getAuthToken();

      const apiData = {
        name: accommodationData.name,
        category: accommodationData.category || "residence",
        type: accommodationData.type || "Private",
        bathroomType: accommodationData.bathroomType || "Ensuite",
        regimeType: accommodationData.regimeType || "NoMeals",
        schoolId: accommodationData.schoolId,
        isActive: accommodationData.isActive !== undefined ? Boolean(accommodationData.isActive) : true,
        cityId: accommodationData.cityId,
        currency: accommodationData.currency || "EUR",
        address: accommodationData.address || "",
        minAge: parseInt(accommodationData.minAge) || 18,
        maxAge: parseInt(accommodationData.maxAge) || 65,
        description: accommodationData.description || "",
        url: accommodationData.url || "",
        amenityIds: Array.isArray(accommodationData.amenityIds)
          ? accommodationData.amenityIds.filter((id) => typeof id === "string" && id.length > 0)
          : [],
        campusIds: Array.isArray(accommodationData.campusIds)
          ? accommodationData.campusIds.filter((id) => typeof id === "string" && id.length > 0)
          : [],
      };
      appendAccommodationHostFields(apiData, accommodationData);

      if (accommodationData.simplePrices && accommodationData.simplePrices.length > 0) {
        apiData.simplePrices = accommodationData.simplePrices;
      }
      if (accommodationData.flexiblePrices && accommodationData.flexiblePrices.length > 0) {
        apiData.flexibleDurationPrices = accommodationData.flexiblePrices;
      }
      if (accommodationData.fixedPrices && accommodationData.fixedPrices.length > 0) {
        apiData.fixedDurationPrices = accommodationData.fixedPrices;
      }

      if (accommodationData.images && accommodationData.images.length > 0) {
        const { MediaService } = await import("./mediaService");
        const uploadedImages = await MediaService.uploadAccommodationImages(
          accommodationData.images,
          accommodationData.name
        );
        apiData.images = uploadedImages;
      }

      apiData.fullPaymentDiscount = accommodationData.fullPaymentDiscount ?? null;

      const response = await fetch(`${API_BASE_URL}/admin/accommodations/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to update accommodation: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async deleteAccommodation(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/accommodations/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to delete accommodation: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
}
