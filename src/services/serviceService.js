import { API_BASE_URL } from "../config/api";

const SERVICE_DETAIL_FIELDS = [
  "coverImageUrl",
  "highlight",
  "includedItems",
  "complementaryInfo",
  "warningNote",
];

const SERVICE_UPDATE_FIELDS = [
  "type",
  "name",
  "isActive",
  "currency",
  "description",
  ...SERVICE_DETAIL_FIELDS,
];

export function buildServiceUpdatePayload(serviceData = {}) {
  const payload = {};
  SERVICE_UPDATE_FIELDS.forEach((field) => {
    if (serviceData[field] !== undefined) {
      payload[field] = field === "isActive" ? Boolean(serviceData[field]) : serviceData[field];
    }
  });
  return payload;
}

export class ServiceService {
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

  static async getAllServices() {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/services`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch services: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      const services = await response.json();
      return services;
    } catch (error) {
      console.error("Error fetching services:", error);
      return [];
    }
  }

  static async getServiceById(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/services/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch service: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async getServiceWithCourseServices(id) {
    try {
      const token = await this.getAuthToken();

      const serviceResponse = await fetch(`${API_BASE_URL}/admin/services/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!serviceResponse.ok) {
        const errorData = await serviceResponse.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch service: ${serviceResponse.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      const serviceData = await serviceResponse.json();
      const oldCourseServices = serviceData.courseServices || [];

      const courseServicesUrl = `${API_BASE_URL}/admin/courses/services/${id}`;
      console.log("Fetching course-services from:", courseServicesUrl);

      const courseServicesResponse = await fetch(courseServicesUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Course-services response status:", courseServicesResponse.status);

      if (courseServicesResponse.ok) {
        const newCourseServices = await courseServicesResponse.json();

        const mergedCourseServices = newCourseServices.map((newCs) => {
          const oldCs = oldCourseServices.find((old) => old.id === newCs.id);
          return {
            ...newCs,
            courseId: oldCs?.courseId || newCs.courseId,
          };
        });

        serviceData.courseServices = mergedCourseServices;
      } else {
        console.log("Course-services endpoint failed, using service.courseServices");
      }

      return serviceData;
    } catch (error) {
      throw error;
    }
  }

  static async createService(serviceData) {
    try {
      const token = await this.getAuthToken();

      const apiData = {
        type: serviceData.type || "other",
        name: serviceData.name || serviceData.type || "Extra",
        isActive: serviceData.isActive !== undefined ? Boolean(serviceData.isActive) : true,
        currency: serviceData.currency || "EUR",
        description: serviceData.description || "",
      };
      SERVICE_DETAIL_FIELDS.forEach((field) => {
        if (serviceData[field] !== undefined) apiData[field] = serviceData[field];
      });

      const response = await fetch(`${API_BASE_URL}/admin/services`, {
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
          `Failed to create service: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async updateService(id, serviceData) {
    try {
      const token = await this.getAuthToken();

      // PATCH is partial: send only the fields the caller gave, so toggling the
      // status does not reset the other fields to defaults.
      const apiData = buildServiceUpdatePayload(serviceData);

      const response = await fetch(`${API_BASE_URL}/admin/services/${id}`, {
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
          `Failed to update service: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async createCourseServices(courseId, services) {
    return this.createCourseServicesForCourse(courseId, services);
  }

  static async deleteCourseServices(courseId, ids) {
    for (const courseServiceId of ids) {
      await this.deleteCourseService(courseId, courseServiceId);
    }
    return true;
  }

  static async deleteService(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/services/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to delete service: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async searchServices(searchParams = {}) {
    try {
      const token = await this.getAuthToken();

      const requestBody = {
        search: searchParams.search || "",
        page: searchParams.page || 1,
        limit: searchParams.limit || 10,
        sortBy: searchParams.sortBy || "name",
        sortDirection: searchParams.sortDirection || "asc",
        filters: searchParams.filters || {},
      };

      const response = await fetch(`${API_BASE_URL}/admin/services/search`, {
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
          `Failed to search services: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error searching services:", error);
      return { data: [], meta: { currentPage: 1, totalPages: 1, totalItems: 0 } };
    }
  }

  static async createCourseServicesBulk(items) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/courses/services/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to create course services: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async updateCourseServicesBulk(items) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/courses/services/bulk`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ items }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to update course services: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async createCourseServicesForCourse(courseId, services) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/courses/${courseId}/services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ services }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to create course services: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async deleteCourseService(courseId, courseServiceId) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/courses/${courseId}/services`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids: [courseServiceId] }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to delete course service: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  static async getCourseServicesByServiceId(serviceId) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/courses/services/${serviceId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch course services: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async addServiceToCountryCourses(countryId, serviceData) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/countries/${countryId}/course-services`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(serviceData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to add service to country courses: ${response.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}
