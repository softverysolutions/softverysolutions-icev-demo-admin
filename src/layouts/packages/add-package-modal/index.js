import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Divider,
  CircularProgress,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  IconButton,
} from "@mui/material";
import Icon from "@mui/material/Icon";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";
import SoftEditor from "components/SoftEditor";

import { API_BASE_URL } from "config/api";
import { PackageService } from "services/packageService";
import {
  PackageImportantInformationService,
  PACKAGE_IMPORTANT_INFO_CATEGORY,
} from "services/packageImportantInformationService";
import { SchoolService } from "services/schoolService";
import { CampusService } from "services/campusService";
import { CourseService } from "services/courseService";
import { useModalLoadingState } from "hooks/useModalLoadingState";
import { formatDateToUTC } from "utils/dateUtils";

import { INITIAL_FORM_DATA } from "./constants";
import CourseSelectionSection from "./components/CourseSelectionSection";
import DatesSection from "./components/DatesSection";
import DiscountSection from "./components/DiscountSection";
import PackageGallerySection from "./components/PackageGallerySection";
import ImportantInformationSection from "./components/ImportantInformationSection";
import PackageExperiencesSection, {
  mapPackageExperiencesToFormState,
} from "./components/PackageExperiencesSection";
import SelectMenuListWithScroll from "./components/SelectMenuListWithScroll";

const normalizeTextListField = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        return String(item.text || item.value || item.label || item.title || "").trim();
      }
      return "";
    })
    .filter(Boolean);
};

const normalizeWhatsIncluded = (value) => normalizeTextListField(value);

function extractImportantInformationFromPackage(pkg) {
  const raw = pkg?.importantInformation || pkg?.important_information || null;
  const whatToBring =
    pkg?.whatToBring ??
    raw?.whatToBring ??
    raw?.what_to_bring ??
    pkg?.importantWhatToBring ??
    [];
  const notAllowed =
    pkg?.notAllowed ?? raw?.notAllowed ?? raw?.not_allowed ?? pkg?.importantNotAllowed ?? [];
  const goodToKnow =
    pkg?.goodToKnow ?? raw?.goodToKnow ?? raw?.good_to_know ?? pkg?.importantGoodToKnow ?? [];
  return {
    whatToBring: normalizeTextListField(whatToBring),
    notAllowed: normalizeTextListField(notAllowed),
    goodToKnow: normalizeTextListField(goodToKnow),
  };
}

function collectPackageImageRows(packageData) {
  if (!packageData || typeof packageData !== "object") return [];
  let rows = [];
  if (Array.isArray(packageData.images) && packageData.images.length > 0) {
    rows = [...packageData.images];
  } else {
    if (Array.isArray(packageData.mainImages) && packageData.mainImages.length > 0) {
      rows = rows.concat(packageData.mainImages);
    }
    if (Array.isArray(packageData.mediaImages) && packageData.mediaImages.length > 0) {
      rows = rows.concat(packageData.mediaImages);
    }
  }
  rows.sort((a, b) => Number(a?.order ?? 0) - Number(b?.order ?? 0));
  return rows;
}

function mapPackageImagesToGalleryState(packageData) {
  const rawImages = collectPackageImageRows(packageData);
  if (rawImages.length === 0) return [];
  return rawImages
    .map((img, i) => {
      const url = (img && (img.imageUrl || img.url || "")).trim();
      if (!url) return null;
      return {
        id: img.id != null ? String(img.id) : `saved-${i}-${url.slice(-24)}`,
        imageUrl: url,
      };
    })
    .filter(Boolean);
}

const normalizePositiveIntegerInput = (raw) => {
  const digitsOnly = String(raw ?? "").replace(/\D/g, "");
  return digitsOnly.replace(/^0+(?=\d)/, "");
};

const normalizeLongDescriptionHtml = (value) => {
  const html = String(value ?? "").trim();
  if (!html) return "";
  const textOnly = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/gi, " ").trim();
  if (!textOnly) return "";
  return html;
};

const PACKAGE_SCHOOL_PAGE_SIZE = 20;
const PACKAGE_CAMPUS_COURSE_PAGE_SIZE = 20;
const PACKAGE_ACCOMMODATION_PAGE_SIZE = 20;
const PACKAGE_SELECT_MAX_MENU_HEIGHT = 360;

function SortableIncludedItem({ id, disabled, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.92 : 1,
  };

  return children({ setNodeRef, attributes, listeners, style, isDragging });
}

SortableIncludedItem.propTypes = {
  id: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  children: PropTypes.func.isRequired,
};

SortableIncludedItem.defaultProps = {
  disabled: false,
};

function extractArrayPayload(result, candidateKeys) {
  if (result == null) return [];
  if (Array.isArray(result)) return result;
  for (const key of candidateKeys) {
    const v = result[key];
    if (Array.isArray(v)) return v;
    if (v && typeof v === "object") {
      if (Array.isArray(v.items)) return v.items;
      if (Array.isArray(v.data)) return v.data;
      if (Array.isArray(v.results)) return v.results;
    }
  }
  return [];
}

function extractListMeta(result) {
  if (!result || typeof result !== "object") return {};
  const raw = result.meta || result.pagination || {};
  const cur = Number(raw.currentPage ?? raw.current_page ?? raw.page);
  const total = Number(raw.totalPages ?? raw.total_pages ?? raw.last_page);
  const hasNext = raw.hasNextPage ?? raw.has_next_page ?? raw.has_next;
  return {
    ...raw,
    currentPage: Number.isFinite(cur) ? cur : undefined,
    totalPages: Number.isFinite(total) ? total : undefined,
    hasNextPage: hasNext,
  };
}

function computeHasMoreFromMeta(meta, requestedPage, rowCount, pageSize) {
  const curPage = Number.isFinite(Number(meta?.currentPage))
    ? Number(meta.currentPage)
    : requestedPage;
  const totalP = Number(meta?.totalPages);
  const explicit = meta?.hasNextPage;

  if (explicit === true) return true;
  if (explicit === false) return false;
  if (Number.isFinite(totalP) && totalP > 0) return curPage < totalP;
  return rowCount >= pageSize;
}

const mapAccommodationToSelectOption = (acc) => ({
  value: acc.id,
  label: `${acc.name} - ${acc.type || ""}`,
});

const getPackageAccommodationExtras = (pkg) => {
  const extras = [];
  if (pkg?.accommodation) extras.push(pkg.accommodation);
  const secondaryList = pkg?.secondaryAccommodations;
  if (Array.isArray(secondaryList)) {
    secondaryList.forEach((item) => {
      if (item?.accommodation) extras.push(item.accommodation);
    });
  }
  return extras;
};

const getSecondaryAccommodationIdsFromPackage = (pkg) => {
  const secondaryList = pkg?.secondaryAccommodations;
  if (!Array.isArray(secondaryList) || secondaryList.length === 0) return [];
  return secondaryList
    .map((item) => item?.accommodationId || item?.accommodation?.id)
    .filter(Boolean);
};

const getAccommodationCampusIds = (acc) => {
  if (!acc || typeof acc !== "object") return [];
  if (Array.isArray(acc.campusIds) && acc.campusIds.length > 0) {
    return acc.campusIds.filter(Boolean);
  }
  if (Array.isArray(acc.campuses)) {
    return acc.campuses
      .map((c) => c?.campusId || c?.id || c?.campus?.id)
      .filter(Boolean);
  }
  return [];
};

const filterAccommodationsByCampus = (rows, campusId) => {
  if (!campusId) return rows || [];
  return (rows || []).filter((acc) => {
    const campusIds = getAccommodationCampusIds(acc);
    if (campusIds.length === 0) return true;
    return campusIds.includes(campusId);
  });
};

const buildAccommodationSelectOptions = (rows, extraAccommodations = []) => {
  const byId = new Map();
  (rows || []).forEach((acc) => {
    if (!acc?.id) return;
    byId.set(acc.id, mapAccommodationToSelectOption(acc));
  });
  extraAccommodations.forEach((acc) => {
    if (!acc?.id || byId.has(acc.id)) return;
    byId.set(acc.id, mapAccommodationToSelectOption(acc));
  });
  return Array.from(byId.values()).sort((a, b) => a.label.localeCompare(b.label));
};

function PackageModal({ open, onClose, mode = "add", packageData = null, onSuccess }) {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "info" });
  
  const [schools, setSchools] = useState([]);
  const [schoolsLoadingMore, setSchoolsLoadingMore] = useState(false);
  const [campusesLoadingMore, setCampusesLoadingMore] = useState(false);
  const [coursesLoadingMore, setCoursesLoadingMore] = useState(false);
  const [campuses, setCampuses] = useState([]);
  const [courses, setCourses] = useState([]);
  const [accommodations, setAccommodations] = useState([]);
  const [accommodationsLoadingMore, setAccommodationsLoadingMore] = useState(false);
  const [services, setServices] = useState([]);
  const [importantInfoOptions, setImportantInfoOptions] = useState({
    whatToBring: [],
    notAllowed: [],
    goodToKnow: [],
  });

  const servicesLoadedFromPackageRef = useRef(false);
  const registeredImportantOptionsRef = useRef(new Set());
  const isInitializingRef = useRef(false);
  const packageCourseHydratedRef = useRef(false);
  const campusSelectionTouchedRef = useRef(false);
  const schoolListSearchRef = useRef("");
  const schoolListNextPageRef = useRef(1);
  const schoolListHasMoreRef = useRef(false);
  const schoolFetchGenRef = useRef(0);
  const schoolListLoadingMoreRef = useRef(false);

  const campusListNextPageRef = useRef(1);
  const campusListHasMoreRef = useRef(false);
  const campusFetchGenRef = useRef(0);
  const campusListLoadingMoreRef = useRef(false);
  const campusListSchoolIdRef = useRef(null);

  const courseListNextPageRef = useRef(1);
  const courseListHasMoreRef = useRef(false);
  const courseFetchGenRef = useRef(0);
  const courseListLoadingMoreRef = useRef(false);
  const courseListCampusIdRef = useRef(null);

  const accommodationListNextPageRef = useRef(1);
  const accommodationListHasMoreRef = useRef(false);
  const accommodationFetchGenRef = useRef(0);
  const accommodationListLoadingMoreRef = useRef(false);
  const accommodationListCampusIdRef = useRef(null);

  const {
    isInitializing,
    canSave,
    canEdit,
    setLoading,
    setInitializing,
    isLoading,
    getSaveButtonText,
    getSelectPlaceholder,
    resetLoadingStates,
  } = useModalLoadingState(["schools", "campuses", "courses", "accommodations", "services"]);

  const isViewMode = mode === "view";

  const fetchPackageSchoolsPage = useCallback(async (search, page) => {
    const request = {
      search: search || "",
      limit: PACKAGE_SCHOOL_PAGE_SIZE,
      page,
    };
    const result = await SchoolService.getSchools(request);
    const rows = extractArrayPayload(result, ["data", "schools", "items", "results"]);
    const meta = extractListMeta(result);
    const mapped = rows.map((s) => ({
      value: s.id,
      label: s.name || s.id,
    }));
    return { mapped, meta };
  }, []);

  const applySchoolListMeta = useCallback((meta, requestedPage, rowCount = 0) => {
    const curPage = Number.isFinite(Number(meta?.currentPage))
      ? Number(meta.currentPage)
      : requestedPage;
    schoolListNextPageRef.current = curPage + 1;
    const hasMore = computeHasMoreFromMeta(
      meta,
      requestedPage,
      rowCount,
      PACKAGE_SCHOOL_PAGE_SIZE
    );
    schoolListHasMoreRef.current = hasMore;
  }, []);

  const loadSchools = async (ensureOption = null) => {
    schoolListSearchRef.current = "";
    setLoading("schools", true);
    const gen = ++schoolFetchGenRef.current;
    try {
      const { mapped, meta } = await fetchPackageSchoolsPage("", 1);
      if (gen !== schoolFetchGenRef.current) {
        return;
      }
      setSchools(mapped);
      applySchoolListMeta(meta, 1, mapped.length);
      if (ensureOption?.value) {
        setSchools((prev) => {
          if (prev.some((o) => o.value === ensureOption.value)) return prev;
          return [ensureOption, ...prev];
        });
      }
    } catch (error) {
      console.error("Error loading schools:", error);
      if (gen === schoolFetchGenRef.current) {
        setSchools([]);
        schoolListHasMoreRef.current = false;
      }
    } finally {
      if (gen === schoolFetchGenRef.current) {
        setLoading("schools", false);
      }
    }
  };

  const loadSchoolsForSearchInput = async (inputValue) => {
    schoolListSearchRef.current = inputValue;
    setLoading("schools", true);
    const gen = ++schoolFetchGenRef.current;
    try {
      const { mapped, meta } = await fetchPackageSchoolsPage(inputValue, 1);
      if (gen !== schoolFetchGenRef.current) {
        return;
      }
      setSchools(mapped);
      applySchoolListMeta(meta, 1, mapped.length);
    } catch (error) {
      console.error("Error loading schools:", error);
      if (gen === schoolFetchGenRef.current) {
        setSchools([]);
        schoolListHasMoreRef.current = false;
      }
    } finally {
      if (gen === schoolFetchGenRef.current) {
        setLoading("schools", false);
      }
    }
  };

  const handlePackageSchoolInputChange = (inputValue, { action }) => {
    if (action !== "input-change") return;
    loadSchoolsForSearchInput(inputValue);
  };

  const loadMorePackageSchools = useCallback(async () => {
    if (!schoolListHasMoreRef.current) {
      return;
    }
    if (schoolListLoadingMoreRef.current) {
      return;
    }
    if (isLoading("schools")) {
      return;
    }
    const genAtStart = schoolFetchGenRef.current;
    const search = schoolListSearchRef.current;
    const page = schoolListNextPageRef.current;
    schoolListLoadingMoreRef.current = true;
    setSchoolsLoadingMore(true);
    try {
      const { mapped, meta } = await fetchPackageSchoolsPage(search, page);
      if (genAtStart !== schoolFetchGenRef.current) {
        return;
      }
      setSchools((prev) => {
        const seen = new Set(prev.map((o) => o.value));
        const add = mapped.filter((o) => !seen.has(o.value));
        return [...prev, ...add];
      });
      applySchoolListMeta(meta, page, mapped.length);
    } catch (error) {
      console.error("Error loading more schools:", error);
    } finally {
      schoolListLoadingMoreRef.current = false;
      setSchoolsLoadingMore(false);
    }
  }, [fetchPackageSchoolsPage, applySchoolListMeta, isLoading]);

  const fetchPackageCampusesPage = useCallback(async (schoolId, page) => {
    const token = await CampusService.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/admin/campuses/search`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        search: "",
        page,
        limit: PACKAGE_CAMPUS_COURSE_PAGE_SIZE,
        sortBy: "name",
        sortDirection: "asc",
        filters: {
          schoolIds: [schoolId],
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch campuses: ${response.status}`);
    }

    const result = await response.json();
    const rows = extractArrayPayload(result, ["data", "campuses", "items", "results"]);
    const meta = extractListMeta(result);
    const mapped = rows.map((campus) => ({
      value: campus.id,
      label: campus.city?.name ? `${campus.name} - ${campus.city.name}` : campus.name,
      schoolId: campus.schoolId,
    }));
    return { mapped, meta };
  }, []);

  const applyCampusListMeta = useCallback((meta, requestedPage, rowCount = 0) => {
    const curPage = Number.isFinite(Number(meta?.currentPage))
      ? Number(meta.currentPage)
      : requestedPage;
    campusListNextPageRef.current = curPage + 1;
    const hasMore = computeHasMoreFromMeta(
      meta,
      requestedPage,
      rowCount,
      PACKAGE_CAMPUS_COURSE_PAGE_SIZE
    );
    campusListHasMoreRef.current = hasMore;
  }, []);

  const fetchPackageCoursesPage = useCallback(async (campusId, page) => {
    const response = await CourseService.getAllCourses({
      campusIds: [campusId],
      page,
      limit: PACKAGE_CAMPUS_COURSE_PAGE_SIZE,
      sortBy: "name",
      sortDirection: "asc",
    });
    const rows = extractArrayPayload(response, ["data", "courses", "items", "results"]);
    const meta = extractListMeta(response);
    const mapped = rows.map((course) => ({
      value: course.id,
      label: course.name,
      campusId: course.campusId,
      periodicity: course.periodicity,
    }));
    return { mapped, meta };
  }, []);

  const applyCourseListMeta = useCallback((meta, requestedPage, rowCount = 0) => {
    const curPage = Number.isFinite(Number(meta?.currentPage))
      ? Number(meta.currentPage)
      : requestedPage;
    courseListNextPageRef.current = curPage + 1;
    const hasMore = computeHasMoreFromMeta(
      meta,
      requestedPage,
      rowCount,
      PACKAGE_CAMPUS_COURSE_PAGE_SIZE
    );
    courseListHasMoreRef.current = hasMore;
  }, []);

  const loadCampuses = async (schoolId, ensureOption = null) => {
    campusListSchoolIdRef.current = schoolId;
    if (!schoolId) {
      campusFetchGenRef.current += 1;
      setCampuses([]);
      campusListHasMoreRef.current = false;
      return;
    }
    const gen = ++campusFetchGenRef.current;
    setLoading("campuses", true);
    try {
      const { mapped, meta } = await fetchPackageCampusesPage(schoolId, 1);
      if (gen !== campusFetchGenRef.current) {
        return;
      }
      let list = mapped;
      if (ensureOption?.value && !mapped.some((o) => o.value === ensureOption.value)) {
        list = [ensureOption, ...mapped];
      }
      setCampuses(list);
      applyCampusListMeta(meta, 1, mapped.length);
    } catch (error) {
      console.error("Error loading campuses:", error);
      if (gen === campusFetchGenRef.current) {
        setCampuses([]);
        campusListHasMoreRef.current = false;
      }
    } finally {
      if (gen === campusFetchGenRef.current) {
        setLoading("campuses", false);
      }
    }
  };

  const loadMorePackageCampuses = useCallback(async () => {
    if (!campusListHasMoreRef.current) {
      return;
    }
    if (campusListLoadingMoreRef.current) {
      return;
    }
    if (isLoading("campuses")) {
      return;
    }
    const schoolId = campusListSchoolIdRef.current;
    if (!schoolId) {
      return;
    }
    const genAtStart = campusFetchGenRef.current;
    const page = campusListNextPageRef.current;
    campusListLoadingMoreRef.current = true;
    setCampusesLoadingMore(true);
    try {
      const { mapped, meta } = await fetchPackageCampusesPage(schoolId, page);
      if (genAtStart !== campusFetchGenRef.current) {
        return;
      }
      setCampuses((prev) => {
        const seen = new Set(prev.map((o) => o.value));
        const add = mapped.filter((o) => !seen.has(o.value));
        return [...prev, ...add];
      });
      applyCampusListMeta(meta, page, mapped.length);
    } catch (error) {
      console.error("Error loading more campuses:", error);
    } finally {
      campusListLoadingMoreRef.current = false;
      setCampusesLoadingMore(false);
    }
  }, [fetchPackageCampusesPage, applyCampusListMeta, isLoading]);

  const loadCourses = async (campusId, ensureOption = null) => {
    courseListCampusIdRef.current = campusId;
    if (!campusId) {
      courseFetchGenRef.current += 1;
      setCourses([]);
      courseListHasMoreRef.current = false;
      return;
    }
    const gen = ++courseFetchGenRef.current;
    setLoading("courses", true);
    try {
      const { mapped, meta } = await fetchPackageCoursesPage(campusId, 1);
      if (gen !== courseFetchGenRef.current) {
        return;
      }
      let list = mapped;
      if (ensureOption?.value && !mapped.some((o) => o.value === ensureOption.value)) {
        list = [ensureOption, ...mapped];
      }
      setCourses(list);
      applyCourseListMeta(meta, 1, mapped.length);
    } catch (error) {
      console.error("Error loading courses:", error);
      if (gen === courseFetchGenRef.current) {
        setCourses([]);
        courseListHasMoreRef.current = false;
      }
    } finally {
      if (gen === courseFetchGenRef.current) {
        setLoading("courses", false);
      }
    }
  };

  const loadMorePackageCourses = useCallback(async () => {
    if (!courseListHasMoreRef.current) {
      return;
    }
    if (courseListLoadingMoreRef.current) {
      return;
    }
    if (isLoading("courses")) {
      return;
    }
    const campusId = courseListCampusIdRef.current;
    if (!campusId) {
      return;
    }
    const genAtStart = courseFetchGenRef.current;
    const page = courseListNextPageRef.current;
    courseListLoadingMoreRef.current = true;
    setCoursesLoadingMore(true);
    try {
      const { mapped, meta } = await fetchPackageCoursesPage(campusId, page);
      if (genAtStart !== courseFetchGenRef.current) {
        return;
      }
      setCourses((prev) => {
        const seen = new Set(prev.map((o) => o.value));
        const add = mapped.filter((o) => !seen.has(o.value));
        return [...prev, ...add];
      });
      applyCourseListMeta(meta, page, mapped.length);
    } catch (error) {
      console.error("Error loading more courses:", error);
    } finally {
      courseListLoadingMoreRef.current = false;
      setCoursesLoadingMore(false);
    }
  }, [fetchPackageCoursesPage, applyCourseListMeta, isLoading]);

  const handleSchoolMenuScrollToBottom = useCallback(() => {
    loadMorePackageSchools();
  }, [loadMorePackageSchools]);

  const handleCampusMenuScrollToBottom = useCallback(() => {
    loadMorePackageCampuses();
  }, [loadMorePackageCampuses]);

  const handleCourseMenuScrollToBottom = useCallback(() => {
    loadMorePackageCourses();
  }, [loadMorePackageCourses]);

  const fetchPackageAccommodationsPage = useCallback(async (campusId, page) => {
    const { AccommodationService } = await import("services/accommodationService");
    const searchFilters = {
      page,
      limit: PACKAGE_ACCOMMODATION_PAGE_SIZE,
      sortBy: "name",
      sortDirection: "asc",
    };
    if (campusId) {
      searchFilters.campusIds = [campusId];
    }
    const result = await AccommodationService.getAllAccommodations(searchFilters);
    const rows = extractArrayPayload(result, ["data", "accommodations", "items", "results"]);
    const meta = extractListMeta(result);
    const activeOnly = rows.filter((acc) => acc.isActive !== false);
    const activeRows = campusId ? filterAccommodationsByCampus(activeOnly, campusId) : activeOnly;
    return { activeRows, meta, rowCount: activeRows.length };
  }, []);

  const applyAccommodationListMeta = useCallback((meta, requestedPage, rowCount = 0) => {
    const curPage = Number.isFinite(Number(meta?.currentPage))
      ? Number(meta.currentPage)
      : requestedPage;
    accommodationListNextPageRef.current = curPage + 1;
    const hasMore = computeHasMoreFromMeta(
      meta,
      requestedPage,
      rowCount,
      PACKAGE_ACCOMMODATION_PAGE_SIZE
    );
    accommodationListHasMoreRef.current = hasMore;
  }, []);

  const loadAccommodations = async (campusId, extraAccommodations = []) => {
    accommodationListCampusIdRef.current = campusId || null;
    const gen = ++accommodationFetchGenRef.current;
    accommodationListNextPageRef.current = 1;
    accommodationListHasMoreRef.current = false;
    setAccommodations([]);
    setLoading("accommodations", true);
    try {
      const { activeRows, meta, rowCount } = await fetchPackageAccommodationsPage(campusId || null, 1);
      if (gen !== accommodationFetchGenRef.current) {
        return;
      }
      setAccommodations(buildAccommodationSelectOptions(activeRows, extraAccommodations));
      applyAccommodationListMeta(meta, 1, rowCount);
    } catch (error) {
      console.error("Error loading accommodations:", error);
      if (gen === accommodationFetchGenRef.current) {
        setAccommodations([]);
        accommodationListHasMoreRef.current = false;
      }
    } finally {
      if (gen === accommodationFetchGenRef.current) {
        setLoading("accommodations", false);
      }
    }
  };

  const loadMorePackageAccommodations = useCallback(async () => {
    if (!accommodationListHasMoreRef.current) {
      return;
    }
    if (accommodationListLoadingMoreRef.current) {
      return;
    }
    if (isLoading("accommodations")) {
      return;
    }
    const campusId = accommodationListCampusIdRef.current;
    const genAtStart = accommodationFetchGenRef.current;
    const page = accommodationListNextPageRef.current;
    accommodationListLoadingMoreRef.current = true;
    setAccommodationsLoadingMore(true);
    try {
      const { activeRows, meta, rowCount } = await fetchPackageAccommodationsPage(
        campusId || null,
        page
      );
      if (genAtStart !== accommodationFetchGenRef.current) {
        return;
      }
      const mapped = activeRows.map(mapAccommodationToSelectOption);
      setAccommodations((prev) => {
        const seen = new Set(prev.map((o) => o.value));
        const add = mapped.filter((o) => !seen.has(o.value));
        return [...prev, ...add].sort((a, b) => a.label.localeCompare(b.label));
      });
      applyAccommodationListMeta(meta, page, rowCount);
    } catch (error) {
      console.error("Error loading more accommodations:", error);
    } finally {
      accommodationListLoadingMoreRef.current = false;
      setAccommodationsLoadingMore(false);
    }
  }, [fetchPackageAccommodationsPage, applyAccommodationListMeta, isLoading]);

  const handleAccommodationMenuScrollToBottom = useCallback(() => {
    loadMorePackageAccommodations();
  }, [loadMorePackageAccommodations]);

  const loadServices = async (courseId = null) => {
    setLoading("services", true);
    try {
      let serviceOptions = [];
      
      if (courseId) {

        try {
          const { CourseService } = await import("services/courseService");
          const courseData = await CourseService.getCourseById(courseId);
          
          const courseServiceIds = new Set();
          if (courseData.services && courseData.services.length > 0) {
            courseData.services.forEach((cs) => {
              const serviceId = cs.service?.id || cs.serviceId;
              if (serviceId) {
                courseServiceIds.add(serviceId);
              }
            });
          }
          
          if (courseServiceIds.size > 0) {
            const { ServiceService } = await import("services/serviceService");
            const allServices = await ServiceService.getAllServices();
            const courseServices = allServices.filter((service) =>
              courseServiceIds.has(service.id)
            );
            serviceOptions = courseServices.map((service) => ({
              value: service.id,
              label: service.name,
            }));
          }
        } catch (error) {
          console.error("Error loading course services:", error);
          const { ServiceService } = await import("services/serviceService");
          const servicesData = await ServiceService.getAllServices();
          serviceOptions = (servicesData || []).map((service) => ({
            value: service.id,
            label: service.name,
          }));
        }
      } else {
        const { ServiceService } = await import("services/serviceService");
        const servicesData = await ServiceService.getAllServices();
        serviceOptions = (servicesData || []).map((service) => ({
          value: service.id,
          label: service.name,
        }));
      }
      
      setServices(serviceOptions);
    } catch (error) {
      console.error("Error loading services:", error);
      setServices([]);
    } finally {
      setLoading("services", false);
    }
  };

  useEffect(() => {
    const initializeModal = async () => {
      if (open) {
        setInitializing(true);
        isInitializingRef.current = true;
        servicesLoadedFromPackageRef.current = false;
        packageCourseHydratedRef.current = false;
        campusSelectionTouchedRef.current = false;
        try {
          registeredImportantOptionsRef.current = new Set();
          const loadImportantCatalog = async () => {
            try {
              const [w, n, g] = await Promise.all([
                PackageImportantInformationService.listOptions(
                  PACKAGE_IMPORTANT_INFO_CATEGORY.WHAT_TO_BRING
                ),
                PackageImportantInformationService.listOptions(
                  PACKAGE_IMPORTANT_INFO_CATEGORY.NOT_ALLOWED
                ),
                PackageImportantInformationService.listOptions(
                  PACKAGE_IMPORTANT_INFO_CATEGORY.GOOD_TO_KNOW
                ),
              ]);
              setImportantInfoOptions({
                whatToBring: Array.isArray(w) ? w : [],
                notAllowed: Array.isArray(n) ? n : [],
                goodToKnow: Array.isArray(g) ? g : [],
              });
            } catch (catalogError) {
              console.warn("Important information options unavailable:", catalogError);
              setImportantInfoOptions({ whatToBring: [], notAllowed: [], goodToKnow: [] });
            }
          };
          await loadImportantCatalog();

          if (mode === "add") {
            await Promise.all([loadSchools(), loadServices(null)]);
            setFormData(INITIAL_FORM_DATA);
            setErrors({});
          } else if (packageData) {
            const course = packageData.course;
            const campus = course?.campus;
            const school = campus?.school;
            const courseId = packageData.courseId || course?.id || null;
            const schoolId = campus?.schoolId || school?.id;
            
            if (mode === "view") {
              if (schoolId && school) {
                setSchools([{ value: schoolId, label: school.name }]);
              }
              if (campus) {
                setCampuses([{ 
                  value: campus.id, 
                  label: `${campus.name} - ${campus.city?.name || ""}`,
                  schoolId: schoolId
                }]);
              }
              if (course) {
                setCourses([{ 
                  value: course.id, 
                  label: course.name,
                  campusId: course.campusId || campus?.id
                }]);
              }
              
              let serviceOptions = [];
              if (course?.courseServices && course.courseServices.length > 0) {
                serviceOptions = course.courseServices
                  .map((cs) => cs.service)
                  .filter(Boolean)
                  .map((s) => ({
                    value: s.id,
                    label: s.name || "Unknown extra",
                  }));
                const uniqueServices = serviceOptions.filter(
                  (s, index, self) => index === self.findIndex((t) => t.value === s.value)
                );
                serviceOptions = uniqueServices;
              }
              if (serviceOptions.length === 0 && courseId) {
                await loadServices(courseId);
              } else {
                setServices(serviceOptions);
              }
              servicesLoadedFromPackageRef.current = true;
              
            } else {
              const selectedSchoolOption =
                schoolId && school ? { value: schoolId, label: school.name } : null;
              await loadSchools(selectedSchoolOption);

              let serviceOptions = [];
              if (course?.courseServices && course.courseServices.length > 0) {
                serviceOptions = course.courseServices
                  .map((cs) => cs.service)
                  .filter(Boolean)
                  .map((s) => ({
                    value: s.id,
                    label: s.name || "Unknown extra",
                  }));
                const uniqueServices = serviceOptions.filter(
                  (s, index, self) => index === self.findIndex((t) => t.value === s.value)
                );
                serviceOptions = uniqueServices;
              }
              if (serviceOptions.length > 0) {
                setServices(serviceOptions);
              } else if (courseId) {
                await loadServices(courseId);
              }
              servicesLoadedFromPackageRef.current = true;
              
            }

            const mappedData = {
              name: packageData.name || "",
              isActive: packageData.isActive !== undefined ? packageData.isActive : true,
              description: packageData.description || "",
              longDescription:
                packageData.longDescription || packageData.long_description || "",
              whatsIncluded: normalizeWhatsIncluded(
                packageData.includedItems ||
                  packageData.included_items ||
                  packageData.whatsIncluded ||
                  packageData.whats_included ||
                  []
              ),
              notIncludedItems: normalizeTextListField(
                packageData.notIncludedItems ||
                  packageData.not_included_items ||
                  packageData.excludedItems ||
                  packageData.excluded_items ||
                  []
              ),
              importantInformation: extractImportantInformationFromPackage(packageData),
              courseId: courseId,
              accommodationId: packageData.accommodationId || packageData.accommodation?.id || null,
              secondaryAccommodationIds: getSecondaryAccommodationIdsFromPackage(packageData),
              discountValue: packageData.discountValue || "",
              discountType: packageData.discountType || "fixed",
              dates: packageData.dates?.length > 0 
                ? packageData.dates.map(d => ({
                    startDate: d.startDate ? d.startDate.split("T")[0] : "",
                    duration: d.duration || "",
                    accommodationDuration: d.accommodationDuration ?? d.accommodation_duration ?? "",
                    tag: d.tag || "",
                    color: d.color || "navy",
                  }))
                : [{ startDate: "", duration: "", accommodationDuration: "", tag: "", color: "navy" }],
              images: mapPackageImagesToGalleryState(packageData),
              serviceIds: (() => {
                if (!Array.isArray(packageData.services)) return [];
                return packageData.services.map(s => s.id || s.service?.id).filter(Boolean);
              })(),
              selectedExperiences: mapPackageExperiencesToFormState(packageData),
              selectedSchool: (schoolId && school) ? { value: schoolId, label: school.name } : null,
              selectedCampus: campus ? { 
                value: campus.id, 
                label: `${campus.name} - ${campus.city?.name || ""}` 
              } : null,
            };

            setFormData(mappedData);
            setErrors({});

            if (mode === "edit" && campus?.id) {
              await loadAccommodations(campus.id, getPackageAccommodationExtras(packageData));
              packageCourseHydratedRef.current = true;
            }
          }
        } catch (error) {
          console.error("Error initializing modal:", error);
        } finally {
          setInitializing(false);
          isInitializingRef.current = false;
        }
      } else {
        resetLoadingStates();
        servicesLoadedFromPackageRef.current = false;
        packageCourseHydratedRef.current = false;
        campusSelectionTouchedRef.current = false;
      }
    };
    initializeModal();
  }, [open, mode, packageData]);

  useEffect(() => {
    if (mode !== "edit" || isInitializingRef.current || !packageData || !open) return;
    if (packageCourseHydratedRef.current || campusSelectionTouchedRef.current) return;

    const course = packageData.course;
    const campus = course?.campus;

    if (campus && campuses.length > 0 && !formData.selectedCampus?.value) {
      const campusOption = campuses.find((c) => c.value === campus.id);
      if (campusOption) {
        setFormData((prev) => ({
          ...prev,
          selectedCampus: campusOption,
        }));
      }
    }

    if (course && courses.length > 0 && !formData.courseId) {
      const courseOption = courses.find((c) => c.value === course.id);
      if (courseOption) {
        setFormData((prev) => ({
          ...prev,
          courseId: course.id,
        }));
      }
    }

    const packageCampusId = packageData.course?.campusId || packageData.course?.campus?.id;
    const hasCampus =
      formData.selectedCampus?.value === packageCampusId ||
      campuses.some((c) => c.value === formData.selectedCampus?.value);
    if (hasCampus && (formData.courseId || !course)) {
      packageCourseHydratedRef.current = true;
    }
  }, [
    mode,
    packageData,
    campuses,
    courses,
    open,
    formData.selectedCampus?.value,
    formData.courseId,
  ]);

  useEffect(() => {
    if (mode === "view") return;
    if (isInitializing) return;

    if (formData.selectedSchool?.value) {
      const ensureCampus =
        mode === "edit" &&
        !campusSelectionTouchedRef.current &&
        packageData?.course?.campus &&
        (packageData.course.campus.schoolId === formData.selectedSchool.value ||
          packageData.course.campus.school?.id === formData.selectedSchool.value)
          ? {
              value: packageData.course.campus.id,
              label: `${packageData.course.campus.name} - ${packageData.course.campus.city?.name || ""}`,
              schoolId: formData.selectedSchool.value,
            }
          : null;
      loadCampuses(formData.selectedSchool.value, ensureCampus);
      const isInitialEditLoad =
        mode === "edit" &&
        packageData &&
        (packageData.course?.campus?.schoolId === formData.selectedSchool?.value ||
          packageData.course?.campus?.school?.id === formData.selectedSchool?.value);
      if (!isInitialEditLoad) {
        campusSelectionTouchedRef.current = true;
        packageCourseHydratedRef.current = true;
        setFormData((prev) => ({
          ...prev,
          selectedCampus: null,
          courseId: null,
          accommodationId: null,
          secondaryAccommodationIds: [],
        }));
        loadAccommodations(null, []);
      }
    } else {
      campusFetchGenRef.current += 1;
      accommodationFetchGenRef.current += 1;
      setAccommodations([]);
      accommodationListHasMoreRef.current = false;
      accommodationListNextPageRef.current = 1;
      setCampuses([]);
      campusListHasMoreRef.current = false;
    }
  }, [formData.selectedSchool?.value, mode, packageData, isInitializing]);

  useEffect(() => {
    if (mode === "view") return;
    if (isInitializing) return;

    if (formData.selectedCampus?.value) {
      const campusId = formData.selectedCampus.value;
      const packageCampusId = packageData?.course?.campusId || packageData?.course?.campus?.id;
      const ensureCourse =
        mode === "edit" &&
        !campusSelectionTouchedRef.current &&
        packageData?.course &&
        packageCampusId === campusId
          ? {
              value: packageData.course.id,
              label: packageData.course.name,
              campusId: packageData.course.campusId || packageData.course.campus?.id,
            }
          : null;
      loadCourses(campusId, ensureCourse);
    } else {
      courseFetchGenRef.current += 1;
      setCourses([]);
      courseListHasMoreRef.current = false;
    }
  }, [formData.selectedCampus?.value, mode, packageData, isInitializing]);

  useEffect(() => {
    if (mode === "view") return;
    if (isInitializingRef.current) return;
    if (servicesLoadedFromPackageRef.current) return;
    
    loadServices(formData.courseId);
  }, [formData.courseId, mode]);

  const secondaryAccommodationOptions = useMemo(
    () => accommodations.filter((a) => a.value !== formData.accommodationId),
    [accommodations, formData.accommodationId]
  );

  const selectedSecondaryAccommodations = useMemo(() => {
    const ids = formData.secondaryAccommodationIds || [];
    if (ids.length === 0) return [];
    const byValue = new Map(accommodations.map((a) => [a.value, a]));
    return ids
      .map((id) => byValue.get(id) || { value: id, label: `Accommodation (${id.slice(0, 8)}…)` })
      .filter(Boolean);
  }, [accommodations, formData.secondaryAccommodationIds]);

  const handleInputChange = (field, value) => {
    if (isViewMode) return;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const handleCampusChange = (option) => {
    if (isViewMode) return;
    campusSelectionTouchedRef.current = true;
    packageCourseHydratedRef.current = true;
    const campusId = option?.value ?? null;
    setFormData((prev) => ({
      ...prev,
      selectedCampus: option,
      courseId: null,
      accommodationId: null,
      secondaryAccommodationIds: [],
    }));
    if (errors.courseId) setErrors((prev) => ({ ...prev, courseId: "" }));

    if (campusId) {
      courseListCampusIdRef.current = campusId;
      loadCourses(campusId);
    } else {
      courseFetchGenRef.current += 1;
      setCourses([]);
      courseListHasMoreRef.current = false;
    }

    loadAccommodations(campusId, []);
  };

  const handleClearCampus = () => {
    handleCampusChange(null);
  };

  const handlePrimaryAccommodationChange = (option) => {
    if (isViewMode) return;
    const nextId = option?.value ?? null;
    setFormData((prev) => {
      const prevSecondary = prev.secondaryAccommodationIds || [];
      let nextSecondary = prevSecondary;
      if (!nextId) {
        nextSecondary = [];
      } else {
        nextSecondary = prevSecondary.filter((id) => id !== nextId);
      }
      return {
        ...prev,
        accommodationId: nextId,
        secondaryAccommodationIds: nextSecondary,
      };
    });
    if (errors.accommodationId) setErrors((prev) => ({ ...prev, accommodationId: "" }));
    if (errors.secondaryAccommodationIds) {
      setErrors((prev) => ({ ...prev, secondaryAccommodationIds: "" }));
    }
  };

  const handleDateChange = (index, field, value) => {
    if (isViewMode) return;
    setFormData((prev) => {
      const newDates = [...prev.dates];
      const normalizedValue =
        field === "duration" || field === "accommodationDuration"
          ? normalizePositiveIntegerInput(value)
          : value;
      newDates[index] = { ...newDates[index], [field]: normalizedValue };
      return { ...prev, dates: newDates };
    });
  };

  const addDateEntry = () => {
    setFormData((prev) => ({
      ...prev,
      dates: [
        ...prev.dates,
        { startDate: "", duration: "", accommodationDuration: "", tag: "", color: "navy" },
      ],
    }));
  };

  const removeDateEntry = (index) => {
    if (formData.dates.length <= 1) return;
    setFormData((prev) => ({ ...prev, dates: prev.dates.filter((_, i) => i !== index) }));
  };

  const handleGalleryChange = (nextImages) => {
    if (isViewMode) return;
    setFormData((prev) => ({ ...prev, images: nextImages }));
  };

  const handleImportantSubsectionChange = (subsectionKey, values) => {
    if (isViewMode) return;
    setFormData((prev) => ({
      ...prev,
      importantInformation: {
        ...prev.importantInformation,
        [subsectionKey]: values,
      },
    }));
  };

  const handleNotIncludedChange = (index, value) => {
    if (isViewMode) return;
    setFormData((prev) => {
      const next = [...(prev.notIncludedItems || [])];
      next[index] = value;
      return { ...prev, notIncludedItems: next };
    });
  };

  const addNotIncludedItem = () => {
    if (isViewMode) return;
    setFormData((prev) => ({
      ...prev,
      notIncludedItems: [...(prev.notIncludedItems || []), ""],
    }));
  };

  const removeNotIncludedItem = (index) => {
    if (isViewMode) return;
    setFormData((prev) => ({
      ...prev,
      notIncludedItems: (prev.notIncludedItems || []).filter((_, i) => i !== index),
    }));
  };

  const handleWhatsIncludedChange = (index, value) => {
    if (isViewMode) return;
    setFormData((prev) => {
      const next = [...(prev.whatsIncluded || [])];
      next[index] = value;
      return { ...prev, whatsIncluded: next };
    });
  };

  const addWhatsIncludedItem = () => {
    if (isViewMode) return;
    setFormData((prev) => ({ ...prev, whatsIncluded: [...(prev.whatsIncluded || []), ""] }));
  };

  const removeWhatsIncludedItem = (index) => {
    if (isViewMode) return;
    setFormData((prev) => ({
      ...prev,
      whatsIncluded: (prev.whatsIncluded || []).filter((_, i) => i !== index),
    }));
  };

  const whatsIncludedSortableIds = (formData.whatsIncluded || []).map((_, index) => `included-${index}`);

  const whatsIncludedSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleWhatsIncludedDragEnd = ({ active, over }) => {
    if (isViewMode || !canEdit || isSubmitting) return;
    if (!over || active.id === over.id) return;

    const oldIndex = whatsIncludedSortableIds.indexOf(String(active.id));
    const newIndex = whatsIncludedSortableIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    setFormData((prev) => ({
      ...prev,
      whatsIncluded: arrayMove([...(prev.whatsIncluded || [])], oldIndex, newIndex),
    }));
  };

  const notIncludedSortableIds = (formData.notIncludedItems || []).map(
    (_, index) => `not-included-${index}`
  );

  const notIncludedSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleNotIncludedDragEnd = ({ active, over }) => {
    if (isViewMode || !canEdit || isSubmitting) return;
    if (!over || active.id === over.id) return;

    const oldIndex = notIncludedSortableIds.indexOf(String(active.id));
    const newIndex = notIncludedSortableIds.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    setFormData((prev) => ({
      ...prev,
      notIncludedItems: arrayMove([...(prev.notIncludedItems || [])], oldIndex, newIndex),
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.courseId) newErrors.courseId = "Programme is required";
    if (!formData.dates.some((d) => d.startDate && d.duration)) {
      newErrors.dates = "At least one date with start date and duration is required";
    }
    const hasInvalidAccommodationDuration = formData.dates.some((d) => {
      if (!d.startDate || !d.duration) return false;
      const durationWeeks = Number(d.duration);
      const accRaw = d.accommodationDuration;
      if (accRaw == null || accRaw === "") return false;
      const accommodationWeeks = Number(accRaw);
      if (!Number.isInteger(accommodationWeeks) || accommodationWeeks <= 0) return true;
      return accommodationWeeks > durationWeeks;
    });
    if (hasInvalidAccommodationDuration) {
      newErrors.dates = "Accommodation duration must be a positive number and not exceed date duration.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm() || !canSave) return;

    setIsSubmitting(true);
    try {
      const persistCustomImportantInformationLabels = async () => {
        const fi = formData.importantInformation || {};
        const sections = [
          { apiCat: PACKAGE_IMPORTANT_INFO_CATEGORY.WHAT_TO_BRING, stateKey: "whatToBring", values: fi.whatToBring },
          { apiCat: PACKAGE_IMPORTANT_INFO_CATEGORY.NOT_ALLOWED, stateKey: "notAllowed", values: fi.notAllowed },
          { apiCat: PACKAGE_IMPORTANT_INFO_CATEGORY.GOOD_TO_KNOW, stateKey: "goodToKnow", values: fi.goodToKnow },
        ];
        for (const { apiCat, stateKey, values } of sections) {
          const selected = normalizeTextListField(values || []);
          const catalogLabels = importantInfoOptions[stateKey] || [];
          const catalogLower = new Set(catalogLabels.map((s) => String(s).toLowerCase()));
          for (const label of selected) {
            const t = String(label).trim();
            if (!t) continue;
            const low = t.toLowerCase();
            if (catalogLower.has(low)) continue;
            const regKey = `${apiCat}::${low}`;
            if (registeredImportantOptionsRef.current.has(regKey)) continue;
            await PackageImportantInformationService.createOption(apiCat, t);
            registeredImportantOptionsRef.current.add(regKey);
            catalogLower.add(low);
          }
        }
      };

      await persistCustomImportantInformationLabels();

      let uploadedImages = [];

      const gallerySlots = (formData.images || []).filter((img) => {
        if (!img) return false;
        if (img.file) return true;
        return String(img.imageUrl || "").trim().length > 0;
      });

      if (gallerySlots.length > 0) {
        const { MediaService } = await import("services/mediaService");
        const packageName = formData.name || "package";
        uploadedImages = await MediaService.uploadPackageImages(gallerySlots, packageName);
      }

      const includedItems = normalizeWhatsIncluded(formData.whatsIncluded);
      const notIncludedItems = normalizeTextListField(formData.notIncludedItems);
      const whatToBringItems = normalizeTextListField(formData.importantInformation?.whatToBring);
      const notAllowedItemsImportant = normalizeTextListField(formData.importantInformation?.notAllowed);
      const goodToKnowItems = normalizeTextListField(formData.importantInformation?.goodToKnow);
      const normalizedLongDescription = normalizeLongDescriptionHtml(formData.longDescription);

      const imagesPayload = (uploadedImages || []).map((row, i) => ({
        imageUrl: row.imageUrl,
        type: "main",
        order: i,
      }));

      const apiData = {
        courseId: formData.courseId,
        description: formData.description,
        longDescription:
          mode === "edit"
            ? normalizedLongDescription
            : normalizedLongDescription || undefined,
        includedItems,
        notIncludedItems,
        whatToBring: whatToBringItems,
        notAllowed: notAllowedItemsImportant,
        goodToKnow: goodToKnowItems,
        accommodationId: formData.accommodationId ?? null,
        secondaryAccommodationIds:
          Array.isArray(formData.secondaryAccommodationIds) &&
          formData.secondaryAccommodationIds.length > 0
            ? formData.secondaryAccommodationIds
            : null,
        discountValue: formData.discountValue ? parseFloat(formData.discountValue) : undefined,
        discountType: formData.discountValue ? formData.discountType : undefined,
        dates: formData.dates
          .filter((d) => d.startDate && d.duration)
          .map((d) => {
            const durationWeeks = parseInt(d.duration, 10);
            const parsedAccommodationDuration = parseInt(d.accommodationDuration, 10);
            const accommodationDuration =
              Number.isInteger(parsedAccommodationDuration) && parsedAccommodationDuration > 0
                ? parsedAccommodationDuration
                : durationWeeks;
            return {
              startDate: formatDateToUTC(d.startDate),
              duration: durationWeeks,
              accommodationDuration,
              tag: d.tag || undefined,
              color: d.color || "navy",
            };
          }),
        images: imagesPayload,
      };

      if (mode === "edit" && packageData?.id) {
        apiData.serviceIds = Array.isArray(formData.serviceIds) ? formData.serviceIds : [];
      } else {
        apiData.serviceIds = Array.isArray(formData.serviceIds) ? formData.serviceIds : [];
      }

      const cleanApiData = {
        name: formData.name || "",
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        courseId: apiData.courseId,
        description: apiData.description,
        longDescription: apiData.longDescription,
        includedItems: apiData.includedItems,
        notIncludedItems: apiData.notIncludedItems,
        whatToBring: apiData.whatToBring,
        notAllowed: apiData.notAllowed,
        goodToKnow: apiData.goodToKnow,
        accommodationId: apiData.accommodationId,
        secondaryAccommodationIds: apiData.secondaryAccommodationIds,
        discountValue: apiData.discountValue,
        discountType: apiData.discountType,
        dates: apiData.dates,
        images: apiData.images,
        serviceIds: apiData.serviceIds,
      };
      Object.keys(cleanApiData).forEach((key) => {
        if (cleanApiData[key] === undefined) {
          delete cleanApiData[key];
        }
      });

      const result =
        mode === "edit" && packageData?.id
          ? await PackageService.updatePackage(packageData.id, cleanApiData)
          : await PackageService.createPackage(cleanApiData);

      const packageId = result?.id || packageData?.id;
      const experienceIds = (formData.selectedExperiences || []).map((item) => item.id).filter(Boolean);

      if (packageId) {
        await PackageService.assignPackageExperiences(packageId, experienceIds);
      }

      if (onSuccess) onSuccess(result, mode);
      handleClose();
    } catch (error) {
      console.error("Error saving package:", error);
      
      let errorMessage = "Error saving package. Please try again.";
      
      if (error.errorData) {
        if (Array.isArray(error.errorData.message)) {
          errorMessage = error.errorData.message.join(", ");
        } else if (error.errorData.message) {
          errorMessage = error.errorData.message;
        } else if (error.errorData.error) {
          errorMessage = error.errorData.error;
        }
      } else if (error.message) {
        errorMessage = error.message;
        errorMessage = errorMessage.replace(/^Failed to (update|create) package: \d+ - /, "");
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: "error",
      });
      
      setErrors((prev) => ({ ...prev, submit: errorMessage }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleClose = () => {
    (formData.images || []).forEach((img) => {
      if (img?.preview && String(img.preview).startsWith("blob:")) {
        try {
          URL.revokeObjectURL(img.preview);
        } catch {
          /* ignore */
        }
      }
    });
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    resetLoadingStates();
    onClose();
  };

  const getTitle = () => {
    if (mode === "view") return "View Package";
    if (mode === "edit") return "Edit Package";
    return "Create Package";
  };

  return (
    <>
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { maxHeight: "90vh", overflow: "auto" } }}>
      <DialogTitle>
        <SoftTypography variant="h5" fontWeight="medium">{getTitle()}</SoftTypography>
      </DialogTitle>

      <DialogContent sx={{ position: "relative" }}>
        <SoftBox p={2}>
          {isInitializing && (
            <SoftBox position="absolute" top={0} left={0} right={0} bottom={0} zIndex={1000} display="flex" flexDirection="column" alignItems="center" justifyContent="center" bgcolor="rgba(255, 255, 255, 0.9)" sx={{ backdropFilter: "blur(2px)" }}>
              <CircularProgress size={60} />
              <SoftTypography variant="h6" color="text" mt={2}>Loading...</SoftTypography>
            </SoftBox>
          )}

          <SoftBox mb={3}>
            <SoftBox mb={2}>
              <SoftTypography variant="h6" fontWeight="medium">
                Package Information
              </SoftTypography>
            </SoftBox>

            <SoftBox mb={2} display="flex" alignItems="flex-start" gap={2} flexWrap="wrap">
              <SoftBox flex="1" minWidth={120}>
                <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1} display="block">
                  Package Name
                </SoftTypography>
                <SoftInput
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  disabled={isViewMode || !canEdit || isSubmitting}
                  fullWidth
                  placeholder="e.g., London Summer Experience"
                />
              </SoftBox>
              <SoftBox display="flex" alignItems="center" pt={2.5}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.isActive !== undefined ? formData.isActive : true}
                      onChange={(e) => handleInputChange("isActive", e.target.checked)}
                      disabled={isViewMode || !canEdit || isSubmitting}
                    />
                  }
                  label={
                    <SoftTypography variant="button" fontWeight="regular">
                      Active
                    </SoftTypography>
                  }
                  labelPlacement="start"
                />
              </SoftBox>
            </SoftBox>

            <SoftBox mb={2}>
              <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1} display="block">
                Package Description
              </SoftTypography>
              <SoftInput
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                disabled={isViewMode || !canEdit || isSubmitting}
                fullWidth
                multiline
                rows={4}
                placeholder="Describe what's included in this package and its highlights..."
              />
            </SoftBox>

            <SoftBox mb={2}>
              <SoftTypography
                component="label"
                variant="caption"
                fontWeight="bold"
                mb={1}
                display="block"
              >
                Long Description
              </SoftTypography>
              <SoftBox dir="ltr" sx={{ direction: "ltr", textAlign: "left" }}>
                <SoftEditor
                  value={formData.longDescription || ""}
                  onChange={(html) => handleInputChange("longDescription", html)}
                  disabled={isViewMode || !canEdit || isSubmitting}
                />
              </SoftBox>
            </SoftBox>

            <SoftBox mb={2}>
              <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <SoftBox>
                  <SoftTypography variant="button" fontWeight="bold" display="block">
                    What&apos;s Included
                  </SoftTypography>
                  <SoftTypography variant="caption" color="text" display="block">
                    Order is preserved when you save the package.
                  </SoftTypography>
                </SoftBox>
                {!isViewMode && canEdit && (
                  <SoftButton
                    variant="outlined"
                    color="dark"
                    size="small"
                    onClick={addWhatsIncludedItem}
                    startIcon={<Icon fontSize="small">add</Icon>}
                    disabled={isSubmitting}
                  >
                    Add
                  </SoftButton>
                )}
              </SoftBox>
              {(formData.whatsIncluded || []).length === 0 ? (
                <SoftBox
                  p={2}
                  borderRadius={2}
                  border="1px solid"
                  borderColor="grey.300"
                  bgcolor="grey.50"
                >
                  <SoftTypography variant="caption" color="text.secondary">
                    No items yet.
                  </SoftTypography>
                </SoftBox>
              ) : (
                <DndContext
                  sensors={whatsIncludedSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleWhatsIncludedDragEnd}
                >
                  <SortableContext
                    items={whatsIncludedSortableIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {(formData.whatsIncluded || []).map((item, index) => {
                      const itemId = whatsIncludedSortableIds[index];
                      return (
                        <SortableIncludedItem
                          key={itemId}
                          id={itemId}
                          disabled={isViewMode || !canEdit || isSubmitting}
                        >
                          {({ setNodeRef, attributes, listeners, style }) => (
                            <SoftBox
                              ref={setNodeRef}
                              style={style}
                              display="flex"
                              alignItems="center"
                              gap={1}
                              mb={1.5}
                            >
                              {!isViewMode && canEdit && (
                                <SoftBox
                                  component="span"
                                  {...attributes}
                                  {...listeners}
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: isSubmitting ? "default" : "grab",
                                    touchAction: "none",
                                    color: "text.secondary",
                                    flexShrink: 0,
                                  }}
                                  aria-label="Drag to reorder item"
                                >
                                  <Icon>drag_indicator</Icon>
                                </SoftBox>
                              )}
                              <SoftInput
                                fullWidth
                                size="small"
                                value={item}
                                onChange={(e) => handleWhatsIncludedChange(index, e.target.value)}
                                disabled={isViewMode || !canEdit || isSubmitting}
                                sx={{ flex: 1, minWidth: 0 }}
                              />
                              {!isViewMode && canEdit && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removeWhatsIncludedItem(index)}
                                  disabled={isSubmitting}
                                  aria-label="Remove item"
                                  sx={{ flexShrink: 0 }}
                                >
                                  <Icon fontSize="small">delete</Icon>
                                </IconButton>
                              )}
                            </SoftBox>
                          )}
                        </SortableIncludedItem>
                      );
                    })}
                  </SortableContext>
                </DndContext>
              )}
            </SoftBox>

            <SoftBox mb={2}>
              <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                <SoftBox>
                  <SoftTypography variant="button" fontWeight="bold" display="block">
                    What is not included
                  </SoftTypography>
                  <SoftTypography variant="caption" color="text" display="block">
                    List items that are not part of the package (shown with a cross in the app).
                  </SoftTypography>
                  <SoftTypography variant="caption" color="text" display="block">
                    Order is preserved when you save the package.
                  </SoftTypography>
                </SoftBox>
                {!isViewMode && canEdit && (
                  <SoftButton
                    variant="outlined"
                    color="dark"
                    size="small"
                    onClick={addNotIncludedItem}
                    startIcon={<Icon fontSize="small">add</Icon>}
                    disabled={isSubmitting}
                  >
                    Add
                  </SoftButton>
                )}
              </SoftBox>
              {(formData.notIncludedItems || []).length === 0 ? (
                <SoftBox
                  p={2}
                  borderRadius={2}
                  border="1px solid"
                  borderColor="grey.300"
                  bgcolor="grey.50"
                >
                  <SoftTypography variant="caption" color="text.secondary">
                    No items yet.
                  </SoftTypography>
                </SoftBox>
              ) : (
                <DndContext
                  sensors={notIncludedSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleNotIncludedDragEnd}
                >
                  <SortableContext
                    items={notIncludedSortableIds}
                    strategy={verticalListSortingStrategy}
                  >
                    {(formData.notIncludedItems || []).map((item, index) => {
                      const itemId = notIncludedSortableIds[index];
                      return (
                        <SortableIncludedItem
                          key={itemId}
                          id={itemId}
                          disabled={isViewMode || !canEdit || isSubmitting}
                        >
                          {({ setNodeRef, attributes, listeners, style }) => (
                            <SoftBox
                              ref={setNodeRef}
                              style={style}
                              display="flex"
                              alignItems="center"
                              gap={1}
                              mb={1.5}
                            >
                              {!isViewMode && canEdit && (
                                <SoftBox
                                  component="span"
                                  {...attributes}
                                  {...listeners}
                                  sx={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: isSubmitting ? "default" : "grab",
                                    touchAction: "none",
                                    color: "text.secondary",
                                    flexShrink: 0,
                                  }}
                                  aria-label="Drag to reorder item"
                                >
                                  <Icon>drag_indicator</Icon>
                                </SoftBox>
                              )}
                              <SoftInput
                                fullWidth
                                size="small"
                                value={item}
                                onChange={(e) => handleNotIncludedChange(index, e.target.value)}
                                disabled={isViewMode || !canEdit || isSubmitting}
                                sx={{ flex: 1, minWidth: 0 }}
                              />
                              {!isViewMode && canEdit && (
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => removeNotIncludedItem(index)}
                                  disabled={isSubmitting}
                                  aria-label="Remove item"
                                  sx={{ flexShrink: 0 }}
                                >
                                  <Icon fontSize="small">delete</Icon>
                                </IconButton>
                              )}
                            </SoftBox>
                          )}
                        </SortableIncludedItem>
                      );
                    })}
                  </SortableContext>
                </DndContext>
              )}
            </SoftBox>

            <PackageGallerySection
              images={formData.images}
              onImagesChange={handleGalleryChange}
              disabled={isViewMode || !canEdit || isSubmitting}
              isSubmitting={isSubmitting}
            />

            <ImportantInformationSection
              whatToBring={formData.importantInformation?.whatToBring}
              notAllowed={formData.importantInformation?.notAllowed}
              goodToKnow={formData.importantInformation?.goodToKnow}
              optionsWhatToBring={importantInfoOptions.whatToBring}
              optionsNotAllowed={importantInfoOptions.notAllowed}
              optionsGoodToKnow={importantInfoOptions.goodToKnow}
              disabled={isViewMode || !canEdit || isSubmitting}
              onWhatToBringChange={(v) => handleImportantSubsectionChange("whatToBring", v)}
              onNotAllowedChange={(v) => handleImportantSubsectionChange("notAllowed", v)}
              onGoodToKnowChange={(v) => handleImportantSubsectionChange("goodToKnow", v)}
            />
          </SoftBox>

          <Divider sx={{ my: 3 }} />

          <CourseSelectionSection
            formData={formData}
            schools={schools}
            campuses={campuses}
            courses={courses}
            isViewMode={isViewMode}
            canEdit={canEdit}
            isSubmitting={isSubmitting}
            isLoading={isLoading}
            schoolsSelectLoading={isLoading("schools") || schoolsLoadingMore}
            campusesSelectLoading={isLoading("campuses") || campusesLoadingMore}
            coursesSelectLoading={isLoading("courses") || coursesLoadingMore}
            onSchoolInputChange={handlePackageSchoolInputChange}
            onSchoolMenuScrollToBottom={handleSchoolMenuScrollToBottom}
            onCampusMenuScrollToBottom={handleCampusMenuScrollToBottom}
            onCourseMenuScrollToBottom={handleCourseMenuScrollToBottom}
            getSelectPlaceholder={getSelectPlaceholder}
            onInputChange={handleInputChange}
            onCampusChange={handleCampusChange}
            onClearCampus={handleClearCampus}
            errors={errors}
          />

          <Divider sx={{ my: 3 }} />

          <SoftBox mb={3}>
            <SoftTypography variant="h6" fontWeight="medium" mb={2}>
              Accommodation (Optional)
            </SoftTypography>
            <SoftBox mb={2}>
              <SoftTypography variant="button" fontWeight="medium" color="text" mb={1} display="block">
                Primary accommodation
              </SoftTypography>
              <SoftBox display="flex" alignItems="flex-start" gap={1}>
                <SoftBox sx={{ flex: 1, minWidth: 0 }}>
                  <SoftSelect
                    key={`primary-accommodation-${formData.selectedCampus?.value || "none"}`}
                    value={accommodations.find((a) => a.value === formData.accommodationId) || null}
                    onChange={handlePrimaryAccommodationChange}
                    options={accommodations}
                    onMenuScrollToBottom={handleAccommodationMenuScrollToBottom}
                    maxMenuHeight={PACKAGE_SELECT_MAX_MENU_HEIGHT}
                    components={{ MenuList: SelectMenuListWithScroll }}
                    isLoading={isLoading("accommodations") || accommodationsLoadingMore}
                    isDisabled={
                      isViewMode ||
                      !canEdit ||
                      isSubmitting ||
                      isLoading("accommodations") ||
                      !formData.selectedCampus
                    }
                    placeholder={
                      !formData.selectedCampus ? "Select location first" : "Select primary accommodation"
                    }
                    isClearable
                    styles={{
                      clearIndicator: (base) => ({ ...base, display: "flex", padding: "8px" }),
                    }}
                  />
                </SoftBox>
                {formData.accommodationId && !isViewMode && canEdit && (
                  <IconButton
                    size="small"
                    color="error"
                    onClick={() => handlePrimaryAccommodationChange(null)}
                    disabled={isSubmitting}
                    title="Remove primary accommodation"
                    sx={{ mt: 0.5, flexShrink: 0 }}
                  >
                    <Icon fontSize="small">close</Icon>
                  </IconButton>
                )}
              </SoftBox>
            </SoftBox>
            <SoftBox>
              <SoftTypography variant="button" fontWeight="medium" color="text" mb={1} display="block">
                Secondary accommodations
              </SoftTypography>
              <SoftSelect
                key={`secondary-accommodations-${formData.selectedCampus?.value || "none"}`}
                value={selectedSecondaryAccommodations}
                onChange={(options) =>
                  handleInputChange(
                    "secondaryAccommodationIds",
                    Array.isArray(options) ? options.map((o) => o.value) : []
                  )
                }
                options={secondaryAccommodationOptions}
                isMulti
                closeMenuOnSelect={false}
                onMenuScrollToBottom={handleAccommodationMenuScrollToBottom}
                maxMenuHeight={PACKAGE_SELECT_MAX_MENU_HEIGHT}
                components={{ MenuList: SelectMenuListWithScroll }}
                isDisabled={
                  isViewMode ||
                  !canEdit ||
                  isSubmitting ||
                  isLoading("accommodations") ||
                  !formData.selectedCampus ||
                  !formData.accommodationId
                }
                isLoading={isLoading("accommodations") || accommodationsLoadingMore}
                placeholder={
                  !formData.selectedCampus
                    ? "Select location first"
                    : !formData.accommodationId
                      ? "Select primary accommodation first"
                      : "Select secondary accommodations (optional)"
                }
                isClearable
              />
            </SoftBox>
          </SoftBox>

          <Divider sx={{ my: 3 }} />

          <SoftBox mb={3}>
            <SoftTypography variant="h6" fontWeight="medium" mb={2}>Extras (optional)</SoftTypography>
            <SoftSelect
              value={services.filter(s => formData.serviceIds?.includes(s.value))}
              onChange={(options) => handleInputChange("serviceIds", options?.map(o => o.value) || [])}
              options={services}
              isMulti
              isDisabled={isViewMode || !canEdit || isSubmitting || isLoading("services")}
              placeholder="Select extras"
              isClearable
            />
          </SoftBox>

          <Divider sx={{ my: 3 }} />

          <PackageExperiencesSection
            selectedItems={formData.selectedExperiences || []}
            onChange={(next) => handleInputChange("selectedExperiences", next)}
            isViewMode={isViewMode}
            canEdit={canEdit}
            isSubmitting={isSubmitting}
          />

          <Divider sx={{ my: 3 }} />

          <DatesSection
            dates={formData.dates}
            isViewMode={isViewMode}
            canEdit={canEdit}
            isSubmitting={isSubmitting}
            onDateChange={handleDateChange}
            onAddDate={addDateEntry}
            onRemoveDate={removeDateEntry}
            error={errors.dates}
          />

          <Divider sx={{ my: 3 }} />

          <DiscountSection
            discountType={formData.discountType}
            discountValue={formData.discountValue}
            isViewMode={isViewMode}
            canEdit={canEdit}
            isSubmitting={isSubmitting}
            onInputChange={handleInputChange}
          />

          {errors.submit && (
            <SoftTypography variant="caption" color="error">{errors.submit}</SoftTypography>
          )}
        </SoftBox>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting || isInitializing}>Cancel</Button>
        {!isViewMode && (
          <SoftButton variant="gradient" color="info" onClick={handleSubmit} disabled={!canSave || isSubmitting || isInitializing}>
            {getSaveButtonText(mode === "edit" ? "Save Changes" : "Create Package")}
          </SoftButton>
        )}
      </DialogActions>
    </Dialog>
    
    <Snackbar
      open={snackbar.open}
      autoHideDuration={6000}
      onClose={handleCloseSnackbar}
      anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
    >
      <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
        {snackbar.message}
      </Alert>
    </Snackbar>
    </>
  );
}

PackageModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["add", "edit", "view"]),
  packageData: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default PackageModal;
