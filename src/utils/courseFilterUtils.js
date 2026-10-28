export const buildCourseSearchRequest = (filters = {}) => {
  const requestBody = {
    search: filters.search || "",
    page: filters.page || 1,
    limit: filters.limit || 100,
    sortBy: filters.sortBy || "name",
    sortDirection: filters.sortDirection || "asc",
  };

  requestBody.filters = {};

  if (filters.campusIds && filters.campusIds.length > 0) {
    requestBody.filters.campusIds = filters.campusIds;
  }

  if (filters.courseIds && filters.courseIds.length > 0) {
    requestBody.filters.courseIds = filters.courseIds;
  }

  if (filters.countryIds && filters.countryIds.length > 0) {
    requestBody.filters.countryIds = filters.countryIds;
  }

  if (filters.cityIds && filters.cityIds.length > 0) {
    requestBody.filters.cityIds = filters.cityIds;
  }

  if (filters.programTypes && filters.programTypes.length > 0) {
    requestBody.filters.programTypes = filters.programTypes;
  }

  if (filters.minPrice !== undefined && filters.minPrice !== null && filters.minPrice !== "") {
    requestBody.filters.minPrice = Number(filters.minPrice);
  }

  if (filters.maxPrice !== undefined && filters.maxPrice !== null && filters.maxPrice !== "") {
    requestBody.filters.maxPrice = Number(filters.maxPrice);
  }

  if (filters.bestSeller !== undefined && filters.bestSeller !== null) {
    requestBody.filters.bestSeller = Boolean(filters.bestSeller);
  }

  if (filters.startDateFrom) {
    requestBody.filters.startDateFrom = filters.startDateFrom;
  }

  if (filters.startDateTo) {
    requestBody.filters.startDateTo = filters.startDateTo;
  }

  if (filters.duration !== undefined && filters.duration !== null && filters.duration !== "") {
    requestBody.filters.duration = Number(filters.duration);
  }

  if (filters.minDuration !== undefined && filters.minDuration !== null && filters.minDuration !== "") {
    requestBody.filters.minDuration = Number(filters.minDuration);
  }

  if (filters.schoolIds && filters.schoolIds.length > 0) {
    requestBody.filters.schoolIds = filters.schoolIds;
  }

  if (filters.hasAccommodation !== undefined && filters.hasAccommodation !== null) {
    requestBody.filters.hasAccommodation = Boolean(filters.hasAccommodation);
  }

  return requestBody;
};
