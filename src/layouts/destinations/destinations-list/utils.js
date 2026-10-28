const CITIES_PAGE_SIZE = 500;

/**
 * Loads every city in as few requests as possible: one page of 500 covers the
 * catalogue today, further pages are fetched only when the backend reports them.
 */
export async function fetchAllCities(searchCities) {
  const cities = [];
  let page = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    // eslint-disable-next-line no-await-in-loop
    const res = await searchCities({ page, limit: CITIES_PAGE_SIZE });
    const data = Array.isArray(res) ? res : res?.data || [];
    cities.push(...data);
    const hasNext = Boolean(res?.meta?.hasNextPage) && data.length > 0;
    if (!hasNext) break;
    page += 1;
  }
  return cities;
}

export function groupCitiesByCountry(cities) {
  return (cities || []).reduce((acc, city) => {
    const countryId = city.country?.id || city.countryId;
    if (!countryId) return acc;
    if (!acc[countryId]) acc[countryId] = [];
    acc[countryId].push(city);
    return acc;
  }, {});
}
