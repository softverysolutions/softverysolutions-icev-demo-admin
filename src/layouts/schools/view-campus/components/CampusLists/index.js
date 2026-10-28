import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

// @mui material components
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Icon from "@mui/material/Icon";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";

import DataTable from "examples/Tables/DataTable";

import breakpoints from "assets/theme/base/breakpoints";

import CourseModal from "layouts/courses/add-course-modal";

import AccommodationModal from "layouts/accommodation/add-accommodation-modal";
import { getPricePreview } from "layouts/accommodation/accommodations-list/utils/pricePreview";

import PriceListModal from "layouts/courses/price-list-modal";

import dataTableData from "./data/dataTableData";
import { CourseService } from "services/courseService";
import { AccommodationService } from "services/accommodationService";
import { AccommodationFeeService } from "services/accommodationFeeService";
import { CourseFeeService } from "services/courseFeeService";
import { formatMoney } from "services/currencyService";
import { getCourseTypeDisplay } from "utils/courseTypeUtils";
import { buildDuplicateCoursePayload } from "utils/duplicateCourseUtils";
import TruncatedText from "components/TruncatedText";
import { parseCoursePeriodicity } from "utils/periodicityUtils";
import { useCan } from "permissions/useCan";
import { F } from "permissions/features";


const CampusPhotosCell = ({ value }) => {
  if (!Array.isArray(value) || value.length === 0) {
    return (
      <SoftBox display="flex" alignItems="center" justifyContent="center">
        <Icon sx={{ color: "text.secondary" }} fontSize="small">
          image
        </Icon>
      </SoftBox>
    );
  }

  return (
    <SoftBox display="flex" alignItems="center" gap={1}>
      <SoftBox
        component="img"
        src={value[0]}
        alt="accommodation photo"
        borderRadius="lg"
        shadow="md"
        width="40px"
        height="40px"
        sx={{
          objectFit: "cover",
          backgroundColor: "grey.100",
        }}
        onError={(e) => {
          e.target.style.display = "none";
          e.target.nextSibling.style.display = "flex";
        }}
      />
      <SoftBox
        display="none"
        alignItems="center"
        justifyContent="center"
        borderRadius="lg"
        bgColor="grey-100"
        width="40px"
        height="40px"
      >
        <Icon sx={{ color: "text.secondary" }} fontSize="small">
          image
        </Icon>
      </SoftBox>
      {value.length > 1 && (
        <SoftBox
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="50%"
          bgColor="grey-100"
          width="32px"
          height="32px"
          ml={0.5}
        >
          <SoftTypography variant="caption" color="secondary" fontWeight="medium">
            +{value.length - 1}
          </SoftTypography>
        </SoftBox>
      )}
    </SoftBox>
  );
};

CampusPhotosCell.propTypes = {
  value: PropTypes.arrayOf(PropTypes.string).isRequired,
};

function CampusLists({ campus }) {
  const { can } = useCan();
  const hideCampusTableMutations = !can(F.CAMPUS_PAGE_COURSE_ROW_MUTATE);
  const canAddCourse = can(F.CAMPUS_PAGE_ADD_COURSE);
  const canAddAccommodation = can(F.CAMPUS_PAGE_ADD_ACCOMMODATION);

  const navigate = useNavigate();
  const { schoolId, campusId } = useParams();
  const location = useLocation();
  const [tabsOrientation, setTabsOrientation] = useState("horizontal");
  const [tabValue, setTabValue] = useState(0);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseModalMode, setCourseModalMode] = useState("view");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courses, setCourses] = useState([]);
  const [isLoadingCourses, setIsLoadingCourses] = useState(true);
  const [coursesPagination, setCoursesPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [courseSortDirection, setCourseSortDirection] = useState("asc");

  const AccommodationNameCell = ({ value }) => {
    return <TruncatedText text={value} maxLength={20} />;
  };

  AccommodationNameCell.propTypes = {
    value: PropTypes.string,
  };

  const AccommodationLocationCell = ({ value }) => {
    return <TruncatedText text={value} maxLength={20} />;
  };

  AccommodationLocationCell.propTypes = {
    value: PropTypes.string,
  };

  const [accommodations, setAccommodations] = useState([]);
  const [isLoadingAccommodations, setIsLoadingAccommodations] = useState(true);

  const [isAccommodationModalOpen, setIsAccommodationModalOpen] = useState(false);
  const [accommodationModalMode, setAccommodationModalMode] = useState("add");
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);

  const [isPriceListModalOpen, setIsPriceListModalOpen] = useState(false);
  const [selectedCourseForPriceList, setSelectedCourseForPriceList] = useState(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [accommodationToDelete, setAccommodationToDelete] = useState(null);
  const [savedCourseSearchValue, setSavedCourseSearchValue] = useState("");
  const [globalCourseSearchFilter, setGlobalCourseSearchFilter] = useState("");
  const [appliedCourseSearch, setAppliedCourseSearch] = useState("");
  const appliedCourseSearchRef = useRef("");
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [savedAccommodationSearchValue, setSavedAccommodationSearchValue] = useState("");
  const [globalAccommodationSearchFilter, setGlobalAccommodationSearchFilter] = useState("");
  const [filteredAccommodations, setFilteredAccommodations] = useState([]);
  const [courseStatusUpdateLoading, setCourseStatusUpdateLoading] = useState(false);
  const [accommodationStatusUpdateLoading, setAccommodationStatusUpdateLoading] = useState(false);
  const ActionsCellWrapper = ({ value }) => {
    const handleCheckboxChange = (e) => {
      e.stopPropagation();
      if (!value.isUpdating && value.onToggleStatus) {
        value.onToggleStatus(value.row);
      }
    };

    const isActive = value.row.isActive !== undefined ? value.row.isActive : true;

    return (
      <SoftBox display="flex" alignItems="center" justifyContent="center" gap={2}>
        {value.onToggleStatus && !value.hideRowMutations && (
          <FormControlLabel
            control={
              <Checkbox
                checked={isActive}
                onChange={handleCheckboxChange}
                disabled={value.isUpdating}
                size="small"
                onClick={(e) => e.stopPropagation()}
              />
            }
            label=""
            sx={{ margin: 0 }}
          />
        )}
        <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
          <Icon
            sx={{ color: "text.secondary" }}
            fontSize="medium"
            onClick={() => value.onView(value.row)}
          >
            visibility
          </Icon>
        </SoftTypography>
        {value.onDuplicate && !value.hideRowMutations && (
          <SoftTypography
            variant="body1"
            color="secondary"
            sx={{ cursor: "pointer", lineHeight: 0 }}
          >
            <Icon
              sx={{ color: "text.secondary" }}
              fontSize="medium"
              onClick={() => value.onDuplicate(value.row)}
            >
              content_copy
            </Icon>
          </SoftTypography>
        )}
        {!value.hideRowMutations && (
          <>
            <SoftTypography
              variant="body1"
              color="secondary"
              sx={{ cursor: "pointer", lineHeight: 0 }}
            >
              <Icon
                sx={{ color: "text.secondary" }}
                fontSize="medium"
                onClick={() => value.onEdit(value.row)}
              >
                edit
              </Icon>
            </SoftTypography>
            <SoftTypography
              variant="body1"
              color="secondary"
              sx={{ cursor: "pointer", lineHeight: 0 }}
            >
              <Icon
                sx={{ color: "text.secondary" }}
                fontSize="medium"
                onClick={() => value.onDelete(value.row)}
              >
                delete
              </Icon>
            </SoftTypography>
          </>
        )}
      </SoftBox>
    );
  };

  ActionsCellWrapper.propTypes = {
    value: PropTypes.shape({
      row: PropTypes.object.isRequired,
      onView: PropTypes.func.isRequired,
      onEdit: PropTypes.func.isRequired,
      onDelete: PropTypes.func.isRequired,
      onDuplicate: PropTypes.func,
      onToggleStatus: PropTypes.func,
      isUpdating: PropTypes.bool,
      hideRowMutations: PropTypes.bool,
    }).isRequired,
  };

  useEffect(() => {
    function handleTabsOrientation() {
      return window.innerWidth < breakpoints.values.sm
        ? setTabsOrientation("vertical")
        : setTabsOrientation("horizontal");
    }

    window.addEventListener("resize", handleTabsOrientation);

    handleTabsOrientation();

    return () => window.removeEventListener("resize", handleTabsOrientation);
  }, [tabsOrientation]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const newCourseId = urlParams.get("newCourseId");
    const updatedCourseId = urlParams.get("updatedCourseId");
    const newAccommodationId = urlParams.get("newAccommodationId");
    const updatedAccommodationId = urlParams.get("updatedAccommodationId");

    if (newCourseId && tabValue === 0) {
      coursesCacheRef.current.clear();
      loadCourses(
        coursesPagination.currentPage,
        coursesPagination.itemsPerPage,
        courseSortDirection,
        appliedCourseSearchRef.current
      );
      const newUrl = new URL(window.location);
      newUrl.searchParams.delete("newCourseId");
      window.history.replaceState({}, "", newUrl);
    }

    if (newAccommodationId) {
      const addNewAccommodation = async () => {
        try {
          const newAccommodation = await AccommodationService.getAccommodationById(
            newAccommodationId
          );
          setAccommodations((prevAccommodations) => {
            const existingAccommodation = (
              Array.isArray(prevAccommodations) ? prevAccommodations : []
            ).find((acc) => acc.id === newAccommodationId);
            if (!existingAccommodation) {
              return [
                ...(Array.isArray(prevAccommodations) ? prevAccommodations : []),
                newAccommodation,
              ];
            }
            return Array.isArray(prevAccommodations) ? prevAccommodations : [];
          });

          const newUrl = new URL(window.location);
          newUrl.searchParams.delete("newAccommodationId");
          window.history.replaceState({}, "", newUrl);
        } catch (error) {
          console.error("Failed to load new accommodation:", error);
        }
      };
      addNewAccommodation();
    }

    if (updatedCourseId && tabValue === 0) {
      coursesCacheRef.current.clear();
      loadCourses(
        coursesPagination.currentPage,
        coursesPagination.itemsPerPage,
        courseSortDirection,
        appliedCourseSearchRef.current
      );
      urlParams.delete("updatedCourseId");
      const newUrl = location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : "");
      navigate(newUrl, { replace: true });
    }

    if (updatedAccommodationId && tabValue === 1) {
      const updateAccommodation = async () => {
        try {
          const updatedAccommodation = await AccommodationService.getAccommodationById(
            updatedAccommodationId
          );
          setAccommodations((prevAccommodations) => {
            const existingAccommodations = Array.isArray(prevAccommodations)
              ? prevAccommodations
              : [];
            const updatedIndex = existingAccommodations.findIndex(
              (acc) => acc.id === updatedAccommodationId
            );
            if (updatedIndex !== -1) {
              const newAccommodations = [...existingAccommodations];
              newAccommodations[updatedIndex] = updatedAccommodation;
              return newAccommodations;
            }
            return existingAccommodations;
          });

          urlParams.delete("updatedAccommodationId");
          const newUrl =
            location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : "");
          navigate(newUrl, { replace: true });
        } catch (error) {
          console.error("Failed to load updated accommodation:", error);
        }
      };
      updateAccommodation();
    }
  }, [location.search]);

  const coursesLoadedRef = useRef(false);
  const lastLoadedPageRef = useRef(null);
  const lastLoadedLimitRef = useRef(null);
  const lastLoadedSearchRef = useRef("");
  const lastLoadedSortRef = useRef("asc");
  const coursesCacheRef = useRef(new Map());

  useEffect(() => {
    appliedCourseSearchRef.current = appliedCourseSearch;
  }, [appliedCourseSearch]);

  useEffect(() => {
    setGlobalCourseSearchFilter("");
    setAppliedCourseSearch("");
    appliedCourseSearchRef.current = "";
    coursesCacheRef.current.clear();
    coursesLoadedRef.current = false;
    lastLoadedPageRef.current = null;
    lastLoadedLimitRef.current = null;
    lastLoadedSearchRef.current = "";
    lastLoadedSortRef.current = "asc";
  }, [campusId]);

  useEffect(() => {
    if (tabValue === 0 && campusId) {
      const currentPage = coursesPagination.currentPage;
      const currentLimit = coursesPagination.itemsPerPage;

      if (
        coursesLoadedRef.current &&
        lastLoadedPageRef.current === currentPage &&
        lastLoadedLimitRef.current === currentLimit &&
        lastLoadedSearchRef.current === appliedCourseSearch &&
        lastLoadedSortRef.current === courseSortDirection &&
        courses.length > 0
      ) {
        return;
      }

      loadCourses(currentPage, currentLimit, courseSortDirection, appliedCourseSearch);
    } else if (tabValue !== 0) {
      coursesLoadedRef.current = false;
      lastLoadedPageRef.current = null;
      lastLoadedLimitRef.current = null;
      lastLoadedSearchRef.current = "";
      lastLoadedSortRef.current = courseSortDirection;
    }

    if (
      tabValue === 1 &&
      schoolId &&
      (!Array.isArray(accommodations) || accommodations.length === 0)
    ) {
      loadAccommodations();
    }
  }, [tabValue, campusId, schoolId]);

  useEffect(() => {
    let timeoutId;

    const processUrlParams = () => {
      const urlParams = new URLSearchParams(location.search);
      const newCourseId = urlParams.get("newCourseId");
      const updatedCourseId = urlParams.get("updatedCourseId");
      const newAccommodationId = urlParams.get("newAccommodationId");
      const updatedAccommodationId = urlParams.get("updatedAccommodationId");

      if (newCourseId && tabValue === 0) {
        urlParams.delete("newCourseId");
        const newUrl = location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : "");
        navigate(newUrl, { replace: true });
      }

      if (updatedCourseId && tabValue === 0) {
        coursesCacheRef.current.clear();
        loadCourses(
          coursesPagination.currentPage,
          coursesPagination.itemsPerPage,
          courseSortDirection,
          appliedCourseSearchRef.current
        );
        urlParams.delete("updatedCourseId");
        const newUrl = location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : "");
        navigate(newUrl, { replace: true });
      }

      if (newAccommodationId && tabValue === 1) {
        urlParams.delete("newAccommodationId");
        const newUrl = location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : "");
        navigate(newUrl, { replace: true });
      }

      if (updatedAccommodationId && tabValue === 1) {
        urlParams.delete("updatedAccommodationId");
        const newUrl = location.pathname + (urlParams.toString() ? `?${urlParams.toString()}` : "");
        navigate(newUrl, { replace: true });
      }
    };

    clearTimeout(timeoutId);
    timeoutId = setTimeout(processUrlParams, 100);

    return () => clearTimeout(timeoutId);
  }, [location.search, tabValue]);

  const loadCourses = async (
    page = 1,
    limit = 10,
    sortDirection = courseSortDirection,
    searchQuery = appliedCourseSearchRef.current
  ) => {
    const search = searchQuery !== undefined && searchQuery !== null ? String(searchQuery) : "";
    const cacheKey = `${campusId}_${page}_${limit}_${sortDirection}_${search}`;
    console.log("[CampusLists] loadCourses called", {
      campusId,
      page,
      limit,
      search,
      cacheKey,
      cacheSize: coursesCacheRef.current.size,
    });

    const cachedData = coursesCacheRef.current.get(cacheKey);
    if (cachedData) {
      console.log("[CampusLists] Using cached programmes", {
        coursesCount: cachedData.courses.length,
        page: cachedData.pagination.currentPage,
        requestedPage: page,
      });
      setIsLoadingCourses(false);
      setCourses(cachedData.courses);
      setFilteredCourses(cachedData.filteredCourses || cachedData.courses);
      setCoursesPagination(cachedData.pagination);
      coursesLoadedRef.current = true;
      lastLoadedPageRef.current = page;
      lastLoadedLimitRef.current = limit;
      lastLoadedSearchRef.current = search;
      lastLoadedSortRef.current = sortDirection;
      return;
    }

    console.log("[CampusLists] Cache miss, fetching from API");
    setIsLoadingCourses(true);
    try {
      const response = await CourseService.getAllCourses({
        page: page,
        limit: limit,
        sortBy: "name",
        sortDirection,
        campusIds: [campusId],
        search,
      });

      const coursesData = response.data || [];

      const loadedCourses = coursesData.map((course) => {
        if (course.currentPriceList) {
          return {
            ...course,
            simplePrices: course.currentPriceList.simplePrices || [],
            flexibleDurationPrices: course.currentPriceList.flexibleDurationPrices || [],
            fixedDurationPrices: course.currentPriceList.fixedDurationPrices || [],
          };
        }
        return course;
      });

      const paginationData = response.meta
        ? {
            currentPage: response.meta.currentPage || page,
            totalPages: response.meta.totalPages || 1,
            totalItems: response.meta.totalItems || 0,
            itemsPerPage: limit,
          }
        : {
            currentPage: page,
            totalPages: 1,
            totalItems: 0,
            itemsPerPage: limit,
          };

      setCourses(loadedCourses);
      setFilteredCourses(loadedCourses);
      setCoursesPagination(paginationData);

      const cacheData = {
        courses: loadedCourses,
        filteredCourses: loadedCourses,
        pagination: paginationData,
      };

      coursesCacheRef.current.set(cacheKey, cacheData);
      console.log("[CampusLists] Data cached", {
        cacheKey,
        coursesCount: loadedCourses.length,
        cacheSize: coursesCacheRef.current.size,
      });

      coursesLoadedRef.current = true;
      lastLoadedPageRef.current = page;
      lastLoadedLimitRef.current = limit;
      lastLoadedSearchRef.current = search;
      lastLoadedSortRef.current = sortDirection;
    } catch (error) {
      console.error("Error loading programmes:", error);
      setCourses([]);
      setFilteredCourses([]);
    } finally {
      setIsLoadingCourses(false);
    }
  };

  const loadAccommodations = async () => {
    setIsLoadingAccommodations(true);
    try {
      console.log("Loading accommodations for campusId:", campusId);

      const response = await AccommodationService.getAllAccommodations({
        campusIds: [campusId],
      });
      const accommodationsData = response.data || [];
      setAccommodations(Array.isArray(accommodationsData) ? accommodationsData : []);
      setFilteredAccommodations(Array.isArray(accommodationsData) ? accommodationsData : []);
    } catch (error) {
      console.error("Error loading accommodations:", error);
      setAccommodations([]);
    } finally {
      setIsLoadingAccommodations(false);
    }
  };

  const handleSetTabValue = (event, newValue) => setTabValue(newValue);

  const handleOpenCourseModal = (mode = "view", courseData = null) => {
    const searchInput = document.querySelector('input[placeholder*="Programme"]');
    if (searchInput && searchInput.value) {
      setSavedCourseSearchValue(searchInput.value);
    } else if (globalCourseSearchFilter) {
      setSavedCourseSearchValue(globalCourseSearchFilter);
    }

    setCourseModalMode(mode);
    setSelectedCourse(courseData);
    setIsCourseModalOpen(true);
  };

  const handleCloseCourseModal = () => {
    setIsCourseModalOpen(false);
    setSelectedCourse(null);

    if (savedCourseSearchValue) {
      const q = savedCourseSearchValue.trim();
      setGlobalCourseSearchFilter(savedCourseSearchValue);
      setAppliedCourseSearch(q);
      appliedCourseSearchRef.current = q;
      coursesCacheRef.current.clear();
      setCoursesPagination((prev) => ({ ...prev, currentPage: 1 }));
      loadCourses(1, coursesPagination.itemsPerPage, courseSortDirection, q);
    }
  };

  const handleAddCourse = () => {
    navigate(`/schools/view/${schoolId}/campus/${campusId}/add-course/new`);
  };

  const handleViewCourse = (row) => {
    handleOpenCourseModal("view", row);
  };

  const handleEditCourse = (row) => {
    navigate(`/schools/view/${schoolId}/campus/${campusId}/add-course/${row.id}`);
  };

  const handlePriceList = (row) => {
    setSelectedCourseForPriceList(row);
    setIsPriceListModalOpen(true);
  };

  const handleDuplicateCourse = async (course) => {
    try {
      const duplicateData = await buildDuplicateCoursePayload(course);
      navigate(`/schools/view/${schoolId}/campus/${campusId}/add-course/new`, {
        state: { duplicateData },
      });
    } catch (error) {
      console.error("Error loading programme data for duplication:", error);
      alert(`Failed to duplicate programme: ${error.message}`);
    }
  };

  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;

    try {
      await CourseService.deleteCourse(courseToDelete.id);
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
      coursesCacheRef.current.clear();
      loadCourses(
        coursesPagination.currentPage,
        coursesPagination.itemsPerPage,
        courseSortDirection,
        appliedCourseSearchRef.current
      );
    } catch (error) {
      console.error("Error deleting programme:", error);
      alert(`Failed to delete programme: ${error.message}`);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCourseToDelete(null);
    setAccommodationToDelete(null);
  };

  const handleCourseSearchChange = (value) => {
    setGlobalCourseSearchFilter(value);
  };

  const handleCourseSearchSubmit = () => {
    const q = globalCourseSearchFilter.trim();
    setAppliedCourseSearch(q);
    appliedCourseSearchRef.current = q;
    coursesCacheRef.current.clear();
    setCoursesPagination((prev) => ({ ...prev, currentPage: 1 }));
    loadCourses(1, coursesPagination.itemsPerPage, courseSortDirection, q);
  };

  const handleCourseSortChange = (columnId, isDesc) => {
    if (columnId !== "name") return;
    const nextDirection = isDesc ? "desc" : "asc";
    setCourseSortDirection(nextDirection);
    coursesCacheRef.current.clear();
    setCoursesPagination((prev) => ({ ...prev, currentPage: 1 }));
    loadCourses(1, coursesPagination.itemsPerPage, nextDirection, appliedCourseSearchRef.current);
  };

  const filterAccommodations = (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === "") {
      setFilteredAccommodations(accommodations);
      return;
    }

    const filtered = accommodations.filter((accommodation) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        accommodation.name?.toLowerCase().includes(searchLower) ||
        accommodation.description?.toLowerCase().includes(searchLower) ||
        accommodation.location?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredAccommodations(filtered);
  };

  const handleAccommodationSearchChange = (value) => {
    setGlobalAccommodationSearchFilter(value);
    filterAccommodations(value);
  };

  const handleToggleCourseStatus = async (course) => {
    if (courseStatusUpdateLoading) return;

    const newStatus = !course.isActive;
    setCourseStatusUpdateLoading(true);

    setCourses((prevCourses) =>
      prevCourses.map((item) => (item.id === course.id ? { ...item, isActive: newStatus } : item))
    );
    setFilteredCourses((prevFiltered) =>
      prevFiltered.map((item) => (item.id === course.id ? { ...item, isActive: newStatus } : item))
    );

    try {
      const fullCourseData = await CourseService.getCourseById(course.id);

      await CourseService.updateCourse(course.id, {
        ...fullCourseData,
        isActive: newStatus,
      });
    } catch (error) {
      console.error("Error updating programme status:", error);
      setCourses((prevCourses) =>
        prevCourses.map((item) =>
          item.id === course.id ? { ...item, isActive: course.isActive } : item
        )
      );
      setFilteredCourses((prevFiltered) =>
        prevFiltered.map((item) =>
          item.id === course.id ? { ...item, isActive: course.isActive } : item
        )
      );
      alert(`Failed to update programme status: ${error.message}`);
    } finally {
      setCourseStatusUpdateLoading(false);
    }
  };

  const handleToggleAccommodationStatus = async (accommodation) => {
    if (accommodationStatusUpdateLoading) return;

    const newStatus = !accommodation.isActive;
    setAccommodationStatusUpdateLoading(true);

    setAccommodations((prevAccommodations) =>
      prevAccommodations.map((item) =>
        item.id === accommodation.id ? { ...item, isActive: newStatus } : item
      )
    );
    setFilteredAccommodations((prevFiltered) =>
      prevFiltered.map((item) =>
        item.id === accommodation.id ? { ...item, isActive: newStatus } : item
      )
    );

    try {
      const fullAccommodationData = await AccommodationService.getAccommodationById(
        accommodation.id
      );

      await AccommodationService.updateAccommodation(accommodation.id, {
        ...fullAccommodationData,
        isActive: newStatus,
      });
    } catch (error) {
      console.error("Error updating accommodation status:", error);
      setAccommodations((prevAccommodations) =>
        prevAccommodations.map((item) =>
          item.id === accommodation.id ? { ...item, isActive: accommodation.isActive } : item
        )
      );
      setFilteredAccommodations((prevFiltered) =>
        prevFiltered.map((item) =>
          item.id === accommodation.id ? { ...item, isActive: accommodation.isActive } : item
        )
      );
      alert(`Failed to update accommodation status: ${error.message}`);
    } finally {
      setAccommodationStatusUpdateLoading(false);
    }
  };

  const handleDeleteCourse = (row) => {
    handleDeleteClick(row);
  };

  const handleOpenAccommodationModal = (mode = "add", accommodationData = null) => {
    const searchInput = document.querySelector('input[placeholder*="Accommodation"]');
    if (searchInput && searchInput.value) {
      setSavedAccommodationSearchValue(searchInput.value);
    } else if (globalAccommodationSearchFilter) {
      setSavedAccommodationSearchValue(globalAccommodationSearchFilter);
    }

    setAccommodationModalMode(mode);
    setSelectedAccommodation(accommodationData);
    setIsAccommodationModalOpen(true);
  };

  const handleCloseAccommodationModal = () => {
    setIsAccommodationModalOpen(false);
    setSelectedAccommodation(null);

    if (savedAccommodationSearchValue) {
      setGlobalAccommodationSearchFilter(savedAccommodationSearchValue);
      filterAccommodations(savedAccommodationSearchValue);
    }
  };

  const handleViewAccommodation = async (row) => {
    try {
      const fullAccommodationData = await AccommodationService.getAccommodationById(row.id);
      handleOpenAccommodationModal("view", fullAccommodationData);
    } catch (error) {
      console.error("Error loading accommodation data for viewing:", error);
      handleOpenAccommodationModal("view", row);
    }
  };

  const handleEditAccommodation = async (row) => {
    try {
      const fullAccommodationData = await AccommodationService.getAccommodationById(row.id);
      handleOpenAccommodationModal("edit", fullAccommodationData);
    } catch (error) {
      console.error("Error loading accommodation data for editing:", error);
      handleOpenAccommodationModal("edit", row);
    }
  };

  const handleDuplicateAccommodation = async (row) => {
    try {
      const fullAccommodationData = await AccommodationService.getAccommodationById(row.id);

      let feesData = [];
      try {
        feesData = await AccommodationFeeService.getAccommodationFees(row.id);
      } catch (feeError) {}

      const duplicateData = {
        ...fullAccommodationData,
        id: undefined,
        name: `${fullAccommodationData.name} (Copy)`,
        fees: feesData || [],
      };
      handleOpenAccommodationModal("add", duplicateData);
    } catch (error) {
      console.error("Error loading accommodation data for duplication:", error);
      const duplicateData = {
        ...row,
        id: undefined,
        name: `${row.name} (Copy)`,
      };
      handleOpenAccommodationModal("add", duplicateData);
    }
  };

  const handleDeleteAccommodationClick = (row) => {
    setAccommodationToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleDeleteAccommodationConfirm = async () => {
    if (!accommodationToDelete) return;

    setAccommodations((prevAccommodations) =>
      (Array.isArray(prevAccommodations) ? prevAccommodations : []).filter(
        (acc) => acc.id !== accommodationToDelete.id
      )
    );

    setDeleteDialogOpen(false);
    setAccommodationToDelete(null);

    try {
      await AccommodationService.deleteAccommodation(accommodationToDelete.id);
    } catch (error) {
      console.error("Error deleting accommodation:", error);
      setAccommodations((prevAccommodations) => [...prevAccommodations, accommodationToDelete]);
      alert(`Failed to delete accommodation: ${error.message}`);
    }
  };

  const customDataTableData = useMemo(
    () => ({
      ...dataTableData,
      rows: filteredCourses.map((course) => {
        let price = 0;
        let priceSuffix = "";
        if (course.simplePrices && course.simplePrices.length > 0) {
          price = course.simplePrices[0].price;
          priceSuffix = ` / ${course.simplePrices[0].period || "week"}`;
        } else if (course.flexibleDurationPrices && course.flexibleDurationPrices.length > 0) {
          price = course.flexibleDurationPrices[0].pricePerWeek;
          priceSuffix = " / week";
        } else if (course.fixedDurationPrices && course.fixedDurationPrices.length > 0) {
          price = course.fixedDurationPrices[0].totalPrice;
          priceSuffix = ` for ${course.fixedDurationPrices[0].durationWeeks} wk`;
        }

        const durationCount = course.durationCount || 0;
        const durationUnit = course.durationUnit || "hours";
        const durationType = course.durationType || "perWeek";

        const unitLabel = durationUnit === "hours" ? "h" : durationUnit;
        const periodLabel = durationType.replace("per", "").toLowerCase() || "week";
        const durationText = `${durationCount} ${unitLabel} / ${periodLabel}`;

        const typeLabel = getCourseTypeDisplay(course) || "N/A";

        const rowData = {
          id: course.id,
          name: course.name,
          periodicity: parseCoursePeriodicity(course.periodicity),
          type: typeLabel,
          duration: durationText,
          price: `${formatMoney(price, campus?.currency || "EUR")}${priceSuffix}`,
          currency: campus?.currency || "EUR",
          isActive: course.isActive,
          actions: {
            row: course,
            onView: handleViewCourse,
            onEdit: handleEditCourse,
            onDelete: handleDeleteCourse,
            onPriceList: handlePriceList,
            onDuplicate: handleDuplicateCourse,
            onToggleStatus: handleToggleCourseStatus,
            isUpdating: courseStatusUpdateLoading,
            hideRowMutations: hideCampusTableMutations,
          },
        };

        return rowData;
      }),
    }),
    [
      filteredCourses,
      campus?.currency,
      handleDuplicateCourse,
      courseStatusUpdateLoading,
      hideCampusTableMutations,
    ]
  );

  const customAccommodationTableData = {
    columns: [
      {
        Header: "Accommodation Name",
        accessor: "name",
        width: "20%",
        Cell: AccommodationNameCell,
      },
      { Header: "Room Type", accessor: "type", width: "12%" },
      { Header: "Category", accessor: "category", width: "12%" },
      {
        Header: "Location",
        accessor: "location",
        width: "15%",
        Cell: AccommodationLocationCell,
      },
      { Header: "Price per Week", accessor: "price", width: "12%" },
      { Header: "Regime", accessor: "regime", width: "10%" },
      {
        Header: "Photos",
        accessor: "photos",
        width: "10%",
        Cell: CampusPhotosCell,
      },
      {
        Header: "Actions",
        accessor: "actions",
        width: "9%",
        Cell: ActionsCellWrapper,
      },
    ],
    rows: (Array.isArray(filteredAccommodations) ? filteredAccommodations : []).map(
      (accommodation) => {
        const priceText = getPricePreview(accommodation);

        const rowData = {
          id: accommodation.id,
          name: accommodation.name,
          type: accommodation.type || "N/A",
          category: accommodation.category
            ? accommodation.category.charAt(0).toUpperCase() + accommodation.category.slice(1)
            : "N/A",
          location: accommodation.address,
          price: priceText,
          regime:
            accommodation.regimeType === "NoMeals" ? "Self Catering" : accommodation.regimeType,
          photos: accommodation.images?.map((img) => img.imageUrl) || [],
          actions: {
            row: accommodation,
            onView: handleViewAccommodation,
            onEdit: handleEditAccommodation,
            onDelete: handleDeleteAccommodationClick,
            onDuplicate: handleDuplicateAccommodation,
            onToggleStatus: handleToggleAccommodationStatus,
            isUpdating: accommodationStatusUpdateLoading,
            entityType: "accommodation",
            hideRowMutations: hideCampusTableMutations,
          },
        };

        return rowData;
      }
    ),
  };

  const renderCoursesList = () => (
    <SoftBox>
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <SoftTypography variant="h6" fontWeight="medium">
          Programmes
        </SoftTypography>
        {canAddCourse && (
          <SoftButton
            variant="gradient"
            color="dark"
            size="small"
            startIcon={<Icon>add</Icon>}
            onClick={handleAddCourse}
          >
            Add Programme
          </SoftButton>
        )}
      </SoftBox>

      <SoftBox mb={3} display="flex" alignItems="stretch" gap={1} flexWrap="wrap">
        <SoftBox flex={1} minWidth={200}>
          <SoftInput
            placeholder="Search Programmes..."
            value={globalCourseSearchFilter}
            onChange={({ currentTarget }) => handleCourseSearchChange(currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCourseSearchSubmit();
              }
            }}
            icon={{
              component: <Icon>search</Icon>,
              direction: "left",
            }}
          />
        </SoftBox>
        <SoftButton variant="gradient" color="dark" size="small" onClick={handleCourseSearchSubmit}>
          Search
        </SoftButton>
      </SoftBox>

      {isLoadingCourses ? (
        <SoftBox display="flex" justifyContent="center" alignItems="center" p={4}>
          <SoftTypography variant="body2" color="text.secondary">
            Loading programmes...
          </SoftTypography>
        </SoftBox>
      ) : (
        <DataTable
          table={customDataTableData}
          entriesPerPage={{
            defaultValue: coursesPagination.itemsPerPage,
            entries: [5, 10, 15, 20, 25],
          }}
          canSearch={false}
          serverPagination={{
            currentPage: coursesPagination.currentPage,
            totalPages: coursesPagination.totalPages,
            totalItems: coursesPagination.totalItems,
            itemsPerPage: coursesPagination.itemsPerPage,
          }}
          serverSortBy={[{ id: "name", desc: courseSortDirection === "desc" }]}
          onSortChange={handleCourseSortChange}
          onPageChange={(page) => {
            console.log("[CampusLists] onPageChange", {
              page,
              currentPage: coursesPagination.currentPage,
            });
            loadCourses(
              page,
              coursesPagination.itemsPerPage,
              courseSortDirection,
              appliedCourseSearchRef.current
            );
          }}
          onPageSizeChange={(size) => {
            console.log("[CampusLists] onPageSizeChange", { size });
            coursesCacheRef.current.clear();
            setCoursesPagination((prev) => ({ ...prev, itemsPerPage: size, currentPage: 1 }));
            loadCourses(1, size, courseSortDirection, appliedCourseSearchRef.current);
          }}
        />
      )}
    </SoftBox>
  );

  const renderAccommodationList = () => (
    <SoftBox>
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <SoftTypography variant="h6" fontWeight="medium">
          Accommodation
        </SoftTypography>
        {canAddAccommodation && (
          <SoftButton
            variant="gradient"
            color="dark"
            size="small"
            startIcon={<Icon>add</Icon>}
            onClick={() => handleOpenAccommodationModal("add")}
          >
            Add Accommodation
          </SoftButton>
        )}
      </SoftBox>

      <SoftBox mb={3}>
        <SoftInput
          placeholder="Search Accommodations..."
          value={globalAccommodationSearchFilter}
          onChange={({ currentTarget }) => handleAccommodationSearchChange(currentTarget.value)}
          icon={{
            component: <Icon>search</Icon>,
            direction: "left",
          }}
        />
      </SoftBox>

      {isLoadingAccommodations ? (
        <SoftBox display="flex" justifyContent="center" alignItems="center" p={4}>
          <SoftTypography variant="body2" color="text.secondary">
            Loading accommodations...
          </SoftTypography>
        </SoftBox>
      ) : (
        <DataTable
          table={customAccommodationTableData}
          entriesPerPage={{
            defaultValue: 10,
            entries: [5, 10, 15, 20, 25],
          }}
          canSearch={false}
        />
      )}
    </SoftBox>
  );

  const renderTabContent = () => {
    switch (tabValue) {
      case 0:
        return renderCoursesList();
      case 1:
        return renderAccommodationList();
      default:
        return null;
    }
  };

  return (
    <Card>
      <SoftBox p={3}>
        <AppBar position="static">
          <Tabs orientation={tabsOrientation} value={tabValue} onChange={handleSetTabValue}>
            <Tab label="Programmes" />
            <Tab label="Accommodation" />
          </Tabs>
        </AppBar>
        <SoftBox mt={3} key={tabValue}>
          {renderTabContent()}
        </SoftBox>

        <CourseModal
          open={isCourseModalOpen}
          onClose={handleCloseCourseModal}
          mode={courseModalMode}
          courseData={selectedCourse}
          campusId={campusId}
        />

        <AccommodationModal
          open={isAccommodationModalOpen}
          onClose={handleCloseAccommodationModal}
          mode={accommodationModalMode}
          accommodationData={selectedAccommodation}
          schoolId={schoolId}
          campusId={campusId}
          onSuccess={(accommodationOrId) => {
            const result = accommodationOrId;
            const isFullAccommodation = result && typeof result === "object" && result.id;
            if (isFullAccommodation) {
              setAccommodations((prev) => {
                const list = Array.isArray(prev) ? prev : [];
                const idx = list.findIndex((acc) => acc.id === result.id);
                if (idx >= 0) {
                  const next = [...list];
                  next[idx] = { ...next[idx], ...result };
                  return next;
                }
                return [...list, result];
              });
              setFilteredAccommodations((prev) => {
                const list = Array.isArray(prev) ? prev : [];
                const idx = list.findIndex((acc) => acc.id === result.id);
                if (idx >= 0) {
                  const next = [...list];
                  next[idx] = { ...next[idx], ...result };
                  return next;
                }
                return [...list, result];
              });
            } else {
              const id = typeof result === "string" ? result : result?.id;
              if (id) {
                const paramName =
                  accommodationModalMode === "edit"
                    ? "updatedAccommodationId"
                    : "newAccommodationId";
                navigate(`/schools/view/${schoolId}/campus/${campusId}?${paramName}=${id}`);
              }
            }
          }}
        />

        <PriceListModal
          open={isPriceListModalOpen}
          onClose={() => {
            setIsPriceListModalOpen(false);
            setSelectedCourseForPriceList(null);
          }}
          courseId={selectedCourseForPriceList?.id}
          courseName={selectedCourseForPriceList?.name}
          campusId={campusId}
        />

        <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
          <DialogTitle>
            <Typography variant="h6" color="error">
              Confirm Delete
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Typography variant="body1">
              Are you sure you want to delete the {courseToDelete ? "course" : "accommodation"}{" "}
              <strong>&ldquo;{courseToDelete?.name || accommodationToDelete?.name}&rdquo;</strong>?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} color="inherit">
              Cancel
            </Button>
            <Button
              onClick={courseToDelete ? handleDeleteConfirm : handleDeleteAccommodationConfirm}
              color="error"
              variant="contained"
              autoFocus
            >
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </SoftBox>
    </Card>
  );
}

CampusLists.propTypes = {
  campus: PropTypes.object.isRequired,
};

export default CampusLists;
