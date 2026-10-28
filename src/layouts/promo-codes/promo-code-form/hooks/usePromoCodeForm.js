import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import Swal from "sweetalert2";

import { PromoCodeService } from "services/promoCodeService";
import { AccommodationService } from "services/accommodationService";
import { CourseService } from "services/courseService";
import { UserService } from "services/userService";
import { SchoolService } from "services/schoolService";
import { CampusService } from "services/campusService";
import { defaultPromoForm, PROMO_ENTITY_PAGE_SIZE } from "../constants";
import { CountryService } from "services/countryService";
import {
  formToCreatePayload,
  formToUpdatePayload,
  mapPromoDtoToFormBase,
  sanitizeHydratedEligibilityForScope,
} from "../../utils/promoMappers";
import { hydrateEligibilityFromDto } from "../../utils/hydratePromoSelects";
import { loadPromoMasterOptions } from "../../utils/loadPromoMasterOptions";
import { clearPromoListPageCache } from "../../promo-codes-list/usePromoCodesList";
import { mapAccommodationRowsToOptions } from "../../utils/accommodationOptionsMap";

async function fetchAllAccommodationsPaged(baseFilters) {
  const limit = PROMO_ENTITY_PAGE_SIZE;
  let page = 1;
  const all = [];
  for (;;) {
    const res = await AccommodationService.getAllAccommodations({ ...baseFilters, limit, page });
    const rows = res.data || [];
    all.push(...rows);
    const meta = res.meta || {};
    const totalPages = Number(meta.totalPages) || 1;
    const cur = Number(meta.currentPage) || page;
    if (rows.length < limit || cur >= totalPages) break;
    page += 1;
  }
  return all;
}

export function usePromoCodeForm() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const isView = searchParams.get("view") === "1" || searchParams.get("mode") === "view";

  const [form, setForm] = useState(defaultPromoForm);
  const [dateError, setDateError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accommodationSelectOptions, setAccommodationSelectOptions] = useState([]);
  const [accommodationSelectLoading, setAccommodationSelectLoading] = useState(false);
  const [accommodationBulkLoading, setAccommodationBulkLoading] = useState(false);
  const accAllInferredRef = useRef(false);

  const promoTuitionSeededForIdRef = useRef(null);
  const promoTuitionHydrateKeysRef = useRef(null);
  const hydrateSchoolSearchSkippedRef = useRef(false);
  const hydrateCampusSearchSkippedRef = useRef(false);
  const hydrateCourseSearchSkippedRef = useRef(false);
  const tuitionSchoolsCatalogKeyRef = useRef(null);
  const tuitionCampusesCatalogKeyRef = useRef(null);
  const tuitionCoursesCatalogKeyRef = useRef(null);

  const [masterOptions, setMasterOptions] = useState({ countryOptions: [], countryMeta: null });
  const [tuitionSchoolOptions, setTuitionSchoolOptions] = useState([]);
  const [tuitionSchoolsLoading, setTuitionSchoolsLoading] = useState(false);
  const [tuitionCampusOptions, setTuitionCampusOptions] = useState([]);
  const [tuitionCampusesLoading, setTuitionCampusesLoading] = useState(false);
  const [accCampusOptionsRemote, setAccCampusOptionsRemote] = useState([]);
  const [accCampusesLoading, setAccCampusesLoading] = useState(false);
  const [tuitionCourseOptions, setTuitionCourseOptions] = useState([]);
  const [tuitionCoursesLoading, setTuitionCoursesLoading] = useState(false);
  const [countryLoadingMore, setCountryLoadingMore] = useState(false);
  const [tuitionSchoolsLoadingMore, setTuitionSchoolsLoadingMore] = useState(false);
  const [tuitionCampusesLoadingMore, setTuitionCampusesLoadingMore] = useState(false);
  const [tuitionCoursesLoadingMore, setTuitionCoursesLoadingMore] = useState(false);
  const [accCampusesLoadingMore, setAccCampusesLoadingMore] = useState(false);
  const [accommodationSelectLoadingMore, setAccommodationSelectLoadingMore] = useState(false);

  const countryPagingInitedRef = useRef(false);
  const countryNextPageRef = useRef(2);
  const countryHasMoreRef = useRef(true);
  const tuitionSchoolNextPageRef = useRef(2);
  const tuitionSchoolHasMoreRef = useRef(true);
  const tuitionSchoolKeyRef = useRef("");
  const tuitionCampusNextPageRef = useRef(2);
  const tuitionCampusHasMoreRef = useRef(true);
  const tuitionCampusKeyRef = useRef("");
  const tuitionCourseNextPageRef = useRef(2);
  const tuitionCourseHasMoreRef = useRef(true);
  const tuitionCourseKeyRef = useRef("");
  const accCampusNextPageRef = useRef(2);
  const accCampusHasMoreRef = useRef(true);
  const accCampusCountryIdRef = useRef("");
  const accSelectNextPageRef = useRef(2);
  const accSelectHasMoreRef = useRef(true);
  const accSelectKeyRef = useRef("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const masters = await loadPromoMasterOptions();
        if (cancelled) return;
        setMasterOptions(masters);

        if (!isEdit) {
          setForm(defaultPromoForm());
          return;
        }

        const dto = await PromoCodeService.getPromoCode(id);
        if (cancelled) return;

        const base = mapPromoDtoToFormBase(dto);
        let userEmail = base.userEmail;
        if (
          base.eligibilityScope === "user" &&
          dto.assignedUserId &&
          !(userEmail && String(userEmail).trim())
        ) {
          try {
            const u = await UserService.getUserById(dto.assignedUserId);
            if (u?.email) userEmail = u.email;
          } catch {
            /* keep empty if lookup fails */
          }
        }
        const baseWithEmail = { ...base, userEmail };

        const elig = await hydrateEligibilityFromDto(dto);
        if (cancelled) return;

        const merged = {
          ...baseWithEmail,
          countries: elig.countries,
          schools: elig.schools || [],
          campuses: elig.campuses,
          programs: elig.programs,
          selectedAccommodations: elig.selectedAccommodations,
          selectedServices: elig.selectedServices,
          accommodationCountryFilter: elig.accommodationCountryFilter ?? null,
          accommodationCampusFilter: elig.accommodationCampusFilter ?? null,
        };
        setForm(sanitizeHydratedEligibilityForScope(base.applyingScope, merged));
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          Swal.fire({
            icon: "error",
            title: "Failed to load promo code",
            text: e.message || "Unknown error",
            confirmButtonColor: "#6D4AFF",
          }).then(() => navigate("/promo-codes"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [id, isEdit, navigate]);

  useEffect(() => {
    accAllInferredRef.current = false;
    promoTuitionSeededForIdRef.current = null;
    promoTuitionHydrateKeysRef.current = null;
    hydrateSchoolSearchSkippedRef.current = false;
    hydrateCampusSearchSkippedRef.current = false;
    hydrateCourseSearchSkippedRef.current = false;
    tuitionSchoolsCatalogKeyRef.current = null;
    tuitionCampusesCatalogKeyRef.current = null;
    tuitionCoursesCatalogKeyRef.current = null;
    countryPagingInitedRef.current = false;
  }, [id]);

  useEffect(() => {
    if (!masterOptions.countryMeta || countryPagingInitedRef.current) return;
    const m = masterOptions.countryMeta;
    countryNextPageRef.current = (Number(m.currentPage) || 1) + 1;
    countryHasMoreRef.current = (Number(m.currentPage) || 1) < (Number(m.totalPages) || 1);
    countryPagingInitedRef.current = true;
  }, [masterOptions.countryMeta]);

  useEffect(() => {
    if (loading || !isEdit || !id) return;
    const tuition =
      form.applyingScope === "tuition_only" || form.applyingScope === "tuition_mandatory";
    if (!tuition) return;
    if (!(form.countries || []).length) return;
    if (promoTuitionSeededForIdRef.current === id) return;

    promoTuitionSeededForIdRef.current = id;
    const countriesKey = (form.countries || [])
      .map((c) => c.value)
      .filter(Boolean)
      .sort()
      .join(",");
    const schoolIdsKey = (form.schools || [])
      .map((s) => s.value)
      .filter(Boolean)
      .sort()
      .join(",");
    const campusIdsKey = (form.campuses || [])
      .map((c) => c.value)
      .filter(Boolean)
      .sort()
      .join(",");
    promoTuitionHydrateKeysRef.current = { countriesKey, schoolIdsKey, campusIdsKey };

    setTuitionSchoolOptions(form.schools || []);
    setTuitionCampusOptions(form.campuses || []);
    setTuitionCourseOptions(
      (form.programs || []).map((p) => ({
        value: p.value,
        label: p.label || p.value,
        campusId: p.campusId,
      }))
    );
  }, [
    loading,
    isEdit,
    id,
    form.applyingScope,
    form.countries,
    form.schools,
    form.campuses,
    form.programs,
  ]);

  const onInputChange = useCallback(
    (field, value) => {
      if (isView) return;
      setForm((prev) => ({ ...prev, [field]: value }));
    },
    [isView]
  );

  const schoolOptions = tuitionSchoolOptions;
  const campusOptions = tuitionCampusOptions;

  useEffect(() => {
    const tuition =
      form.applyingScope === "tuition_only" || form.applyingScope === "tuition_mandatory";
    const countryIds = (form.countries || []).map((c) => c.value).filter(Boolean);
    if (!tuition || countryIds.length === 0) {
      setTuitionSchoolOptions([]);
      setTuitionSchoolsLoading(false);
      return;
    }

    const countryKey = countryIds.sort().join(",");
    const skipDuplicateSearch =
      isEdit &&
      promoTuitionHydrateKeysRef.current &&
      promoTuitionHydrateKeysRef.current.countriesKey === countryKey &&
      !hydrateSchoolSearchSkippedRef.current;

    if (skipDuplicateSearch) {
      hydrateSchoolSearchSkippedRef.current = true;
      setTuitionSchoolsLoading(false);
      return;
    }

    let cancelled = false;
    setTuitionSchoolsLoading(true);
    SchoolService.getSchools({ countryIds, limit: PROMO_ENTITY_PAGE_SIZE, page: 1 })
      .then((res) => {
        if (cancelled) return;
        const rows = res.data || [];
        const meta = res.meta || {};
        setTuitionSchoolOptions(
          rows.map((s) => ({
            value: s.id,
            label: s.name || s.id,
            countryId: s.countryId,
          }))
        );
        tuitionSchoolsCatalogKeyRef.current = countryKey;
        tuitionSchoolKeyRef.current = countryKey;
        tuitionSchoolNextPageRef.current = (Number(meta.currentPage) || 1) + 1;
        tuitionSchoolHasMoreRef.current =
          (Number(meta.currentPage) || 1) < (Number(meta.totalPages) || 1);
      })
      .catch(() => {
        if (!cancelled) setTuitionSchoolOptions([]);
      })
      .finally(() => {
        if (!cancelled) setTuitionSchoolsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.applyingScope, form.countries, isEdit]);

  useEffect(() => {
    const tuition =
      form.applyingScope === "tuition_only" || form.applyingScope === "tuition_mandatory";
    const schoolIds = (form.schools || []).map((s) => s.value).filter(Boolean);
    if (!tuition || schoolIds.length === 0) {
      setTuitionCampusOptions([]);
      setTuitionCampusesLoading(false);
      return;
    }

    const schoolIdsKey = schoolIds.sort().join(",");
    const skipDuplicateSearch =
      isEdit &&
      promoTuitionHydrateKeysRef.current &&
      promoTuitionHydrateKeysRef.current.schoolIdsKey === schoolIdsKey &&
      !hydrateCampusSearchSkippedRef.current;

    if (skipDuplicateSearch) {
      hydrateCampusSearchSkippedRef.current = true;
      setTuitionCampusesLoading(false);
      return;
    }

    let cancelled = false;
    setTuitionCampusesLoading(true);
    CampusService.searchAdminCampuses({ schoolIds, limit: PROMO_ENTITY_PAGE_SIZE, page: 1 })
      .then((result) => {
        if (cancelled) return;
        const rows = result.data || [];
        const meta = result.meta || {};
        setTuitionCampusOptions(
          (rows || []).map((c) => ({
            value: c.id,
            label: c.name || c.id,
            countryId: c.countryId,
            schoolId: c.schoolId,
          }))
        );
        tuitionCampusesCatalogKeyRef.current = schoolIdsKey;
        tuitionCampusKeyRef.current = schoolIdsKey;
        tuitionCampusNextPageRef.current = (Number(meta.currentPage) || 1) + 1;
        tuitionCampusHasMoreRef.current =
          (Number(meta.currentPage) || 1) < (Number(meta.totalPages) || 1);
      })
      .catch(() => {
        if (!cancelled) setTuitionCampusOptions([]);
      })
      .finally(() => {
        if (!cancelled) setTuitionCampusesLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [form.applyingScope, form.schools, isEdit]);

  useEffect(() => {
    if (
      form.applyingScope !== "accommodation" ||
      form.accommodationGlobalAll ||
      !form.accommodationCountryFilter?.value
    ) {
      setAccCampusOptionsRemote([]);
      setAccCampusesLoading(false);
      return;
    }

    const countryId = form.accommodationCountryFilter.value;
    let cancelled = false;
    setAccCampusesLoading(true);

    (async () => {
      try {
        const result = await CampusService.searchAdminCampuses({
          countryIds: [countryId],
          limit: PROMO_ENTITY_PAGE_SIZE,
          page: 1,
        });
        if (cancelled) return;
        const rows = result.data || [];
        const meta = result.meta || {};
        setAccCampusOptionsRemote(
          (rows || []).map((c) => ({
            value: c.id,
            label: c.name || c.id,
            countryId: c.countryId,
            schoolId: c.schoolId,
          }))
        );
        accCampusCountryIdRef.current = countryId;
        accCampusNextPageRef.current = (Number(meta.currentPage) || 1) + 1;
        accCampusHasMoreRef.current =
          (Number(meta.currentPage) || 1) < (Number(meta.totalPages) || 1);
      } catch {
        if (!cancelled) setAccCampusOptionsRemote([]);
      } finally {
        if (!cancelled) setAccCampusesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.applyingScope, form.accommodationGlobalAll, form.accommodationCountryFilter]);

  useEffect(() => {
    const tuition =
      form.applyingScope === "tuition_only" || form.applyingScope === "tuition_mandatory";
    if (!tuition || !(form.campuses || []).length) {
      setTuitionCourseOptions([]);
      setTuitionCoursesLoading(false);
      return;
    }

    const campusIds = form.campuses.map((c) => c.value).filter(Boolean);
    const campusIdsKey = campusIds.sort().join(",");
    const skipDuplicateSearch =
      isEdit &&
      promoTuitionHydrateKeysRef.current &&
      promoTuitionHydrateKeysRef.current.campusIdsKey === campusIdsKey &&
      !hydrateCourseSearchSkippedRef.current;

    if (skipDuplicateSearch) {
      hydrateCourseSearchSkippedRef.current = true;
      setTuitionCoursesLoading(false);
      return;
    }

    let cancelled = false;
    setTuitionCoursesLoading(true);

    (async () => {
      try {
        const res = await CourseService.getAllCourses({
          campusIds,
          limit: PROMO_ENTITY_PAGE_SIZE,
          page: 1,
        });
        if (cancelled) return;
        const rows = res.data || [];
        const meta = res.meta || {};
        setTuitionCourseOptions(
          rows.map((c) => ({
            value: c.id,
            label: c.title || c.name || c.id,
            campusId: c.campusId,
          }))
        );
        tuitionCoursesCatalogKeyRef.current = campusIdsKey;
        tuitionCourseKeyRef.current = campusIdsKey;
        tuitionCourseNextPageRef.current = (Number(meta.currentPage) || 1) + 1;
        tuitionCourseHasMoreRef.current =
          (Number(meta.currentPage) || 1) < (Number(meta.totalPages) || 1);
      } catch {
        if (!cancelled) setTuitionCourseOptions([]);
      } finally {
        if (!cancelled) setTuitionCoursesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [form.applyingScope, form.campuses, isEdit]);

  const fetchTuitionSchoolsCatalog = useCallback(async () => {
    const tuition =
      form.applyingScope === "tuition_only" || form.applyingScope === "tuition_mandatory";
    const countryIds = (form.countries || []).map((c) => c.value).filter(Boolean);
    if (!tuition || countryIds.length === 0) return;
    const countryKey = countryIds.sort().join(",");
    if (tuitionSchoolsCatalogKeyRef.current === countryKey) return;

    setTuitionSchoolsLoading(true);
    try {
      const res = await SchoolService.getSchools({ countryIds, limit: PROMO_ENTITY_PAGE_SIZE, page: 1 });
      const rows = res.data || [];
      const meta = res.meta || {};
      setTuitionSchoolOptions(
        rows.map((s) => ({
          value: s.id,
          label: s.name || s.id,
          countryId: s.countryId,
        }))
      );
      tuitionSchoolsCatalogKeyRef.current = countryKey;
      tuitionSchoolKeyRef.current = countryKey;
      tuitionSchoolNextPageRef.current = (Number(meta.currentPage) || 1) + 1;
      tuitionSchoolHasMoreRef.current =
        (Number(meta.currentPage) || 1) < (Number(meta.totalPages) || 1);
    } catch {
      /* keep options */
    } finally {
      setTuitionSchoolsLoading(false);
    }
  }, [form.applyingScope, form.countries]);

  const fetchTuitionCampusesCatalog = useCallback(async () => {
    const tuition =
      form.applyingScope === "tuition_only" || form.applyingScope === "tuition_mandatory";
    const schoolIds = (form.schools || []).map((s) => s.value).filter(Boolean);
    if (!tuition || schoolIds.length === 0) return;
    const schoolIdsKey = schoolIds.sort().join(",");
    if (tuitionCampusesCatalogKeyRef.current === schoolIdsKey) return;

    setTuitionCampusesLoading(true);
    try {
      const result = await CampusService.searchAdminCampuses({
        schoolIds,
        limit: PROMO_ENTITY_PAGE_SIZE,
        page: 1,
      });
      const rows = result.data || [];
      const meta = result.meta || {};
      setTuitionCampusOptions(
        (rows || []).map((c) => ({
          value: c.id,
          label: c.name || c.id,
          countryId: c.countryId,
          schoolId: c.schoolId,
        }))
      );
      tuitionCampusesCatalogKeyRef.current = schoolIdsKey;
      tuitionCampusKeyRef.current = schoolIdsKey;
      tuitionCampusNextPageRef.current = (Number(meta.currentPage) || 1) + 1;
      tuitionCampusHasMoreRef.current =
        (Number(meta.currentPage) || 1) < (Number(meta.totalPages) || 1);
    } catch {
      /* keep options */
    } finally {
      setTuitionCampusesLoading(false);
    }
  }, [form.applyingScope, form.schools]);

  const fetchTuitionCoursesCatalog = useCallback(async () => {
    const tuition =
      form.applyingScope === "tuition_only" || form.applyingScope === "tuition_mandatory";
    const campusIds = (form.campuses || []).map((c) => c.value).filter(Boolean);
    if (!tuition || campusIds.length === 0) return;
    const campusIdsKey = campusIds.sort().join(",");
    if (tuitionCoursesCatalogKeyRef.current === campusIdsKey) return;

    setTuitionCoursesLoading(true);
    try {
      const res = await CourseService.getAllCourses({
        campusIds,
        limit: PROMO_ENTITY_PAGE_SIZE,
        page: 1,
      });
      const rows = res.data || [];
      const meta = res.meta || {};
      setTuitionCourseOptions(
        rows.map((c) => ({
          value: c.id,
          label: c.title || c.name || c.id,
          campusId: c.campusId,
        }))
      );
      tuitionCoursesCatalogKeyRef.current = campusIdsKey;
      tuitionCourseKeyRef.current = campusIdsKey;
      tuitionCourseNextPageRef.current = (Number(meta.currentPage) || 1) + 1;
      tuitionCourseHasMoreRef.current =
        (Number(meta.currentPage) || 1) < (Number(meta.totalPages) || 1);
    } catch {
      /* keep options */
    } finally {
      setTuitionCoursesLoading(false);
    }
  }, [form.applyingScope, form.campuses]);

  const programOptions = useMemo(() => {
    const base = tuitionCourseOptions || [];
    const byId = new Map(base.map((o) => [o.value, o]));
    (form.programs || []).forEach((p) => {
      if (p?.value && !byId.has(p.value)) byId.set(p.value, p);
    });
    return [...byId.values()];
  }, [tuitionCourseOptions, form.programs]);

  const accommodationCampusOptions = useMemo(() => {
    const base = accCampusOptionsRemote;
    const cur = form.accommodationCampusFilter;
    if (cur?.value && !base.some((x) => x.value === cur.value)) {
      return [cur, ...base];
    }
    return base;
  }, [accCampusOptionsRemote, form.accommodationCampusFilter]);

  useEffect(() => {
    if (
      form.applyingScope !== "accommodation" ||
      form.accommodationGlobalAll ||
      form.accommodationAllInCampus ||
      !form.accommodationCampusFilter ||
      !form.accommodationCountryFilter
    ) {
      setAccommodationSelectOptions([]);
      setAccommodationSelectLoading(false);
      return;
    }
    const campus = form.accommodationCampusFilter;
    const country = form.accommodationCountryFilter;
    if (!campus?.value || !country?.value) {
      setAccommodationSelectOptions([]);
      setAccommodationSelectLoading(false);
      return;
    }

    const selectKey = `${campus.value}-${country.value}`;
    let cancelled = false;
    setAccommodationSelectLoading(true);
    AccommodationService.getAllAccommodations({
      campusIds: [campus.value],
      countryIds: [country.value],
      limit: PROMO_ENTITY_PAGE_SIZE,
      page: 1,
    })
      .then((res) => {
        if (cancelled) return;
        const rows = res.data || [];
        const meta = res.meta || {};
        accSelectKeyRef.current = selectKey;
        accSelectNextPageRef.current = (Number(meta.currentPage) || 1) + 1;
        accSelectHasMoreRef.current =
          (Number(meta.currentPage) || 1) < (Number(meta.totalPages) || 1);
        setAccommodationSelectOptions(mapAccommodationRowsToOptions(rows));
      })
      .catch(() => {
        if (!cancelled) setAccommodationSelectOptions([]);
      })
      .finally(() => {
        if (!cancelled) setAccommodationSelectLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    form.applyingScope,
    form.accommodationGlobalAll,
    form.accommodationAllInCampus,
    form.accommodationCampusFilter,
    form.accommodationCountryFilter,
  ]);

  useEffect(() => {
    if (
      form.applyingScope !== "accommodation" ||
      form.accommodationGlobalAll ||
      !form.accommodationAllInCampus
    ) {
      setAccommodationBulkLoading(false);
      return;
    }
    const campus = form.accommodationCampusFilter;
    const country = form.accommodationCountryFilter;
    if (!campus?.value || !country?.value) {
      setAccommodationBulkLoading(false);
      return;
    }

    let cancelled = false;
    setAccommodationBulkLoading(true);
    fetchAllAccommodationsPaged({
      campusIds: [campus.value],
      countryIds: [country.value],
    })
      .then((rows) => {
        if (cancelled) return;
        const opts = mapAccommodationRowsToOptions(rows);
        setForm((prev) => {
          if (!prev.accommodationAllInCampus) return prev;
          return { ...prev, selectedAccommodations: opts };
        });
      })
      .catch(() => {
        if (!cancelled) {
          setForm((prev) => {
            if (!prev.accommodationAllInCampus) return prev;
            return { ...prev, selectedAccommodations: [] };
          });
        }
      })
      .finally(() => {
        if (!cancelled) setAccommodationBulkLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    form.applyingScope,
    form.accommodationGlobalAll,
    form.accommodationAllInCampus,
    form.accommodationCampusFilter,
    form.accommodationCountryFilter,
  ]);

  useEffect(() => {
    if (loading || !isEdit || accAllInferredRef.current) return;
    if (form.applyingScope !== "accommodation" || form.accommodationGlobalAll || form.accommodationAllInCampus)
      return;
    const campus = form.accommodationCampusFilter;
    const country = form.accommodationCountryFilter;
    if (!campus?.value || !country?.value) return;
    const sel = form.selectedAccommodations || [];
    if (!sel.length) return;

    let cancelled = false;
    fetchAllAccommodationsPaged({
      campusIds: [campus.value],
      countryIds: [country.value],
    })
      .then((rows) => {
        if (cancelled) return;
        const apiIds = new Set(rows.map((a) => a.id));
        const selIds = new Set(sel.map((x) => x.value));
        const sameSize = apiIds.size > 0 && apiIds.size === selIds.size;
        const sameSet = sameSize && [...apiIds].every((aid) => selIds.has(aid));
        if (sameSet) {
          setForm((prev) => ({ ...prev, accommodationAllInCampus: true }));
        }
      })
      .finally(() => {
        if (!cancelled) accAllInferredRef.current = true;
      });

    return () => {
      cancelled = true;
    };
  }, [
    loading,
    isEdit,
    form.applyingScope,
    form.accommodationGlobalAll,
    form.accommodationAllInCampus,
    form.accommodationCampusFilter,
    form.accommodationCountryFilter,
    form.selectedAccommodations,
  ]);

  const endAfterStart = useMemo(() => {
    if (!form.startAt || !form.endAt) return true;
    return new Date(form.endAt).getTime() >= new Date(form.startAt).getTime();
  }, [form.startAt, form.endAt]);

  useEffect(() => {
    if (form.startAt && form.endAt && !endAfterStart) {
      setDateError("End date must be on or after start date.");
    } else {
      setDateError("");
    }
  }, [form.startAt, form.endAt, endAfterStart]);

  const discountNum = Number(form.discountValue);
  const discountValid =
    form.discountValue !== "" &&
    String(form.discountValue).trim() !== "" &&
    !Number.isNaN(discountNum) &&
    discountNum > 0 &&
    (form.discountType !== "percent" || discountNum <= 100);

  const canSaveBasics =
    Boolean(form.code.trim()) && discountValid && (form.eligibilityScope !== "user" || form.userEmail.trim());

  const accommodationScopeOk =
    form.applyingScope !== "accommodation" ||
    form.accommodationGlobalAll ||
    (form.accommodationCountryFilter &&
      form.accommodationCampusFilter &&
      (form.accommodationAllInCampus ||
        (form.selectedAccommodations && form.selectedAccommodations.length > 0)));

  const canSubmit =
    canSaveBasics &&
    form.startAt &&
    form.endAt &&
    endAfterStart &&
    !loading &&
    accommodationScopeOk;

  const loadMoreCountries = useCallback(async () => {
    if (countryLoadingMore || !countryHasMoreRef.current) return;
    setCountryLoadingMore(true);
    try {
      const res = await CountryService.getAllCountries({
        limit: PROMO_ENTITY_PAGE_SIZE,
        page: countryNextPageRef.current,
      });
      const rows = res.data || [];
      const meta = res.meta || {};
      setMasterOptions((prev) => ({
        ...prev,
        countryOptions: [
          ...prev.countryOptions,
          ...rows.map((c) => ({ value: c.id, label: c.name || c.id })),
        ],
        countryMeta: meta,
      }));
      countryNextPageRef.current = (Number(meta.currentPage) || countryNextPageRef.current) + 1;
      countryHasMoreRef.current = (Number(meta.currentPage) || 1) < (Number(meta.totalPages) || 1);
    } finally {
      setCountryLoadingMore(false);
    }
  }, [countryLoadingMore]);

  const loadMoreTuitionSchools = useCallback(async () => {
    const tuition =
      form.applyingScope === "tuition_only" || form.applyingScope === "tuition_mandatory";
    const countryIds = (form.countries || []).map((c) => c.value).filter(Boolean);
    if (!tuition || countryIds.length === 0) return;
    const countryKey = countryIds.sort().join(",");
    if (countryKey !== tuitionSchoolKeyRef.current || !tuitionSchoolHasMoreRef.current) return;
    if (tuitionSchoolsLoadingMore) return;
    setTuitionSchoolsLoadingMore(true);
    try {
      const res = await SchoolService.getSchools({
        countryIds,
        limit: PROMO_ENTITY_PAGE_SIZE,
        page: tuitionSchoolNextPageRef.current,
      });
      const rows = res.data || [];
      const meta = res.meta || {};
      setTuitionSchoolOptions((prev) => {
        const seen = new Set(prev.map((x) => x.value));
        const add = rows
          .filter((s) => !seen.has(s.id))
          .map((s) => ({
            value: s.id,
            label: s.name || s.id,
            countryId: s.countryId,
          }));
        return [...prev, ...add];
      });
      tuitionSchoolNextPageRef.current =
        (Number(meta.currentPage) || tuitionSchoolNextPageRef.current) + 1;
      tuitionSchoolHasMoreRef.current =
        (Number(meta.currentPage) || 1) < (Number(meta.totalPages) || 1);
    } finally {
      setTuitionSchoolsLoadingMore(false);
    }
  }, [form.applyingScope, form.countries, tuitionSchoolsLoadingMore]);

  const loadMoreTuitionCampuses = useCallback(async () => {
    const tuition =
      form.applyingScope === "tuition_only" || form.applyingScope === "tuition_mandatory";
    const schoolIds = (form.schools || []).map((s) => s.value).filter(Boolean);
    if (!tuition || schoolIds.length === 0) return;
    const schoolIdsKey = schoolIds.sort().join(",");
    if (schoolIdsKey !== tuitionCampusKeyRef.current || !tuitionCampusHasMoreRef.current) return;
    if (tuitionCampusesLoadingMore) return;
    setTuitionCampusesLoadingMore(true);
    try {
      const result = await CampusService.searchAdminCampuses({
        schoolIds,
        limit: PROMO_ENTITY_PAGE_SIZE,
        page: tuitionCampusNextPageRef.current,
      });
      const rows = result.data || [];
      const meta = result.meta || {};
      setTuitionCampusOptions((prev) => {
        const seen = new Set(prev.map((x) => x.value));
        const add = rows
          .filter((c) => !seen.has(c.id))
          .map((c) => ({
            value: c.id,
            label: c.name || c.id,
            countryId: c.countryId,
            schoolId: c.schoolId,
          }));
        return [...prev, ...add];
      });
      tuitionCampusNextPageRef.current =
        (Number(meta.currentPage) || tuitionCampusNextPageRef.current) + 1;
      tuitionCampusHasMoreRef.current =
        (Number(meta.currentPage) || 1) < (Number(meta.totalPages) || 1);
    } finally {
      setTuitionCampusesLoadingMore(false);
    }
  }, [form.applyingScope, form.schools, tuitionCampusesLoadingMore]);

  const loadMoreTuitionCourses = useCallback(async () => {
    const tuition =
      form.applyingScope === "tuition_only" || form.applyingScope === "tuition_mandatory";
    const campusIds = (form.campuses || []).map((c) => c.value).filter(Boolean);
    if (!tuition || campusIds.length === 0) return;
    const campusIdsKey = campusIds.sort().join(",");
    if (campusIdsKey !== tuitionCourseKeyRef.current || !tuitionCourseHasMoreRef.current) return;
    if (tuitionCoursesLoadingMore) return;
    setTuitionCoursesLoadingMore(true);
    try {
      const res = await CourseService.getAllCourses({
        campusIds,
        limit: PROMO_ENTITY_PAGE_SIZE,
        page: tuitionCourseNextPageRef.current,
      });
      const rows = res.data || [];
      const meta = res.meta || {};
      setTuitionCourseOptions((prev) => {
        const seen = new Set(prev.map((x) => x.value));
        const add = rows
          .filter((c) => !seen.has(c.id))
          .map((c) => ({
            value: c.id,
            label: c.title || c.name || c.id,
            campusId: c.campusId,
          }));
        return [...prev, ...add];
      });
      tuitionCourseNextPageRef.current =
        (Number(meta.currentPage) || tuitionCourseNextPageRef.current) + 1;
      tuitionCourseHasMoreRef.current =
        (Number(meta.currentPage) || 1) < (Number(meta.totalPages) || 1);
    } finally {
      setTuitionCoursesLoadingMore(false);
    }
  }, [form.applyingScope, form.campuses, tuitionCoursesLoadingMore]);

  const loadMoreAccCampuses = useCallback(async () => {
    if (form.applyingScope !== "accommodation" || !form.accommodationCountryFilter?.value) return;
    const countryId = form.accommodationCountryFilter.value;
    if (countryId !== accCampusCountryIdRef.current || !accCampusHasMoreRef.current) return;
    if (accCampusesLoadingMore) return;
    setAccCampusesLoadingMore(true);
    try {
      const result = await CampusService.searchAdminCampuses({
        countryIds: [countryId],
        limit: PROMO_ENTITY_PAGE_SIZE,
        page: accCampusNextPageRef.current,
      });
      const rows = result.data || [];
      const meta = result.meta || {};
      setAccCampusOptionsRemote((prev) => {
        const seen = new Set(prev.map((x) => x.value));
        const add = rows
          .filter((c) => !seen.has(c.id))
          .map((c) => ({
            value: c.id,
            label: c.name || c.id,
            countryId: c.countryId,
            schoolId: c.schoolId,
          }));
        return [...prev, ...add];
      });
      accCampusNextPageRef.current =
        (Number(meta.currentPage) || accCampusNextPageRef.current) + 1;
      accCampusHasMoreRef.current =
        (Number(meta.currentPage) || 1) < (Number(meta.totalPages) || 1);
    } finally {
      setAccCampusesLoadingMore(false);
    }
  }, [form.applyingScope, form.accommodationCountryFilter, accCampusesLoadingMore]);

  const loadMoreAccommodationSelect = useCallback(async () => {
    if (
      form.applyingScope !== "accommodation" ||
      form.accommodationGlobalAll ||
      form.accommodationAllInCampus ||
      !form.accommodationCampusFilter ||
      !form.accommodationCountryFilter
    ) {
      return;
    }
    const campus = form.accommodationCampusFilter;
    const country = form.accommodationCountryFilter;
    if (!campus?.value || !country?.value) return;
    const key = `${campus.value}-${country.value}`;
    if (key !== accSelectKeyRef.current || !accSelectHasMoreRef.current) return;
    if (accommodationSelectLoadingMore) return;
    setAccommodationSelectLoadingMore(true);
    try {
      const res = await AccommodationService.getAllAccommodations({
        campusIds: [campus.value],
        countryIds: [country.value],
        limit: PROMO_ENTITY_PAGE_SIZE,
        page: accSelectNextPageRef.current,
      });
      const rows = res.data || [];
      const meta = res.meta || {};
      const more = mapAccommodationRowsToOptions(rows);
      setAccommodationSelectOptions((prev) => {
        const seen = new Set(prev.map((x) => x.value));
        return [...prev, ...more.filter((x) => !seen.has(x.value))];
      });
      accSelectNextPageRef.current =
        (Number(meta.currentPage) || accSelectNextPageRef.current) + 1;
      accSelectHasMoreRef.current =
        (Number(meta.currentPage) || 1) < (Number(meta.totalPages) || 1);
    } finally {
      setAccommodationSelectLoadingMore(false);
    }
  }, [
    form.applyingScope,
    form.accommodationGlobalAll,
    form.accommodationAllInCampus,
    form.accommodationCampusFilter,
    form.accommodationCountryFilter,
    accommodationSelectLoadingMore,
  ]);

  const handleCancel = useCallback(() => {
    navigate("/promo-codes");
  }, [navigate]);

  const handleFinish = useCallback(async () => {
    if (isView) return;
    if (!canSubmit) return;
    setSaving(true);
    try {
      let formForSave = form;
      if (
        form.applyingScope === "accommodation" &&
        form.accommodationAllInCampus &&
        !form.accommodationGlobalAll
      ) {
        const campus = form.accommodationCampusFilter;
        const country = form.accommodationCountryFilter;
        if (campus?.value && country?.value) {
          const rows = await fetchAllAccommodationsPaged({
            campusIds: [campus.value],
            countryIds: [country.value],
          });
          const opts = mapAccommodationRowsToOptions(rows);
          formForSave = { ...form, selectedAccommodations: opts };
        }
        if (!formForSave.selectedAccommodations?.length) {
          Swal.fire({
            icon: "warning",
            title: "No accommodations",
            text: "No accommodation was found for the selected location.",
            confirmButtonColor: "#6D4AFF",
          });
          return;
        }
      }

      if (isEdit) {
        const payload = formToUpdatePayload(formForSave);
        await PromoCodeService.updatePromoCode(id, payload);
        clearPromoListPageCache();
        Swal.fire({
          icon: "success",
          title: "Promo code updated",
          confirmButtonColor: "#6D4AFF",
        }).then(() => navigate("/promo-codes"));
      } else {
        await PromoCodeService.createPromoCode(formToCreatePayload(formForSave));
        clearPromoListPageCache();
        Swal.fire({
          icon: "success",
          title: "Promo code created",
          confirmButtonColor: "#6D4AFF",
        }).then(() => navigate("/promo-codes"));
      }
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: isEdit ? "Could not save" : "Could not create",
        text: e.message || "Unknown error",
        confirmButtonColor: "#6D4AFF",
      });
    } finally {
      setSaving(false);
    }
  }, [canSubmit, form, id, isEdit, isView, navigate]);

  return {
    isEdit,
    isView,
    loading,
    saving,
    form,
    onInputChange,
    countryOptions: masterOptions.countryOptions,
    schoolOptions,
    programOptions,
    campusOptions,
    accommodationCampusOptions,
    accommodationSelectOptions,
    accommodationSelectLoading,
    accommodationBulkLoading,
    tuitionCoursesLoading,
    tuitionSchoolsLoading,
    tuitionCampusesLoading,
    accCampusesLoading,
    dateError,
    canSubmit: canSubmit && !saving,
    handleCancel,
    handleFinish,
    fetchTuitionSchoolsCatalog,
    fetchTuitionCampusesCatalog,
    fetchTuitionCoursesCatalog,
    countryLoadingMore,
    tuitionSchoolsLoadingMore,
    tuitionCampusesLoadingMore,
    tuitionCoursesLoadingMore,
    accCampusesLoadingMore,
    accommodationSelectLoadingMore,
    loadMoreCountries,
    loadMoreTuitionSchools,
    loadMoreTuitionCampuses,
    loadMoreTuitionCourses,
    loadMoreAccCampuses,
    loadMoreAccommodationSelect,
  };
}
