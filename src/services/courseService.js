import { API_BASE_URL } from "../config/api";

import { buildCourseSearchRequest } from "../utils/courseFilterUtils";
import { formatDateForAPI } from "../utils/dateUtils";

export class CourseService {
  static addCreatedCourse(courseId) {
    if (!this.createdCourses) {
      this.createdCourses = [];
    }
    this.createdCourses.push(courseId);
  }

  static getCourseCache() {
    if (!this.courseCache) {
      this.courseCache = new Map();
    }
    return this.courseCache;
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

  static async getCourseById(id) {
    const cache = this.getCourseCache();
    if (cache.has(id)) {
      return cache.get(id);
    }

    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/courses/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch course: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      const course = await response.json();
      cache.set(id, course);
      return course;
    } catch (error) {
      console.error(`Error fetching course ${id}:`, error);
      return null;
    }
  }

  static async getCoursesByIds(courseIds) {
    const uniqueIds = [...new Set(courseIds)];
    const results = {};

    await Promise.all(
      uniqueIds.map(async (id) => {
        const course = await this.getCourseById(id);
        if (course) {
          results[id] = course;
        }
      })
    );

    return results;
  }

  static async getServicesByIds(serviceIds) {
    if (!serviceIds || serviceIds.length === 0) {
      return [];
    }

    try {
      const { ServiceService } = await import("./serviceService");
      const allServices = await ServiceService.getAllServices();

      return allServices.filter((service) => serviceIds.includes(service.id));
    } catch (error) {
      console.error("Error fetching services by IDs:", error);
      return [];
    }
  }

  static mapPricePeriod(period) {
    if (!period) return "week";

    const periodMap = {
      course: "week",
      week: "week",
      month: "month",
      semester: "semester",
      year: "year",
    };

    return periodMap[period.toLowerCase()] || "week";
  }

  static mapPeriodicity(periodicityOptions) {
    if (!periodicityOptions || periodicityOptions.length === 0) {
      return "fullTime";
    }

    if (periodicityOptions.includes("full-time")) {
      return "fullTime";
    }

    if (periodicityOptions.includes("morning")) {
      return "morning";
    }
    if (periodicityOptions.includes("afternoon")) {
      return "afternoon";
    }
    if (periodicityOptions.includes("evening")) {
      return "evening";
    }

    return "fullTime";
  }

  static formatTypes(courseData) {
    return (courseData.courseTypes || [])
      .filter((ct) => ct.type && ct.programTypes && ct.programTypes.length > 0)
      .map((ct) => ({
        name: ct.type === "sport" ? "sport" : "tech",
        programTypes: ct.programTypes.map((name) => ({ name })),
      }));
  }

  static invalidateCourseCache(id) {
    if (!id) return;
    this.getCourseCache().delete(id);
  }

  static buildCourseApiPayload(courseData) {
    const periodicityOptions = (() => {
      if (Array.isArray(courseData.periodicityOptions) && courseData.periodicityOptions.length > 0) {
        return courseData.periodicityOptions;
      }
      if (courseData.periodicity) {
        const value = String(courseData.periodicity);
        return [value === "fullTime" ? "full-time" : value];
      }
      return [];
    })();
    const periodicity = this.mapPeriodicity(periodicityOptions);
    const firstStartDate = this.resolveFirstStartDate(courseData);
    const startMode = (() => {
      if (courseData.startDates === "Pattern") return "pattern";
      if (courseData.startDates === "Manually") return "manually";
      if (courseData.startMode === "pattern" || courseData.startMode === "manually") {
        return courseData.startMode;
      }
      return "manually";
    })();

    const apiData = {
      campusId: courseData.campusId,
      types: this.formatTypes(courseData),
      name: courseData.name,
      startMode,
      periodicity,
      durationUnit: this.resolveDurationUnit(courseData),
      durationType: this.resolveDurationType(courseData),
      durationCount: this.getDurationCount(courseData),
      minAge: courseData.minAge ? parseInt(courseData.minAge, 10) : 18,
      description: courseData.description || "",
      startTime: this.getStartTime(courseData),
      endTime: this.getEndTime(courseData),
      bestSeller: courseData.bestSeller || false,
      isFeatured: courseData.isFeatured || false,
      isActive: courseData.isActive !== undefined ? courseData.isActive : true,
      startPatterns: this.formatStartPatterns(courseData),
      startManuals: this.formatStartManuals(courseData),
      downloadDocuments: this.formatDownloadDocuments(courseData),
      averageRating:
        courseData.averageRating !== "" && courseData.averageRating != null
          ? parseFloat(courseData.averageRating)
          : undefined,
      recommendedLevel: courseData.recommendedLevel || undefined,
      classSize: courseData.classSize || undefined,
      recommendedFor: courseData.recommendedFor || undefined,
      notRecommendedFor: courseData.notRecommendedFor || undefined,
      workload: this.getDurationCount(courseData) || undefined,
      equipment: courseData.equipment || "",
      certificate: courseData.certificate || "",
      courseHighlights:
        courseData.courseHighlights?.filter((h) => h.text?.trim()).map((h) => ({ text: h.text })) ||
        undefined,
    };

    if (firstStartDate) {
      apiData.firstStartDate = firstStartDate;
    }

    return apiData;
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

  static async getCourseById(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/courses/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch course: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  static async getCoursesByCampusId(campusId) {
    try {
      const token = await this.getAuthToken();

      const requestBody = buildCourseSearchRequest({
        campusIds: [campusId],
        limit: 1000,
      });

      const response = await fetch(`${API_BASE_URL}/admin/courses/search`, {
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
          `Failed to fetch courses: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error("Error fetching courses by campus ID:", error);
      return [];
    }
  }

  static async getAllCourses(filters = {}) {
    try {
      const token = await this.getAuthToken();
      const requestBody = buildCourseSearchRequest(filters);

      const response = await fetch(`${API_BASE_URL}/admin/courses/search`, {
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
          `Failed to fetch courses: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching all courses:", error);
      return { data: [], meta: { totalItems: 0, currentPage: 1, totalPages: 0 } };
    }
  }

  static async createCourse(courseData) {
    try {
      const token = await this.getAuthToken();
      const apiData = this.buildCourseApiPayload(courseData);

      const response = await fetch(`${API_BASE_URL}/admin/courses`, {
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
          `Failed to create course: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      const result = await response.json();
      this.addCreatedCourse(result.id);
      this.invalidateCourseCache(result.id);

      return result;
    } catch (error) {
      throw error;
    }
  }

  static formatSimplePrices(courseData) {
    if (courseData.priceType !== "Simple") {
      return [];
    }

    if (courseData.simplePriceEntries?.length > 0) {
      return courseData.simplePriceEntries.map((entry) => ({
        price: parseFloat(entry.price) || 0,
        period: this.mapPricePeriod(entry.per),
      }));
    }

    if (courseData.price && courseData.pricePer) {
      return [
        {
          price: parseFloat(courseData.price) || 0,
          period: this.mapPricePeriod(courseData.pricePer),
        },
      ];
    }

    return [];
  }

  static formatFlexibleDurationPrices(courseData) {
    if (courseData.priceType !== "Flexible Duration") {
      return [];
    }

    if (courseData.flexibleDurationEntries?.length > 0) {
      return courseData.flexibleDurationEntries.map((entry) => ({
        minWeeks: parseInt(entry.rangeStart) || 0,
        maxWeeks: parseInt(entry.rangeEnd) || 0,
        pricePerWeek: parseFloat(entry.price) || 0,
      }));
    }

    if (courseData.rangeStart && courseData.rangeEnd && courseData.flexiblePrice) {
      return [
        {
          minWeeks: parseInt(courseData.rangeStart) || 0,
          maxWeeks: parseInt(courseData.rangeEnd) || 0,
          pricePerWeek: parseFloat(courseData.flexiblePrice) || 0,
        },
      ];
    }

    return [];
  }

  static formatFixedDurationPrices(courseData) {
    if (courseData.priceType !== "Fixed Duration") {
      return [];
    }

    if (courseData.fixedDuration?.length > 0) {
      return courseData.fixedDuration.map((entry) => ({
        durationWeeks: parseInt(entry.duration) || 0,
        totalPrice: parseFloat(entry.totalPrice || entry.price) || 0,
      }));
    }

    return [];
  }

  static formatFees(courseData) {
    if (!courseData.fees?.length) {
      return [];
    }

    return courseData.fees
      .filter((fee) => !fee.serviceId)
      .map((fee) => ({
        name: fee.name || fee.label || "Fee",
        value: parseFloat(fee.amount || fee.value || fee.price) || 0,
      }));
  }

  static formatStartPatterns(courseData) {
    if (courseData.startDates !== "Pattern") {
      return [];
    }

    const patterns = [];

    if (courseData.startDatesPattern === "days-of-week" && courseData.selectedDaysOfWeek?.length) {
      patterns.push({
        patternType: "weekDay",
        repeatEvery: parseInt(courseData.repeatEveryWeeks) || 1,
        weekDays: courseData.selectedDaysOfWeek.map((day) => ({
          weekDay: this.mapWeekDay(day),
        })),
        monthDays: [],
      });
    }

    return patterns;
  }

  static mapWeekDay(day) {
    const dayMap = {
      mon: "monday",
      tue: "tuesday",
      wed: "wednesday",
      thu: "thursday",
      fri: "friday",
      sat: "saturday",
      sun: "sunday",
    };
    return dayMap[day.toLowerCase()] || "monday";
  }

  static mapDurationType(durationType) {
    const durationMap = {
      "per-week": "perWeek",
      "per-month": "perMonth",
      "per-day": "perDay",
      "per-semester": "perSemester",
      "per-year": "perYear",
    };
    return durationMap[durationType] || "perWeek";
  }

  static resolveDurationUnit(courseData) {
    const allowedUnits = new Set(["hours", "lessons"]);

    if (allowedUnits.has(courseData?.durationUnit)) {
      return courseData.durationUnit;
    }

    if (allowedUnits.has(courseData?.durationType)) {
      return courseData.durationType;
    }

    return "hours";
  }

  static resolveDurationType(courseData) {
    const allowedTypes = new Set(["perWeek", "perMonth", "perDay", "perSemester", "perYear"]);

    if (allowedTypes.has(courseData?.durationType)) {
      return courseData.durationType;
    }

    if (courseData?.durationPeriod) {
      return this.mapDurationType(courseData.durationPeriod);
    }

    return "perWeek";
  }

  static resolveFirstStartDate(courseData) {
    if (courseData.startDates === "Pattern" && courseData.coursePatternStartDate) {
      return formatDateForAPI(courseData.coursePatternStartDate);
    }

    if (courseData.startDates === "Manually" && courseData.manualDates?.length > 0) {
      return formatDateForAPI(courseData.manualDates[0]);
    }

    if (courseData.firstStartDate) {
      return formatDateForAPI(courseData.firstStartDate) || courseData.firstStartDate;
    }

    return null;
  }

  static getDurationCount(courseData) {
    if (courseData.durationEntries?.length > 0) {
      return parseInt(courseData.durationEntries[0].duration) || 0;
    }

    return parseInt(courseData.duration) || 0;
  }

  static formatStartManuals(courseData) {
    if (courseData.startDates !== "Manually" || !courseData.manualDates?.length) {
      return [];
    }

    return courseData.manualDates
      .map((date) => ({
        startDate: formatDateForAPI(date),
      }))
      .filter((item) => item.startDate !== null);
  }

  static formatDownloadDocuments(courseData) {
    return [{ type: "schoolLetter" }];
  }

  static getStartTime(courseData) {
    if (courseData.startDates === "Pattern" && courseData.scheduleEntries?.length > 0) {
      const timeString = courseData.scheduleEntries[0].startTime;

      if (timeString) {
        const time = this.parseTimeString(timeString);

        const timeInUTC = `1970-01-01T${time.hours.toString().padStart(2, "0")}:${time.minutes
          .toString()
          .padStart(2, "0")}:00.000Z`;

        return timeInUTC;
      }
    }
    const defaultTime = "1970-01-01T09:00:00.000Z";
    return defaultTime;
  }

  static getEndTime(courseData) {
    if (courseData.startDates === "Pattern" && courseData.scheduleEntries?.length > 0) {
      const timeString = courseData.scheduleEntries[0].endTime;

      if (timeString) {
        const time = this.parseTimeString(timeString);

        const timeInUTC = `1970-01-01T${time.hours.toString().padStart(2, "0")}:${time.minutes
          .toString()
          .padStart(2, "0")}:00.000Z`;

        return timeInUTC;
      }
    }
    const defaultTime = "1970-01-01T17:00:00.000Z";
    return defaultTime;
  }

  static parseTimeString(timeString) {
    if (timeString.includes("AM") || timeString.includes("PM")) {
      const [time, period] = timeString.split(" ");
      const [hours, minutes] = time.split(":").map(Number);
      let adjustedHours = hours;

      if (period === "PM" && hours !== 12) {
        adjustedHours = hours + 12;
      } else if (period === "AM" && hours === 12) {
        adjustedHours = 0;
      }

      return { hours: adjustedHours, minutes };
    } else {
      const [hours, minutes] = timeString.split(":").map(Number);
      return { hours, minutes };
    }
  }

  static async updateCourse(id, courseData) {
    try {
      const token = await this.getAuthToken();
      const apiData = this.buildCourseApiPayload(courseData);

      const response = await fetch(`${API_BASE_URL}/admin/courses/${id}`, {
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
          `Failed to update course: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      const updatedCourse = await response.json();
      this.invalidateCourseCache(id);
      return updatedCourse;
    } catch (error) {
      throw error;
    }
  }

  static async deleteCourse(id) {
    try {
      const token = await this.getAuthToken();

      const response = await fetch(`${API_BASE_URL}/admin/courses/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to delete course: ${response.status} - ${errorData.message || "Unknown error"}`
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  static buildCourseUpdatePayloadFromApi(course, overrides = {}) {
    const payload = {
      campusId: course.campusId,
      name: course.name,
      types: course.types,
      startMode: course.startMode,
      periodicity: course.periodicity,
      durationUnit: course.durationUnit,
      durationType: course.durationType,
      durationCount: course.durationCount,
      minAge: course.minAge,
      description: course.description || "",
      startTime: course.startTime,
      endTime: course.endTime,
      bestSeller: course.bestSeller ?? false,
      isFeatured: course.isFeatured ?? false,
      isActive: course.isActive !== undefined ? course.isActive : true,
      startPatterns: course.startPatterns || [],
      startManuals: course.startManuals || [],
      downloadDocuments: (course.downloadDocuments || []).map((d) => ({ type: d.type })),
      recommendedLevel: course.recommendedLevel,
      workload: course.workload,
      equipment: course.equipment,
      certificate: course.certificate,
      ...overrides,
    };

    if (course.firstStartDate) {
      payload.firstStartDate = course.firstStartDate;
    }

    return payload;
  }

  static async deactivateCourse(id) {
    const course = await this.getCourseById(id);
    const token = await this.getAuthToken();
    const apiData = this.buildCourseUpdatePayloadFromApi(course, { isActive: false });

    const response = await fetch(`${API_BASE_URL}/admin/courses/${id}`, {
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
        `Failed to deactivate course: ${response.status} - ${errorData.message || "Unknown error"}`
      );
    }

    this.invalidateCourseCache(id);
    return response.json();
  }

  static async rollbackCreatedCourse(id) {
    try {
      await this.deleteCourse(id);
    } catch {
      await this.deactivateCourse(id);
    }
  }
  static normalizeCourseServiceForCreate(service) {
    const serviceId = service.serviceId || service.service?.id;
    if (!serviceId) return null;

    if (Array.isArray(service.durationPrices) && service.durationPrices.length > 0) {
      return {
        serviceId,
        isMandatory: Boolean(service.isMandatory),
        durationPrices: service.durationPrices,
      };
    }

    if (Array.isArray(service.pricingTiers) && service.pricingTiers.length > 0) {
      const durationPrices = service.pricingTiers
        .filter((tier) => tier.minWeeks && tier.maxWeeks)
        .map((tier) => ({
          minWeeks: parseInt(tier.minWeeks, 10) || 1,
          maxWeeks: parseInt(tier.maxWeeks, 10) || 1,
          price: parseFloat(tier.amount) || 0,
          mode: tier.priceType === "fixed" ? "FIXED" : "PER_WEEK",
        }));
      if (durationPrices.length) {
        return {
          serviceId,
          isMandatory: Boolean(service.isMandatory),
          durationPrices,
        };
      }
    }

    const price = parseFloat(service.price) || 0;
    const period = service.period || null;
    return {
      serviceId,
      isMandatory: Boolean(service.isMandatory),
      durationPrices: [
        {
          minWeeks: 1,
          maxWeeks: 4,
          price,
          mode: period === "week" ? "PER_WEEK" : "FIXED",
        },
      ],
    };
  }

  static async createCourseServices(courseId, services) {
    const { ServiceService } = await import("./serviceService");
    const payload = services
      .map((service) => this.normalizeCourseServiceForCreate(service))
      .filter(Boolean);
    if (!payload.length) return null;
    return ServiceService.createCourseServicesForCourse(courseId, payload);
  }

  static async updateCourseServices(courseId, items) {
    try {
      const token = await this.getAuthToken();

      const courseResponse = await fetch(`${API_BASE_URL}/admin/courses/${courseId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!courseResponse.ok) {
        throw new Error(`Failed to fetch course ${courseId}`);
      }

      const courseData = await courseResponse.json();

      const updatedServices = (courseData.services || []).map((existingService) => {
        const updateItem = items.find(
          (item) =>
            item.courseServiceId === existingService.id ||
            item.id === existingService.id ||
            (item.service?.id || item.serviceId) ===
              (existingService.service?.id || existingService.serviceId)
        );

        if (updateItem) {
          const durationPrices = updateItem.durationPrices;
          let price = parseFloat(updateItem.price) || 0;
          let period = updateItem.period || null;

          if (durationPrices && durationPrices.length > 0) {
            price = parseFloat(durationPrices[0].price) || 0;
            period = durationPrices[0].mode === "PER_WEEK" ? "week" : null;
          }

          return {
            serviceId: existingService.service?.id || existingService.serviceId,
            isMandatory: updateItem.isMandatory || false,
            price: price,
            period: period,
          };
        }

        return {
          serviceId: existingService.service?.id || existingService.serviceId,
          isMandatory: existingService.isMandatory || false,
          price: parseFloat(existingService.price) || 0,
          period: existingService.period || null,
        };
      });

      const updateResponse = await fetch(`${API_BASE_URL}/admin/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campusId: courseData.campusId,
          name: courseData.name,
          types: courseData.types,
          startMode: courseData.startMode,
          periodicity: courseData.periodicity,
          durationUnit: courseData.durationUnit,
          durationType: courseData.durationType,
          durationCount: courseData.durationCount,
          minAge: courseData.minAge,
          description: courseData.description || "",
          startTime: courseData.startTime,
          endTime: courseData.endTime,
          firstStartDate: courseData.firstStartDate,
          bestSeller: courseData.bestSeller,
          isFeatured: courseData.isFeatured,
          startPatterns: courseData.startPatterns || [],
          startManuals: courseData.startManuals || [],
          downloadDocuments: (courseData.downloadDocuments || []).map((d) => ({ type: d.type })),
          services: updatedServices,
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new Error(
          `Failed to update course services: ${updateResponse.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      return await updateResponse.json();
    } catch (error) {
      throw error;
    }
  }

  static async deleteCourseServices(courseId, ids) {
    try {
      const token = await this.getAuthToken();

      const courseResponse = await fetch(`${API_BASE_URL}/admin/courses/${courseId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!courseResponse.ok) {
        throw new Error(`Failed to fetch course ${courseId}`);
      }

      const courseData = await courseResponse.json();

      const remainingServices = (courseData.services || [])
        .filter((s) => !ids.includes(s.id))
        .map((s) => ({
          serviceId: s.service?.id || s.serviceId,
          isMandatory: s.isMandatory || false,
          price: parseFloat(s.price) || 0,
          period: s.period || "week",
        }));

      const updateResponse = await fetch(`${API_BASE_URL}/admin/courses/${courseId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          campusId: courseData.campusId,
          name: courseData.name,
          types: courseData.types,
          startMode: courseData.startMode,
          periodicity: courseData.periodicity,
          durationUnit: courseData.durationUnit,
          durationType: courseData.durationType,
          durationCount: courseData.durationCount,
          minAge: courseData.minAge,
          description: courseData.description || "",
          startTime: courseData.startTime,
          endTime: courseData.endTime,
          firstStartDate: courseData.firstStartDate,
          bestSeller: courseData.bestSeller,
          isFeatured: courseData.isFeatured,
          startPatterns: courseData.startPatterns || [],
          startManuals: courseData.startManuals || [],
          downloadDocuments: (courseData.downloadDocuments || []).map((d) => ({ type: d.type })),
          services: remainingServices,
        }),
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => ({}));
        throw new Error(
          `Failed to delete course services: ${updateResponse.status} - ${
            errorData.message || "Unknown error"
          }`
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  static addCreatedCourse(courseId) {
    if (!this.createdCourses) {
      this.createdCourses = [];
    }
    this.createdCourses.push(courseId);
  }
}
