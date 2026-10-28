import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import Icon from "@mui/material/Icon";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

import dataTableData from "./data/dataTableData";
import CourseFilters from "./components/CourseFilters";
import { CourseService } from "services/courseService";
import { buildDuplicateCoursePayload } from "utils/duplicateCourseUtils";
import CourseModal from "layouts/courses/add-course-modal";
import PriceListModal from "layouts/courses/price-list-modal";
import { parseCoursePeriodicity } from "utils/periodicityUtils";
import { useCan } from "permissions/useCan";
import { F } from "permissions/features";
import { formatCourseType } from "utils/courseTypeUtils";
import { formatMoney } from "services/currencyService";

const formatProgramType = (programTypeName) => formatCourseType(programTypeName) || "N/A";

function CoursesList() {
  const navigate = useNavigate();
  const { can } = useCan();
  const hideCourseRowMutations = !can(F.CAMPUS_PAGE_COURSE_ROW_MUTATE);
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [globalSearchFilter, setGlobalSearchFilter] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [filters, setFilters] = useState({
    countryIds: [],
    schoolIds: [],
    campusIds: [],
    programTypes: [],
    minPrice: "",
    maxPrice: "",
    sortBy: "name",
    sortDirection: "asc",
  });
  const [appliedFilters, setAppliedFilters] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [courseModalMode, setCourseModalMode] = useState("view");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isPriceListModalOpen, setIsPriceListModalOpen] = useState(false);
  const [selectedCourseForPriceList, setSelectedCourseForPriceList] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [availableCountries, setAvailableCountries] = useState([]);
  const [availableSchools, setAvailableSchools] = useState([]);
  const [availableCampuses, setAvailableCampuses] = useState([]);

  const coursesCacheRef = useRef(new Map());

  const getCacheKey = (filters, page, limit, search) => {
    const normalizedFilters = {
      countryIds: (filters?.countryIds || []).sort().join(","),
      schoolIds: (filters?.schoolIds || []).sort().join(","),
      campusIds: (filters?.campusIds || []).sort().join(","),
      programTypes: (filters?.programTypes || []).sort().join(","),
      minPrice: filters?.minPrice || "",
      maxPrice: filters?.maxPrice || "",
      sortBy: "name",
      sortDirection: filters?.sortDirection || "asc",
    };
    const filtersStr = JSON.stringify(normalizedFilters);
    return `${filtersStr}_${page}_${limit}_${search || ""}`;
  };

  const loadCourses = async (customFilters = null, page = 1, limit = 10, searchValue = null) => {
    const filtersToUse = customFilters !== null ? customFilters : appliedFilters;
    const searchToUse = searchValue !== null ? searchValue : globalSearchFilter;
    
    const cacheKey = getCacheKey(filtersToUse, page, limit, searchToUse);

    const cachedData = coursesCacheRef.current.get(cacheKey);
    
    if (cachedData) {
      setCourses(cachedData.courses);
      setFilteredCourses(cachedData.filteredCourses);
      setPagination(cachedData.pagination);
      setAvailableCountries(cachedData.availableCountries);
      setAvailableSchools(cachedData.availableSchools);
      setAvailableCampuses(cachedData.availableCampuses);
      return;
    }
    setIsLoading(true);
    try {

      const response = await CourseService.getAllCourses({
        page: page,
        limit: limit,
        sortBy: "name",
        sortDirection: filtersToUse.sortDirection || "asc",
        search: searchToUse || "",
        countryIds: filtersToUse.countryIds || [],
        cityIds: filtersToUse.cityIds || [],
        campusIds: filtersToUse.campusIds || [],
        courseIds: filtersToUse.courseIds || [],
        programTypes: filtersToUse.programTypes || [],
        minPrice: filtersToUse.minPrice || "",
        maxPrice: filtersToUse.maxPrice || "",
        bestSeller: filtersToUse.bestSeller,
        startDateFrom: filtersToUse.startDateFrom,
        startDateTo: filtersToUse.startDateTo,
        duration: filtersToUse.duration,
        hasAccommodation: filtersToUse.hasAccommodation,
      });

      const coursesData = response.data || [];

      if (response.meta) {
        setPagination({
          currentPage: response.meta.currentPage || page,
          totalPages: response.meta.totalPages || 1,
          totalItems: response.meta.totalItems || 0,
          itemsPerPage: limit,
        });
      }

      const countriesMap = new Map();
      const schoolsMap = new Map();
      const campusesMap = new Map();

      const coursesWithDetails = coursesData.map((course) => {
        let schoolName = "N/A";
        let schoolLogo = null;
        let campusName = "N/A";
        let countryId = null;
        let schoolId = null;

        if (course.campus) {
          campusName = course.campus.name || "N/A";
          
          if (course.campus.id) {
            campusesMap.set(course.campus.id, {
              id: course.campus.id,
              name: course.campus.name,
              schoolId: course.campus.school?.id || course.campus.schoolId,
            });
          }
          
          if (course.campus.country) {
            countryId = course.campus.country.id || null;
            if (countryId && course.campus.country.name) {
              countriesMap.set(countryId, {
                id: countryId,
                name: course.campus.country.name,
              });
            }
          } else if (course.campus.city?.countryId) {
            countryId = course.campus.city.countryId;
          }
          
          if (course.campus.school) {
            schoolId = course.campus.school.id || course.campus.schoolId || null;
            schoolName = course.campus.school.name || "N/A";
            if (course.campus.school.logo) {
              schoolLogo = course.campus.school.logo;
            }
            if (schoolId && schoolName !== "N/A") {
              schoolsMap.set(schoolId, {
                id: schoolId,
                name: schoolName,
                countryId: countryId,
              });
            }
          } else if (course.campus.schoolId) {
            schoolId = course.campus.schoolId;
          }
        } else if (course.campusId) {
          campusName = "N/A";
        }

        let programType = "N/A";
        if (course.types && course.types.length > 0) {
          const programTypes = course.types
            .flatMap((t) => t.programTypes?.map((pt) => formatProgramType(pt.name)) || [])
            .filter(Boolean);
          if (programTypes.length > 0) {
            programType = programTypes.join(", ");
          }
        } else if (course.type) {
          programType = formatProgramType(course.type);
        } else if (course.courseType) {
          programType = formatProgramType(course.courseType);
        }

        const coursePrice =
          course.summary?.courseMinTotalPricePerWeek ||
          course.summary?.courseTotalPrice ||
          course.summary?.courseBasePrice ||
          course.priceWithDiscount ||
          course.totalPrice ||
          course.price ||
          course.minPrice ||
          "N/A";

        return {
          ...course,
          school: schoolName,
          schoolLogo: schoolLogo,
          campus: campusName,
          programType,
          price: typeof coursePrice === "number" ? formatMoney(coursePrice, "EUR") : coursePrice,
          countryId,
          schoolId,
        };
      });

      const availableCountriesData = Array.from(countriesMap.values());
      const availableSchoolsData = Array.from(schoolsMap.values());
      const availableCampusesData = Array.from(campusesMap.values());

      setCourses(coursesWithDetails);
      setAvailableCountries(availableCountriesData);
      setAvailableSchools(availableSchoolsData);
      setAvailableCampuses(availableCampusesData);

      const searchFiltered = filterCourses(searchToUse, coursesWithDetails);
      setFilteredCourses(searchFiltered);

      const cacheData = {
        courses: coursesWithDetails,
        filteredCourses: searchFiltered,
        pagination: {
          currentPage: response.meta?.currentPage || page,
          totalPages: response.meta?.totalPages || 1,
          totalItems: response.meta?.totalItems || 0,
          itemsPerPage: limit,
        },
        availableCountries: availableCountriesData,
        availableSchools: availableSchoolsData,
        availableCampuses: availableCampusesData,
      };

      coursesCacheRef.current.set(cacheKey, cacheData);
    } catch (error) {
      console.error("Error loading programmes:", error);
      setCourses([]);
      setFilteredCourses([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCourses(null, 1, 10);
  }, []);

  useEffect(() => {
    setSearchInputValue(globalSearchFilter);
  }, [globalSearchFilter]);

  const applyFilters = async () => {
    const filtersToApply = { ...filters };

    if (
      filtersToApply.schoolIds &&
      filtersToApply.schoolIds.length > 0 &&
      (!filtersToApply.campusIds || filtersToApply.campusIds.length === 0)
    ) {
      const relevantCampuses = availableCampuses.filter((campus) =>
        filtersToApply.schoolIds.includes(campus.schoolId)
      );
      filtersToApply.campusIds = relevantCampuses.map((c) => c.id);
    }

    setAppliedFilters(filtersToApply);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    coursesCacheRef.current.clear();
    loadCourses(filtersToApply, 1, pagination.itemsPerPage);
  };

  const resetFilters = () => {
    const defaultFilters = {
      countryIds: [],
      schoolIds: [],
      campusIds: [],
      programTypes: [],
      minPrice: "",
      maxPrice: "",
      sortBy: "name",
      sortDirection: "asc",
    };
    setFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setGlobalSearchFilter("");
    setSearchInputValue("");
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    coursesCacheRef.current.clear();
    loadCourses(defaultFilters, 1, pagination.itemsPerPage, "");
  };

  const filterCourses = (searchTerm, coursesToFilter = courses) => {
    if (!searchTerm || searchTerm.trim() === "") {
      return coursesToFilter;
    }

    const filtered = coursesToFilter.filter((course) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        course.name?.toLowerCase().includes(searchLower) ||
        course.programType?.toLowerCase().includes(searchLower) ||
        course.school?.toLowerCase().includes(searchLower) ||
        course.campus?.toLowerCase().includes(searchLower)
      );
    });

    return filtered;
  };

  const applyLocalFilters = (coursesToFilter, filtersToApply = null) => {
    const filtersToUse = filtersToApply || appliedFilters;
    let filtered = [...coursesToFilter];

    if (filtersToUse.countryIds && filtersToUse.countryIds.length > 0) {
      filtered = filtered.filter((course) => {
        return course.countryId && filtersToUse.countryIds.includes(course.countryId);
      });
    }

    if (filtersToUse.schoolIds && filtersToUse.schoolIds.length > 0) {
      filtered = filtered.filter((course) => {
        return course.schoolId && filtersToUse.schoolIds.includes(course.schoolId);
      });
    }

    if (filtersToUse.campusIds && filtersToUse.campusIds.length > 0) {
      filtered = filtered.filter((course) => {
        return course.campusId && filtersToUse.campusIds.includes(course.campusId);
      });
    }

    if (filtersToUse.programTypes && filtersToUse.programTypes.length > 0) {
      filtered = filtered.filter((course) => {
        const courseType = course.type || course.courseType || course.programType;
        return filtersToUse.programTypes.some((type) => {
          return (
            courseType?.toLowerCase().includes(type.toLowerCase()) ||
            type.toLowerCase().includes(courseType?.toLowerCase())
          );
        });
      });
    }

    if (filtersToUse.minPrice) {
      filtered = filtered.filter((course) => {
        const price = Number(course.price) || Number(course.minPrice) || 0;
        return price >= Number(filtersToUse.minPrice);
      });
    }

    if (filtersToUse.maxPrice) {
      filtered = filtered.filter((course) => {
        const price = Number(course.price) || Number(course.minPrice) || 0;
        return price <= Number(filtersToUse.maxPrice);
      });
    }

    return filtered;
  };

  const handleSearchInputChange = (value) => {
    setSearchInputValue(value);
  };

  const handleSearchSubmit = () => {
    setGlobalSearchFilter(searchInputValue);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    coursesCacheRef.current.clear();
    loadCourses(appliedFilters, 1, pagination.itemsPerPage, searchInputValue);
  };

  const handleSearchBlur = () => {
    if (searchInputValue !== globalSearchFilter) {
      handleSearchSubmit();
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
    loadCourses(appliedFilters, newPage, pagination.itemsPerPage);
  };

  const handlePageSizeChange = (newSize) => {
    setPagination((prev) => ({ ...prev, itemsPerPage: newSize, currentPage: 1 }));
    loadCourses(appliedFilters, 1, newSize);
  };

  const handleSortChange = (columnId, isDesc) => {
    if (columnId !== "name") return;
    const sortDirectionNext = isDesc ? "desc" : "asc";
    const nextApplied = { ...appliedFilters, sortBy: "name", sortDirection: sortDirectionNext };
    setFilters((prev) => ({ ...prev, sortBy: "name", sortDirection: sortDirectionNext }));
    setAppliedFilters(nextApplied);
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    coursesCacheRef.current.clear();
    loadCourses(nextApplied, 1, pagination.itemsPerPage, globalSearchFilter);
  };

  const handleRowClick = (row) => {
    const course = courses.find((c) => c.id === row.id);
    if (course && course.campusId) {
      navigate(`/schools/view/${course.schoolId}/campus/${course.campusId}`);
    }
  };

  const handleView = (course) => {
    setSelectedCourse(course);
    setCourseModalMode("view");
    setIsCourseModalOpen(true);
  };

  const handleCloseCourseModal = () => {
    setIsCourseModalOpen(false);
    setSelectedCourse(null);
  };

  const handlePriceList = (course) => {
    setSelectedCourseForPriceList(course);
    setIsPriceListModalOpen(true);
  };

  const handleEdit = (course) => {
    if (course.campusId) {
      navigate(
        `/schools/view/${course.schoolId}/campus/${course.campusId}/add-course/${course.id}`
      );
    }
  };

  const handleDelete = (course) => {
    if (window.confirm(`Are you sure you want to delete programme "${course.name}"?`)) {
      CourseService.deleteCourse(course.id)
        .then(() => {
          coursesCacheRef.current.clear();
          loadCourses(appliedFilters, pagination.currentPage, pagination.itemsPerPage);
        })
        .catch((error) => {
          console.error("Error deleting programme:", error);
          alert(`Failed to delete programme: ${error.message}`);
        });
    }
  };

  const handleCourseModalSuccess = () => {
    coursesCacheRef.current.clear();
    loadCourses(appliedFilters, pagination.currentPage, pagination.itemsPerPage);
  };

  const handlePriceListModalSuccess = () => {
    coursesCacheRef.current.clear();
    loadCourses(appliedFilters, pagination.currentPage, pagination.itemsPerPage);
  };

  const handleDuplicate = async (course) => {
    try {
      const duplicateData = await buildDuplicateCoursePayload(course);
      navigate(`/schools/view/${course.schoolId}/campus/${course.campusId}/add-course/new`, {
        state: { duplicateData },
      });
    } catch (error) {
      console.error("Error loading programme data for duplication:", error);
      alert(`Failed to duplicate programme: ${error.message}`);
    }
  };

  const handleToggleStatus = async (course) => {
    if (statusUpdateLoading) return;

    const newStatus = !course.isActive;
    setStatusUpdateLoading(true);

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
        prevCourses.map((item) => (item.id === course.id ? { ...item, isActive: course.isActive } : item))
      );
      setFilteredCourses((prevFiltered) =>
        prevFiltered.map((item) => (item.id === course.id ? { ...item, isActive: course.isActive } : item))
      );
      alert(`Failed to update programme status: ${error.message}`);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const customDataTableData = {
    ...dataTableData,
    rows: filteredCourses.map((course) => ({
      id: course.id,
      periodicity: parseCoursePeriodicity(course.periodicity),
      name: course.name || "N/A",
      programType: course.programType || "N/A",
      school: course.school || "N/A",
      campus: course.campus || "N/A",
      price: course.price || "N/A",
      schoolId: course.schoolId,
      campusId: course.campusId,
      actions: {
        row: course,
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDelete,
        onPriceList: handlePriceList,
        onDuplicate: handleDuplicate,
        onToggleStatus: handleToggleStatus,
        isUpdating: statusUpdateLoading,
        hideRowMutations: hideCourseRowMutations,
      },
    })),
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox my={3}>
        <Card>
          <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" p={3}>
            <SoftBox lineHeight={1}>
              <SoftTypography variant="h5" fontWeight="medium">
                Programmes List
              </SoftTypography>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                Manage all programmes with search and filtering.
              </SoftTypography>
            </SoftBox>
          </SoftBox>
          <SoftBox px={3} pb={2}>
            <CourseFilters
              filters={filters}
              onFiltersChange={setFilters}
              onApplyFilters={applyFilters}
              onResetFilters={resetFilters}
              availableCountries={availableCountries}
              availableSchools={availableSchools}
              availableCampuses={availableCampuses}
            />
          </SoftBox>
          {isLoading ? (
            <SoftBox display="flex" justifyContent="center" alignItems="center" p={4}>
              <SoftTypography variant="body2" color="text.secondary">
                Loading programmes...
              </SoftTypography>
            </SoftBox>
          ) : (
            <SoftBox
              sx={{
                "& .MuiTableContainer-root": {
                  marginTop: "-40px",
                },
              }}
            >
              <SoftBox
                display="flex"
                gap={2}
                alignItems="center"
                sx={{
                  marginTop: "-30px",
                  marginBottom: "46px",
                  paddingLeft: "20px",
                  paddingRight: "20px",
                }}
              >
                <SoftBox flex={1}>
                  <SoftInput
                    placeholder="Search programmes..."
                    value={searchInputValue}
                    onChange={({ currentTarget }) => {
                      handleSearchInputChange(currentTarget.value);
                    }}
                    onBlur={handleSearchBlur}
                    onKeyDown={handleSearchKeyDown}
                    icon={{
                      component: <Icon>search</Icon>,
                      direction: "left",
                    }}
                  />
                </SoftBox>
                <SoftButton
                  variant="gradient"
                  color="info"
                  onClick={handleSearchSubmit}
                  startIcon={<Icon>search</Icon>}
                >
                  Search
                </SoftButton>
              </SoftBox>
              <DataTable
                table={customDataTableData}
                entriesPerPage={{
                  defaultValue: pagination.itemsPerPage,
                  entries: [5, 10, 15, 20, 25],
                }}
                canSearch={false}
                serverPagination={{
                  currentPage: pagination.currentPage,
                  totalPages: pagination.totalPages,
                  totalItems: pagination.totalItems,
                  itemsPerPage: pagination.itemsPerPage,
                }}
                serverSortBy={[
                  { id: "name", desc: appliedFilters.sortDirection === "desc" },
                ]}
                onSortChange={handleSortChange}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onRowClick={handleRowClick}
              />
            </SoftBox>
          )}
        </Card>
      </SoftBox>

      <CourseModal
        open={isCourseModalOpen}
        onClose={handleCloseCourseModal}
        mode={courseModalMode}
        courseData={selectedCourse}
        campusId={selectedCourse?.campusId || null}
        onSuccess={handleCourseModalSuccess}
      />

      <PriceListModal
        open={isPriceListModalOpen}
        onClose={() => {
          setIsPriceListModalOpen(false);
          setSelectedCourseForPriceList(null);
        }}
        courseId={selectedCourseForPriceList?.id}
        courseName={selectedCourseForPriceList?.name}
        campusId={selectedCourseForPriceList?.campusId || null}
        onSuccess={handlePriceListModalSuccess}
      />
    </DashboardLayout>
  );
}

export default CoursesList;
