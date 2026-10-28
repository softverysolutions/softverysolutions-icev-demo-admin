import { API_BASE_URL } from "../config/api";
import { MediaService } from "./mediaService";
import { toNullableString, toNullableRichText } from "../utils/richtextUtils";

export class CampusService {
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

  static addCreatedCampus(campus) {
    if (!this.createdCampuses) {
      this.createdCampuses = [];
    }
    this.createdCampuses.push(campus);
  }

  static async getCampuses(schoolId) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/campuses/search`, {
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
          filters: {
            schoolIds: [schoolId],
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch campuses: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      throw error;
    }
  }

  static async getCampusesByCityId(cityId) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/campuses/search`, {
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
          filters: {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch campuses by city: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      const result = await response.json();
      const allCampuses = result.data || [];

      const filteredCampuses = allCampuses.filter((campus) => campus.cityId === cityId);

      return filteredCampuses;
    } catch (error) {
      console.error("Error fetching campuses by city:", error);
      return [];
    }
  }

  static async getAllCampuses() {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/campuses/search`, {
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
          filters: {},
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch all campuses: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      const result = await response.json();
      return result.data || [];
    } catch (error) {
      console.error("Error fetching all campuses:", error);
      return [];
    }
  }

  static async searchAdminCampuses({
    schoolIds = [],
    countryIds = [],
    limit = 20,
    page = 1,
    search = "",
  } = {}) {
    const filters = {};
    if (countryIds?.length) filters.countryIds = countryIds;
    if (schoolIds?.length) filters.schoolIds = schoolIds;
    if (Object.keys(filters).length === 0) {
      return {
        data: [],
        meta: { currentPage: page, totalPages: 1, totalItems: 0 },
      };
    }
    try {
      const token = await this.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/admin/campuses/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          search: search || "",
          page,
          limit,
          sortBy: "name",
          sortDirection: "asc",
          filters,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to search campuses: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }
      const result = await response.json();
      const rows = result.data || [];
      const meta = result.meta || {};
      return {
        data: rows,
        meta: {
          currentPage: Number(meta.currentPage) || page,
          totalPages: Number(meta.totalPages) || 1,
          totalItems: Number(meta.totalItems) ?? rows.length,
        },
      };
    } catch (error) {
      console.error("Error searching admin campuses:", error);
      return {
        data: [],
        meta: { currentPage: page, totalPages: 1, totalItems: 0 },
      };
    }
  }

  static async getCampusById(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/campuses/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch campus: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async getCampusesCount(schoolId) {
    try {
      const campuses = await this.getCampuses(schoolId);
      return campuses.length;
    } catch (error) {
      return 0;
    }
  }

  static async createCampus(campusData) {
    try {
      const token = await this.getAuthToken();

      const apiData = {
        isActive: campusData.isActive !== undefined ? Boolean(campusData.isActive) : true,
        name: campusData.name,
        address: campusData.address || "",
        schoolId: campusData.schoolId,
        cityId: campusData.cityId,
        countryId: campusData.countryId,
        avgStudentsPerClass: parseInt(campusData.avgStudentsPerClass) || 15,
        numberOfStudents:
          campusData.numberOfStudents === "" ||
          campusData.numberOfStudents === null ||
          campusData.numberOfStudents === undefined
            ? null
            : Math.max(0, parseInt(campusData.numberOfStudents, 10) || 0),
        averageRating: campusData.averageRating ? parseFloat(campusData.averageRating) : null,
        website: campusData.website || "",
        videoUrl: campusData.videoUrl || "",
        lat: campusData.lat || "",
        lon: campusData.lon || "",
        currency: campusData.currency || "EUR",
        description: campusData.description || "",
        arriveByTime: toNullableString(campusData.firstDaysInstructions?.arriveByTime),
        arriveByText: toNullableString(campusData.firstDaysInstructions?.arriveByText),
        whatToBring: toNullableRichText(campusData.firstDaysInstructions?.whatToBring),
      };

      if (campusData.highlights && campusData.highlights.length > 0) {
        apiData.highlights = campusData.highlights;
      }

      if (campusData.images && campusData.images.length > 0) {
        const uploadedImages = await MediaService.uploadCampusImages(
          campusData.images,
          campusData.name
        );
        apiData.images = uploadedImages;
      }

      if (campusData.nationalities && campusData.nationalities.length > 0) {
        apiData.nationalities = campusData.nationalities;
      }

      let processedAmenities = campusData.amenities || [];

      if (
        processedAmenities.length > 0 &&
        processedAmenities[0].name &&
        !processedAmenities[0].amenityId &&
        !processedAmenities[0].id
      ) {
        try {
          const { AmenityService } = await import("services/amenityService");
          const allAmenities = await AmenityService.getAllAmenities();

          processedAmenities = processedAmenities
            .map((amenity) => {
              const foundAmenity = allAmenities.find((a) => a.name === amenity.name);
              if (foundAmenity) {
                return { amenityId: foundAmenity.id };
              }
              return null;
            })
            .filter(Boolean);
        } catch (error) {}
      }

      apiData.amenities = processedAmenities
        .map((amenity) => {
          let amenityId;

          if (typeof amenity === "string") {
            amenityId = amenity;
          } else if (typeof amenity === "object") {
            amenityId = amenity.amenityId || amenity.id || amenity.name;
          } else {
            amenityId = amenity;
          }

          return {
            amenityId: String(amenityId),
          };
        })
        .filter(
          (amenity) =>
            amenity.amenityId && amenity.amenityId !== "undefined" && amenity.amenityId !== "null"
        );

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch(`${API_BASE_URL}/admin/campuses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(apiData),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        if (!response.ok) {
          let errorData = {};
          let responseText = "";
          try {
            responseText = await response.text();
            errorData = JSON.parse(responseText);
          } catch (jsonError) {
            errorData = { message: "Failed to parse error response", rawText: responseText };
          }
          throw new Error(
            `Failed to create campus: ${errorData.message || errorData.error || "Unknown error"}`
          );
        }

        let result;
        try {
          result = await response.json();
        } catch (jsonError) {
          throw new Error("Failed to parse API response");
        }

        this.addCreatedCampus(result.id);

        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === "AbortError") {
          throw new Error("Request timeout while creating campus");
        }
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  static async updateCampus(id, campusData) {
    try {
      const token = await this.getAuthToken();

      const apiData = {
        isActive: campusData.isActive !== undefined ? Boolean(campusData.isActive) : true,
        name: campusData.name,
        address: campusData.address || "",
        schoolId: campusData.schoolId,
        cityId: campusData.cityId,
        countryId: campusData.countryId,
        avgStudentsPerClass: parseInt(campusData.avgStudentsPerClass) || 15,
        numberOfStudents:
          campusData.numberOfStudents === "" ||
          campusData.numberOfStudents === null ||
          campusData.numberOfStudents === undefined
            ? null
            : Math.max(0, parseInt(campusData.numberOfStudents, 10) || 0),
        averageRating: campusData.averageRating ? parseFloat(campusData.averageRating) : null,
        website: campusData.website || "",
        videoUrl: campusData.videoUrl || "",
        lat: campusData.lat || "",
        lon: campusData.lon || "",
        currency: campusData.currency || "EUR",
        description: campusData.description || "",
        arriveByTime: toNullableString(campusData.firstDaysInstructions?.arriveByTime),
        arriveByText: toNullableString(campusData.firstDaysInstructions?.arriveByText),
        whatToBring: toNullableRichText(campusData.firstDaysInstructions?.whatToBring),
      };

      if (campusData.highlights && campusData.highlights.length > 0) {
        apiData.highlights = campusData.highlights;
      }

      if (campusData.images && campusData.images.length > 0) {
        const uploadedImages = await MediaService.uploadCampusImages(
          campusData.images,
          campusData.name
        );
        apiData.images = uploadedImages;
      }

      if (campusData.nationalities && campusData.nationalities.length > 0) {
        apiData.nationalities = campusData.nationalities;
      }

      let processedAmenities = campusData.amenities || [];

      if (
        processedAmenities.length > 0 &&
        processedAmenities[0].name &&
        !processedAmenities[0].amenityId &&
        !processedAmenities[0].id
      ) {
        try {
          const { AmenityService } = await import("services/amenityService");
          const allAmenities = await AmenityService.getAllAmenities();

          processedAmenities = processedAmenities
            .map((amenity) => {
              const foundAmenity = allAmenities.find((a) => a.name === amenity.name);
              if (foundAmenity) {
                return { amenityId: foundAmenity.id };
              }
              return null;
            })
            .filter(Boolean);
        } catch (error) {}
      }

      apiData.amenities = processedAmenities
        .map((amenity) => {
          let amenityId;

          if (typeof amenity === "string") {
            amenityId = amenity;
          } else if (typeof amenity === "object") {
            amenityId = amenity.amenityId || amenity.id || amenity.name;
          } else {
            amenityId = amenity;
          }

          return {
            amenityId: String(amenityId),
          };
        })
        .filter(
          (amenity) =>
            amenity.amenityId && amenity.amenityId !== "undefined" && amenity.amenityId !== "null"
        );

      const response = await fetch(`${API_BASE_URL}/admin/campuses/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(apiData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to update campus: ${errorData.message || "Unknown error"}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async deleteCampus(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/campuses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to delete campus: ${errorData.message || "Unknown error"}`);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
}
