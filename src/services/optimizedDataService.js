import { SchoolService } from "./schoolService";
import { CampusService } from "./campusService";
import { CourseService } from "./courseService";
import { dataCache } from "../utils/dataCache";
import { API_BASE_URL } from "../config/api";
import { buildCourseSearchRequest } from "../utils/courseFilterUtils";

export const OptimizedDataService = {
  async getSchools(searchQuery = "") {
    const cacheKey = `schools_${searchQuery}`;

    if (dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey);
    }

    try {
      const response = await SchoolService.getSchools({
        search: searchQuery,
        limit: 20,
      });
      let schools = [];

      if (Array.isArray(response)) {
        schools = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        schools = response.data;
      } else if (response && response.schools && Array.isArray(response.schools)) {
        schools = response.schools;
      } else {
        console.error("Unexpected schools response format:", response);
        return [];
      }

      const schoolsOptions = schools.map((school) => ({
        value: school.id,
        label: school.name,
      }));

      dataCache.set(cacheKey, schoolsOptions);
      return schoolsOptions;
    } catch (error) {
      console.error("Error loading schools:", error);
      return [];
    }
  },

  async getCampusesForSchools(schoolIds) {
    if (!schoolIds || schoolIds.length === 0) {
      return [];
    }

    const cacheKey = `campuses_${schoolIds.sort().join("_")}`;

    if (dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey);
    }

    try {
      const token = await CampusService.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/admin/campuses/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          search: "",
          page: 1,
          limit: 20,
          sortBy: "name",
          sortDirection: "asc",
          filters: {
            schoolIds: schoolIds,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch campuses: ${response.status}`);
      }

      const result = await response.json();
      const allCampuses = result.data || [];

      const campusesOptions = allCampuses.map((campus) => ({
        value: campus.id,
        label: campus.name,
        schoolId: campus.schoolId,
        cityId: campus.cityId || campus.city?.id || "",
      }));

      dataCache.set(cacheKey, campusesOptions);
      return campusesOptions;
    } catch (error) {
      console.error("Error loading campuses:", error);
      return [];
    }
  },

  async getSchoolsForCity(cityId) {
    if (!cityId) return [];

    const cacheKey = `schools_city_${cityId}`;
    if (dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey);
    }

    try {
      const token = await CampusService.getAuthToken();
      const response = await fetch(`${API_BASE_URL}/admin/campuses/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          search: "",
          page: 1,
          limit: 500,
          sortBy: "name",
          sortDirection: "asc",
          filters: {
            cityIds: [cityId],
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch campuses for city: ${response.status}`);
      }

      const campuses = (await response.json()).data || [];
      const schoolIds = [...new Set(campuses.map((campus) => campus.schoolId).filter(Boolean))];

      if (!schoolIds.length) {
        dataCache.set(cacheKey, []);
        return [];
      }

      const schoolsToken = await SchoolService.getAuthToken();
      const schoolsResponse = await fetch(`${API_BASE_URL}/admin/schools/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${schoolsToken}`,
        },
        body: JSON.stringify({
          search: "",
          page: 1,
          limit: 500,
          sortBy: "name",
          sortDirection: "asc",
        }),
      });

      if (!schoolsResponse.ok) {
        throw new Error(`Failed to fetch schools for city: ${schoolsResponse.status}`);
      }

      const schools = (await schoolsResponse.json()).data || [];
      const schoolsOptions = schools
        .filter((school) => schoolIds.includes(school.id))
        .map((school) => ({
          value: school.id,
          label: school.name,
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      dataCache.set(cacheKey, schoolsOptions);
      return schoolsOptions;
    } catch (error) {
      console.error("Error loading schools for city:", error);
      return [];
    }
  },

  async getCoursesForCampuses(campusIds) {
    if (!campusIds || campusIds.length === 0) {
      return [];
    }

    const cacheKey = `courses_${campusIds.sort().join("_")}`;

    if (dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey);
    }

    try {
      const coursePromises = campusIds.map((campusId) =>
        CourseService.getCoursesByCampusId(campusId)
      );
      const coursesResults = await Promise.all(coursePromises);

      const allCourses = coursesResults.flat();
      const uniqueCourses = allCourses.filter(
        (course, index, self) => index === self.findIndex((c) => c.id === course.id)
      );

      const coursesOptions = uniqueCourses.map((course) => ({
        value: course.id,
        label: course.name,
        campusId: course.campusId,
        periodicity: course.periodicity,
      }));

      dataCache.set(cacheKey, coursesOptions);
      return coursesOptions;
    } catch (error) {
      console.error("Error loading courses:", error);
      return [];
    }
  },

  async getRelatedDataForCourses(courseIds) {
    if (!courseIds || courseIds.length === 0) {
      return { schools: [], campuses: [], courses: [] };
    }

    const cacheKey = `related_${courseIds.sort().join("_")}`;

    if (dataCache.has(cacheKey)) {
      return dataCache.get(cacheKey);
    }

    try {
      const token = await CourseService.getAuthToken();
      const courseSearchRequest = buildCourseSearchRequest({
        courseIds: courseIds,
        limit: Math.max(20, courseIds.length),
      });

      const coursesResponse = await fetch(`${API_BASE_URL}/admin/courses/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(courseSearchRequest),
      });

      if (!coursesResponse.ok) {
        throw new Error(`Failed to fetch courses: ${coursesResponse.status}`);
      }

      const coursesData = await coursesResponse.json();
      const courses = coursesData.data || [];

      const campusIds = [...new Set(courses.map((course) => course.campusId).filter(Boolean))];

      const campusesToken = await CampusService.getAuthToken();
      const RELATED_RESOLVE_LIMIT = 500;
      const campusesResponse = await fetch(`${API_BASE_URL}/admin/campuses/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${campusesToken}`,
        },
        body: JSON.stringify({
          search: "",
          page: 1,
          limit: RELATED_RESOLVE_LIMIT,
          sortBy: "name",
          sortDirection: "asc",
          filters: {},
        }),
      });

      if (!campusesResponse.ok) {
        throw new Error(`Failed to fetch campuses: ${campusesResponse.status}`);
      }

      const campusesData = await campusesResponse.json();
      const allCampuses = campusesData.data || [];
      const campuses = allCampuses.filter((campus) => campusIds.includes(campus.id));

      const uniqueSchoolIds = [
        ...new Set(campuses.map((campus) => campus.schoolId).filter(Boolean)),
      ];

      const schoolsToken = await SchoolService.getAuthToken();
      const schoolsResponse = await fetch(`${API_BASE_URL}/admin/schools/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${schoolsToken}`,
        },
        body: JSON.stringify({
          search: "",
          page: 1,
          limit: RELATED_RESOLVE_LIMIT,
          sortBy: "name",
          sortDirection: "asc",
        }),
      });

      if (!schoolsResponse.ok) {
        throw new Error(`Failed to fetch schools: ${schoolsResponse.status}`);
      }

      const schoolsData = await schoolsResponse.json();
      const allSchools = schoolsData.data || [];
      const schools = allSchools.filter((school) => uniqueSchoolIds.includes(school.id));

      const result = {
        schools: schools.map((school) => ({
          value: school.id,
          label: school.name,
          countryId: school.countryId,
        })),
        campuses: campuses.map((campus) => ({
          value: campus.id,
          label: campus.name,
          schoolId: campus.schoolId,
        })),
        courses: courses.map((course) => ({
          value: course.id,
          label: course.name,
          campusId: course.campusId,
        })),
      };

      dataCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error("Error loading related data:", error);
      return { schools: [], campuses: [], courses: [] };
    }
  },

  clearCache() {
    dataCache.clear();
  },
};

export default OptimizedDataService;
