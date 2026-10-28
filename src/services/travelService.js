import { API_BASE_URL } from "../config/api";
import { AuthService } from "./authService";

export class TravelService {
  static async getAuthToken() {
    const token = await AuthService.getIdToken();
    if (!token) {
      throw new Error("User not authenticated");
    }
    return token;
  }

  static async searchTravels(params = {}) {
    try {
      const token = await this.getAuthToken();

      const requestBody = {
        page: params.page || 1,
        limit: params.limit || 100,
        sortBy: params.sortBy || "createdAt",
        sortDirection: params.sortDirection || "asc",
      };

      if (params.search) {
        requestBody.search = params.search;
      }

      if (params.filter && Object.keys(params.filter).length > 0) {
        requestBody.filter = params.filter;
      }

      const response = await fetch(`${API_BASE_URL}/admin/travels/search`, {
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
          `Failed to search travels: ${response.status} - ${
            errorData.message || errorData.error || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async getTravelById(travelId) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/travels/${travelId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to get travel: ${response.status} - ${
            errorData.message || errorData.error || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async getUserTravels(userId) {
    try {
      const result = await this.searchTravels({
        page: 1,
        limit: 100,
        filter: {
          userId: userId,
        },
      });

      if (Array.isArray(result)) {
        return result;
      } else if (result.data && Array.isArray(result.data)) {
        return result.data;
      } else if (result.items && Array.isArray(result.items)) {
        return result.items;
      } else if (result.results && Array.isArray(result.results)) {
        return result.results;
      }

      return [];
    } catch (error) {
      console.error("Error fetching user travels:", error);
      return [];
    }
  }

  static async cancelTravel(travelId, cancelData) {
    try {
      const token = await this.getAuthToken();

      let refundStatusValue = cancelData.refundStatus;
      if (refundStatusValue === "not_started") {
        refundStatusValue = "notStarted";
      } else if (refundStatusValue === "in_progress") {
        refundStatusValue = "inProgress";
      } else if (refundStatusValue === "not_required") {
        refundStatusValue = "notRequired";
      }

      const response = await fetch(`${API_BASE_URL}/admin/travels/${travelId}/cancel`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cancelReason: cancelData.cancellationReason,
          refundStatus: refundStatusValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to cancel travel: ${response.status} - ${
            errorData.message || errorData.error || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async updateRefundStatus(travelId, refundStatus) {
    try {
      const token = await this.getAuthToken();

      let refundStatusValue = refundStatus;
      if (refundStatusValue === "not_started") {
        refundStatusValue = "notStarted";
      } else if (refundStatusValue === "in_progress") {
        refundStatusValue = "inProgress";
      } else if (refundStatusValue === "not_required") {
        refundStatusValue = "notRequired";
      }

      const response = await fetch(`${API_BASE_URL}/admin/travels/${travelId}/refund-status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          refundStatus: refundStatusValue,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to update refund status: ${response.status} - ${
            errorData.message || errorData.error || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async updateTravel(travelId, travelData) {
    try {
      const token = await this.getAuthToken();

      const requestBody = {};

      if (travelData.student && typeof travelData.student === "object") {
        requestBody.student = {};
        const studentKeys = [
          "fullName",
          "nationality",
          "residenceCountryCode",
          "phoneNumber",
          "skillLevel",
          "gender",
          "birthDate",
          "emergencyContact",
        ];
        studentKeys.forEach((key) => {
          if (travelData.student[key] !== undefined) {
            if (key === "emergencyContact" && travelData.student.emergencyContact != null) {
              requestBody.student.emergencyContact = {
                ...(travelData.student.emergencyContact.fullName !== undefined && {
                  fullName: travelData.student.emergencyContact.fullName,
                }),
                ...(travelData.student.emergencyContact.phoneNumber !== undefined && {
                  phoneNumber: travelData.student.emergencyContact.phoneNumber,
                }),
                ...(travelData.student.emergencyContact.relationship !== undefined && {
                  relationship: travelData.student.emergencyContact.relationship,
                }),
              };
            } else {
              requestBody.student[key] = travelData.student[key];
            }
          }
        });
        if (Object.keys(requestBody.student).length === 0) delete requestBody.student;
      }

      if (travelData.courseId) {
        requestBody.courseId = travelData.courseId;
      }

      if (travelData.selectedStartDate) {
        requestBody.selectedStartDate = travelData.selectedStartDate;
      }

      if (travelData.duration !== undefined) {
        requestBody.duration = parseInt(travelData.duration) || travelData.duration;
      }

      if (travelData.accommodationBooking === null) {
        requestBody.accommodationBooking = null;
      } else if (
        travelData.accommodationBooking &&
        typeof travelData.accommodationBooking === "object"
      ) {
        requestBody.accommodationBooking = {};
        if (travelData.accommodationBooking.accommodationId !== undefined) {
          requestBody.accommodationBooking.accommodationId =
            travelData.accommodationBooking.accommodationId;
        }
        if (travelData.accommodationBooking.startDate !== undefined) {
          requestBody.accommodationBooking.startDate = travelData.accommodationBooking.startDate;
        }
        if (travelData.accommodationBooking.duration !== undefined) {
          requestBody.accommodationBooking.duration =
            parseInt(travelData.accommodationBooking.duration) ||
            travelData.accommodationBooking.duration;
        }
        if (Object.keys(requestBody.accommodationBooking).length === 0)
          delete requestBody.accommodationBooking;
      }

      if (travelData.courseServiceIds !== undefined) {
        requestBody.courseServiceIds = Array.isArray(travelData.courseServiceIds)
          ? travelData.courseServiceIds
          : [];
      }

      if (travelData.priceDifferenceStatus) {
        requestBody.priceDifferenceStatus = travelData.priceDifferenceStatus;
      }

      const response = await fetch(`${API_BASE_URL}/admin/travels/${travelId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to update travel: ${response.status} - ${
            errorData.message || errorData.error || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async calculateTravelPrice(travelId, priceData) {
    try {
      const token = await this.getAuthToken();

      const requestBody = {};

      if (priceData.courseId) {
        requestBody.courseId = priceData.courseId;
      }

      if (priceData.selectedStartDate) {
        requestBody.selectedStartDate = priceData.selectedStartDate;
      }

      if (priceData.duration !== undefined) {
        requestBody.duration = parseInt(priceData.duration) || priceData.duration;
      }

      if (priceData.accommodationBooking) {
        requestBody.accommodationBooking = {
          accommodationId: priceData.accommodationBooking.accommodationId,
          startDate: priceData.accommodationBooking.startDate,
          duration:
            parseInt(priceData.accommodationBooking.duration) ||
            priceData.accommodationBooking.duration,
        };
      }

      if (priceData.courseServiceIds && Array.isArray(priceData.courseServiceIds)) {
        requestBody.courseServiceIds = priceData.courseServiceIds;
      }

      const response = await fetch(`${API_BASE_URL}/admin/travels/${travelId}/calculate-price`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const err = new Error(
          `Failed to calculate price: ${response.status} - ${
            errorData.message || errorData.error || "Unknown error"
          }`
        );
        if (errorData.invalidIds && Array.isArray(errorData.invalidIds)) {
          err.invalidIds = errorData.invalidIds;
        }
        throw err;
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}
