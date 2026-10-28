import { defaultPromoForm } from "../promo-code-form/constants";

/** @type {Record<string, string>} */
export const FORM_SCOPE_TO_API = {
  tuition_only: "TUITION_ONLY",
  tuition_mandatory: "TUITION_AND_MANDATORY",
  accommodation: "ACCOMMODATION",
  services: "SERVICES",
};

/** @type {Record<string, string>} */
export const API_SCOPE_TO_FORM = {
  TUITION_ONLY: "tuition_only",
  TUITION_AND_MANDATORY: "tuition_mandatory",
  ACCOMMODATION: "accommodation",
  SERVICES: "services",
};

export function getScopeLabel(scope) {
  const key = API_SCOPE_TO_FORM[scope] || scope;
  const m = {
    tuition_only: "Programme fee",
    TUITION_ONLY: "Programme fee",
    tuition_mandatory: "Programme + mandatory",
    TUITION_AND_MANDATORY: "Programme + mandatory",
    accommodation: "Accommodation",
    ACCOMMODATION: "Accommodation",
    services: "Extras",
    SERVICES: "Extras",
  };
  return m[scope] || m[key] || scope;
}

function numOrNull(v) {
  if (v === "" || v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
}

export function buildEligibilityRule(form) {
  const scope = form.applyingScope;

  if (scope === "tuition_only" || scope === "tuition_mandatory") {
    return {
      countryIds: (form.countries || []).map((x) => String(x.value)),
      campusIds: (form.campuses || []).map((x) => String(x.value)),
      courseIds: (form.programs || []).map((x) => String(x.value)),
      accommodationIds: [],
      serviceIds: [],
      minDurationWeeks: numOrNull(form.minWeeks),
      maxDurationWeeks: numOrNull(form.maxWeeks),
    };
  }

  if (scope === "accommodation") {
    if (form.accommodationGlobalAll) {
      return {
        countryIds: [],
        campusIds: [],
        courseIds: [],
        accommodationIds: [],
        serviceIds: [],
        minDurationWeeks: null,
        maxDurationWeeks: null,
      };
    }
    const countryIds = form.accommodationCountryFilter?.value
      ? [String(form.accommodationCountryFilter.value)]
      : [];
    const campusIds =
      form.accommodationAllInCampus && form.accommodationCampusFilter?.value
        ? [String(form.accommodationCampusFilter.value)]
        : [];
    return {
      countryIds,
      campusIds,
      courseIds: [],
      accommodationIds: (form.selectedAccommodations || []).map((x) => String(x.value)),
      serviceIds: [],
      minDurationWeeks: null,
      maxDurationWeeks: null,
    };
  }

  if (scope === "services") {
    return {
      countryIds: [],
      campusIds: [],
      courseIds: [],
      accommodationIds: [],
      serviceIds: (form.selectedServices || []).map((x) => String(x.value)),
      minDurationWeeks: null,
      maxDurationWeeks: null,
    };
  }

  return {
    countryIds: [],
    campusIds: [],
    courseIds: [],
    accommodationIds: [],
    serviceIds: [],
    minDurationWeeks: null,
    maxDurationWeeks: null,
  };
}

/**
 * Drop eligibility UI state that does not belong to the current applying scope (e.g. legacy mixed rules).
 * @param {string} applyingScope — form value: tuition_only | tuition_mandatory | accommodation | services
 * @param {object} form — merged form object
 */
export function sanitizeHydratedEligibilityForScope(applyingScope, form) {
  const out = { ...form };
  if (applyingScope === "services") {
    out.countries = [];
    out.schools = [];
    out.campuses = [];
    out.programs = [];
    out.minWeeks = "";
    out.maxWeeks = "";
    out.selectedAccommodations = [];
    out.accommodationCountryFilter = null;
    out.accommodationCampusFilter = null;
    out.accommodationAllInCampus = false;
    out.accommodationGlobalAll = false;
  } else if (applyingScope === "accommodation") {
    out.countries = [];
    out.schools = [];
    out.campuses = [];
    out.programs = [];
    out.minWeeks = "";
    out.maxWeeks = "";
    out.selectedServices = [];
  } else if (applyingScope === "tuition_only" || applyingScope === "tuition_mandatory") {
    out.selectedAccommodations = [];
    out.selectedServices = [];
    out.accommodationCountryFilter = null;
    out.accommodationCampusFilter = null;
    out.accommodationAllInCampus = false;
    out.accommodationGlobalAll = false;
  }
  return out;
}

export function formToCreatePayload(form) {
  const scope = FORM_SCOPE_TO_API[form.applyingScope];
  if (!scope) {
    throw new Error("Invalid applying scope");
  }

  const payload = {
    code: form.code.trim(),
    description: form.description || "",
    status: form.status,
    discountType: form.discountType,
    discountValue: Number(form.discountValue),
    applyingScope: scope,
    combinableWithSchoolDiscount: Boolean(form.combinableWithSchool),
    totalUsageLimit: form.totalLimit === "" ? null : numOrNull(form.totalLimit),
    perUserLimit: form.perUserLimit === "" ? null : numOrNull(form.perUserLimit),
    startDate: new Date(form.startAt).toISOString(),
    endDate: new Date(form.endAt).toISOString(),
    eligibilityRule: buildEligibilityRule(form),
  };

  if (form.eligibilityScope === "user" && form.userEmail?.trim()) {
    payload.assignedUserEmail = form.userEmail.trim();
  }

  return payload;
}

export function formToUpdatePayload(form) {
  const base = formToCreatePayload(form);
  const payload = {
    code: base.code,
    description: base.description,
    status: base.status,
    discountType: base.discountType,
    discountValue: base.discountValue,
    applyingScope: base.applyingScope,
    combinableWithSchoolDiscount: base.combinableWithSchoolDiscount,
    totalUsageLimit: base.totalUsageLimit,
    perUserLimit: base.perUserLimit,
    startDate: base.startDate,
    endDate: base.endDate,
    eligibilityRule: base.eligibilityRule,
  };
  if (form.eligibilityScope === "user" && form.userEmail?.trim()) {
    payload.assignedUserEmail = form.userEmail.trim();
  } else {
    payload.assignedUserEmail = null;
  }
  return payload;
}

/**
 * @param {object} dto — GET /admin/promo-codes/:id response
 * @returns {object} form state (select fields empty until hydrated)
 */
export function mapPromoDtoToFormBase(dto) {
  const rule = dto.eligibilityRule || {};
  const base = defaultPromoForm();

  const applyingScope = API_SCOPE_TO_FORM[dto.applyingScope] || "tuition_only";
  const hasAccIds = Array.isArray(rule.accommodationIds) && rule.accommodationIds.length > 0;
  const hasCampusIds = Array.isArray(rule.campusIds) && rule.campusIds.length > 0;
  const hasCountryIds = Array.isArray(rule.countryIds) && rule.countryIds.length > 0;
  const isAccScopeApi = dto.applyingScope === "ACCOMMODATION";
  const accommodationGlobalAll = Boolean(
    isAccScopeApi && !hasAccIds && !hasCampusIds && !hasCountryIds
  );

  return {
    ...base,
    code: dto.code || "",
    description: dto.description || "",
    status: dto.status || "active",
    eligibilityScope: dto.assignedUserId || dto.assignedUserEmail ? "user" : "global",
    userEmail: dto.assignedUserEmail || "",
    discountType: dto.discountType || "percent",
    discountValue: dto.discountValue != null ? String(dto.discountValue) : "",
    applyingScope,
    selectedServices: [],
    accommodationGlobalAll,
    accommodationAllInCampus: Boolean(
      isAccScopeApi && !hasAccIds && hasCampusIds && !accommodationGlobalAll
    ),
    accommodationCountryFilter: null,
    accommodationCampusFilter: null,
    countries: [],
    schools: [],
    campuses: [],
    programs: [],
    minWeeks: rule.minDurationWeeks != null ? String(rule.minDurationWeeks) : "",
    maxWeeks: rule.maxDurationWeeks != null ? String(rule.maxDurationWeeks) : "",
    selectedAccommodations: [],
    combinableWithSchool: Boolean(dto.combinableWithSchoolDiscount),
    totalLimit: dto.totalUsageLimit != null ? String(dto.totalUsageLimit) : "",
    perUserLimit: dto.perUserLimit != null ? String(dto.perUserLimit) : "",
    startAt: dto.startDate ? new Date(dto.startDate) : null,
    endAt: dto.endDate ? new Date(dto.endDate) : null,
  };
}
