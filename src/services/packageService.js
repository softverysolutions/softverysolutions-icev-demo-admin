import { API_BASE_URL } from "../config/api";

export class PackageService {
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

  static async searchPackages(searchParams = {}) {
    try {
      const token = await this.getAuthToken();

      const requestBody = {
        search: searchParams.search || "",
        page: searchParams.page || 1,
        limit: searchParams.limit || 10,
        sortBy: searchParams.sortBy || "createdAt",
        sortDirection: searchParams.sortDirection || "desc",
        filters: searchParams.filters || {},
      };

      const response = await fetch(`${API_BASE_URL}/admin/packages/search`, {
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
          `Failed to search packages: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error searching packages:", error);
      throw error;
    }
  }

  static async getPackageById(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/packages/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch package: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error fetching package ${id}:`, error);
      throw error;
    }
  }

  static async createPackage(packageData) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/packages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(packageData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to create package: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating package:", error);
      throw error;
    }
  }

  static async updatePackage(id, packageData) {
    try {
      const token = await this.getAuthToken();

      const cleanData = { ...packageData };
      Object.keys(cleanData).forEach(key => {
        if (cleanData[key] === undefined) {
          delete cleanData[key];
        }
      });
      if (packageData.serviceIds !== undefined) {
        cleanData.serviceIds = Array.isArray(packageData.serviceIds) ? packageData.serviceIds : [];
      }

      const response = await fetch(`${API_BASE_URL}/admin/packages/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(cleanData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const error = new Error(
          `Failed to update package: ${response.status} - ${errorData.message || errorData.error || "Unknown error"}`
        );
        error.statusCode = response.status;
        error.errorData = errorData;
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error(`Error updating package ${id}:`, error);
      throw error;
    }
  }

  static async assignPackageExperiences(packageId, experienceIds = []) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(
        `${API_BASE_URL}/admin/packages/${packageId}/experiences`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            experienceIds: Array.isArray(experienceIds) ? experienceIds : [],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to assign package experiences: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      console.error(`Error assigning experiences to package ${packageId}:`, error);
      throw error;
    }
  }

  static async deletePackage(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/packages/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to delete package: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return true;
    } catch (error) {
      console.error(`Error deleting package ${id}:`, error);
      throw error;
    }
  }
}
