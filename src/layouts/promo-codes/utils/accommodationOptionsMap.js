/** Map API accommodation rows to react-select options (promo form). */
export function mapAccommodationRowsToOptions(rows) {
  return (rows || []).map((a) => {
    const campusId =
      a.campusId ||
      (Array.isArray(a.campuses) && a.campuses[0] && a.campuses[0].campusId) ||
      null;
    return {
      value: a.id,
      label: a.name || a.id,
      countryId: a.countryId || (a.city && a.city.countryId),
      campusId,
    };
  });
}
