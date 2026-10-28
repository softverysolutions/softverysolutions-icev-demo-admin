import { API_BASE_URL } from "../config/api";

export class SchoolService {
  static mapSchoolType(type) {
    return String(type || "").toLowerCase() === "sport" ? "sport" : "tech";
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

  static async getSchools(filters = {}) {
    try {
      const token = await this.getAuthToken();

      const requestBody = {
        search: filters.search || "",
        page: filters.page || 1,
        limit: filters.limit || 100,
        sortBy: filters.sortBy || "name",
        sortDirection: filters.sortDirection || "asc",
      };

      if (filters.countryIds && filters.countryIds.length > 0) {
        requestBody.filters = {
          countryIds: filters.countryIds,
        };
      }
      if (filters.cityIds && filters.cityIds.length > 0) {
        requestBody.filters = {
          ...(requestBody.filters || {}),
          cityIds: filters.cityIds,
        };
      }

      const response = await fetch(`${API_BASE_URL}/admin/schools/search`, {
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
          `Failed to fetch schools: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async getSchoolById(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/schools/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch school: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async createSchool(schoolData) {
    try {
      const token = await this.getAuthToken();

      let logoUrl = "";
      if (schoolData.logo?.file) {
        const { MediaService } = await import("./mediaService");
        logoUrl = await MediaService.uploadSchoolLogo(schoolData.logo.file, schoolData.name);
      } else if (schoolData.logo?.preview && !schoolData.logo.preview.startsWith("blob:")) {
        logoUrl = schoolData.logo.preview;
      } else if (typeof schoolData.logo === "string" && !schoolData.logo.startsWith("blob:")) {
        logoUrl = schoolData.logo;
      }

      const apiData = {
        name: schoolData.name,
        logo: logoUrl,
        schoolType: this.mapSchoolType(schoolData.type),
        description: schoolData.description || "",
        contactEmail: schoolData.contactEmail || "",
        contactPhone: schoolData.contactPhone || "",
        countryId: schoolData.countryId,
        isActive: schoolData.isActive !== undefined ? schoolData.isActive : true,
      };

      if (schoolData.images && schoolData.images.length > 0) {
        const { MediaService } = await import("./mediaService");
        const uploadedImages = await MediaService.uploadSchoolImages(
          schoolData.images,
          schoolData.name
        );
        apiData.images = uploadedImages;
      }

      const response = await fetch(`${API_BASE_URL}/admin/schools`, {
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
          `Failed to create school: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      throw error;
    }
  }

  static async updateSchool(id, schoolData) {
    try {
      const token = await this.getAuthToken();

      let logoUrl = "";
      if (schoolData.logo?.file) {
        const { MediaService } = await import("./mediaService");
        logoUrl = await MediaService.uploadSchoolLogo(schoolData.logo.file, schoolData.name);
      } else if (schoolData.logo?.preview && !schoolData.logo.preview.startsWith("blob:")) {
        logoUrl = schoolData.logo.preview;
      } else if (typeof schoolData.logo === "string" && !schoolData.logo.startsWith("blob:")) {
        logoUrl = schoolData.logo;
      }

      const apiData = {
        name: schoolData.name,
        logo: logoUrl,
        schoolType: this.mapSchoolType(schoolData.type),
        description: schoolData.description || "",
        contactEmail: schoolData.contactEmail || "",
        contactPhone: schoolData.contactPhone || "",
        countryId: schoolData.countryId,
        isActive: schoolData.isActive !== undefined ? schoolData.isActive : true,
      };

      if (schoolData.images && schoolData.images.length > 0) {
        const { MediaService } = await import("./mediaService");
        const uploadedImages = await MediaService.uploadSchoolImages(
          schoolData.images,
          schoolData.name
        );
        apiData.images = uploadedImages;
      }

      const response = await fetch(`${API_BASE_URL}/admin/schools/${id}`, {
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
          `Failed to update school: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async deleteSchool(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/schools/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to delete school: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
}
