export const buildAccommodationSearchRequest = (filters = {}) => {
  const requestBody = {
    search: filters.search || "",
    page: filters.page || 1,
    limit: filters.limit || 100,
    sortBy: filters.sortBy || "name",
    sortDirection: filters.sortDirection || "asc",
    filter: {},
  };

  if (filters.countryIds && filters.countryIds.length > 0) {
    requestBody.filter.countryIds = filters.countryIds;
  }
  if (filters.cityIds && filters.cityIds.length > 0) {
    requestBody.filter.cityIds = filters.cityIds;
  }
  if (filters.campusIds && filters.campusIds.length > 0) {
    requestBody.filter.campusIds = filters.campusIds;
  }
  if (filters.types && filters.types.length > 0) {
    requestBody.filter.types = filters.types;
  }
  if (filters.categories && filters.categories.length > 0) {
    requestBody.filter.categories = filters.categories;
  }
  if (filters.regimeTypes && filters.regimeTypes.length > 0) {
    requestBody.filter.regimeTypes = filters.regimeTypes;
  }
  if (
    filters.priceFilter &&
    typeof filters.priceFilter === "object" &&
    filters.priceFilter.durationWeeks &&
    filters.priceFilter.minPrice !== undefined &&
    filters.priceFilter.maxPrice !== undefined
  ) {
    requestBody.filter.priceFilter = filters.priceFilter;
  }

  return requestBody;
};
