import { API_BASE_URL } from "../config/api";

export class SchoolAwardsService {
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

  static async getSchoolAwards(schoolId) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/school-awards/school/${schoolId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch school awards: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      const result = await response.json();
      return result || [];
    } catch (error) {
      throw error;
    }
  }

  static async createSchoolAward(awardData) {
    try {
      const token = await this.getAuthToken();

      if (!awardData.schoolId) {
        throw new Error("School ID is required");
      }

      if (!awardData.caption || !awardData.caption.trim()) {
        throw new Error("Award caption is required");
      }

      let imageUrl = "";

      if (awardData.image?.file) {
        const { MediaService } = await import("./mediaService");
        imageUrl = await MediaService.uploadSchoolAward(
          awardData.image.file,
          awardData.schoolName || "school"
        );
      } else if (awardData.image?.preview && !awardData.image.preview.startsWith("blob:")) {
        imageUrl = awardData.image.preview;
      } else if (typeof awardData.image === "string" && !awardData.image.startsWith("blob:")) {
        imageUrl = awardData.image;
      }

      if (!imageUrl) {
        throw new Error("Award image is required");
      }

      const apiData = {
        schoolId: awardData.schoolId,
        imageUrl: imageUrl,
        caption: awardData.caption.trim(),
      };

      const response = await fetch(`${API_BASE_URL}/admin/school-awards`, {
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
          `Failed to create school award: ${response.status} - ${
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

  static async updateSchoolAward(id, awardData) {
    try {
      const token = await this.getAuthToken();

      let imageUrl = "";
      if (awardData.image?.file) {
        const { MediaService } = await import("./mediaService");
        imageUrl = await MediaService.uploadSchoolAward(
          awardData.image.file,
          awardData.schoolName || "school"
        );
      } else if (awardData.image?.preview && !awardData.image.preview.startsWith("blob:")) {
        imageUrl = awardData.image.preview;
      } else if (typeof awardData.image === "string" && !awardData.image.startsWith("blob:")) {
        imageUrl = awardData.image;
      }

      const apiData = {
        imageUrl: imageUrl,
        caption: awardData.caption || awardData.description || "",
      };

      const response = await fetch(`${API_BASE_URL}/admin/school-awards/${id}`, {
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
          `Failed to update school award: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async deleteSchoolAward(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/school-awards/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to delete school award: ${response.status} - ${
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
