/** Page size for admin search endpoints (countries, schools, campuses, courses) in promo forms. */
export const PROMO_ENTITY_PAGE_SIZE = 20;

export function defaultPromoForm() {
  return {
    code: "",
    status: "active",
    description: "",
    eligibilityScope: "global",
    userEmail: "",
    discountType: "percent",
    discountValue: "",
    applyingScope: "tuition_only",
    selectedServices: [],
    accommodationAllInCampus: false,
    accommodationGlobalAll: false,
    accommodationCountryFilter: null,
    accommodationCampusFilter: null,
    countries: [],
    schools: [],
    campuses: [],
    programs: [],
    minWeeks: "",
    maxWeeks: "",
    selectedAccommodations: [],
    combinableWithSchool: true,
    totalLimit: "",
    perUserLimit: "",
    startAt: null,
    endAt: null,
  };
}

export function applyingScopeHint(scope) {
  const hints = {
    tuition_only: "Discount applies to the programme fee only.",
    tuition_mandatory: "Discount applies to the programme fee and any mandatory extras (e.g. enrolment fee).",
    accommodation: "Discount applies to the accommodation fee only.",
    services: "Discount applies to the extras selected below.",
  };
  return hints[scope] || "";
}
