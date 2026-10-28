import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  Divider,
  FormControlLabel,
  Checkbox,
  CircularProgress,
} from "@mui/material";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SoftDatePicker from "components/SoftDatePicker";
import SoftSelect from "components/SoftSelect";

import { DiscountService } from "services/discountService";
import { CourseService } from "services/courseService";
import { SchoolService } from "services/schoolService";
import { CampusService } from "services/campusService";
import DiscountImageUpload from "./components/DiscountImageUpload";
import { useModalLoadingState } from "hooks/useModalLoadingState";
import { OptimizedDataService } from "services/optimizedDataService";
import { parseCoursePeriodicity } from "utils/periodicityUtils"

const INITIAL_FORM_DATA = {
  name: "",
  startDate: "",
  endDate: "",
  eligibleTravelStartDate: "",
  eligibleTravelEndDate: "",
  discountType: "percentage",
  discountAmount: "",
  courseLinked: [],
  description: "",
  applyOnlyToTuition: false,
  neverExpires: false,
  selectedSchools: [],
  selectedCampuses: [],
  image: null,
};

const NEVER_EXPIRES_DATES = {
  startDate: "2020-01-01T00:00:00.000Z",
  endDate: "2050-12-31T00:00:00.000Z",
};

const DISCOUNT_SCHOOL_PAGE_SIZE = 20;

function DiscountModal({ open, onClose, mode = "add", discountData = null, onSuccess }) {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [courses, setCourses] = useState([]);
  const [schools, setSchools] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [schoolsLoadingMore, setSchoolsLoadingMore] = useState(false);

  const schoolListSearchRef = useRef("");
  const schoolListNextPageRef = useRef(1);
  const schoolListHasMoreRef = useRef(false);
  const schoolFetchGenRef = useRef(0);
  const schoolListLoadingMoreRef = useRef(false);

  const {
    isInitializing,
    isAnyLoading,
    canSave,
    canEdit,
    setLoading,
    setInitializing,
    isLoading,
    getSaveButtonText,
    getSelectPlaceholder,
    resetLoadingStates,
  } = useModalLoadingState(["schools", "campuses", "courses"]);

  const extractDateFromUTC = (utcDateString) => {
    if (!utcDateString) return "";

    const dateMatch = utcDateString.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return dateMatch[1];
    }

    return utcDateString;
  };

  const fetchDiscountSchoolsPage = useCallback(async (search, page) => {
    const result = await SchoolService.getSchools({
      search: search || "",
      limit: DISCOUNT_SCHOOL_PAGE_SIZE,
      page,
    });
    const rows = result.data || [];
    const meta = result.meta || {};
    const mapped = rows.map((s) => ({
      value: s.id,
      label: s.name || s.id,
    }));
    return { mapped, meta };
  }, []);

  const applySchoolListMeta = useCallback((meta, requestedPage) => {
    schoolListNextPageRef.current = (Number(meta.currentPage) || requestedPage) + 1;
    const curPage = Number(meta.currentPage) || requestedPage;
    const totalPages = Number(meta.totalPages) || 1;
    schoolListHasMoreRef.current =
      meta.hasNextPage === true ||
      (meta.hasNextPage !== false && curPage < totalPages);
  }, []);

  const loadSchools = async () => {
    schoolListSearchRef.current = "";
    setLoading("schools", true);
    const gen = ++schoolFetchGenRef.current;
    try {
      const { mapped, meta } = await fetchDiscountSchoolsPage("", 1);
      if (gen !== schoolFetchGenRef.current) return;
      setSchools(mapped);
      applySchoolListMeta(meta, 1);
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
      const { mapped, meta } = await fetchDiscountSchoolsPage(inputValue, 1);
      if (gen !== schoolFetchGenRef.current) return;
      setSchools(mapped);
      applySchoolListMeta(meta, 1);
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

  const handleDiscountSchoolInputChange = (inputValue, { action }) => {
    if (action !== "input-change") return;
    loadSchoolsForSearchInput(inputValue);
  };

  const loadMoreDiscountSchools = useCallback(async () => {
    if (
      !schoolListHasMoreRef.current ||
      schoolListLoadingMoreRef.current ||
      isLoading("schools")
    ) {
      return;
    }
    const genAtStart = schoolFetchGenRef.current;
    const search = schoolListSearchRef.current;
    const page = schoolListNextPageRef.current;
    schoolListLoadingMoreRef.current = true;
    setSchoolsLoadingMore(true);
    try {
      const { mapped, meta } = await fetchDiscountSchoolsPage(search, page);
      if (genAtStart !== schoolFetchGenRef.current) return;
      setSchools((prev) => {
        const seen = new Set(prev.map((o) => o.value));
        const add = mapped.filter((o) => !seen.has(o.value));
        return [...prev, ...add];
      });
      applySchoolListMeta(meta, page);
    } catch (error) {
      console.error("Error loading more schools:", error);
    } finally {
      schoolListLoadingMoreRef.current = false;
      setSchoolsLoadingMore(false);
    }
  }, [fetchDiscountSchoolsPage, applySchoolListMeta, isLoading]);

  const loadCampuses = async (schoolIds) => {
    if (!schoolIds || schoolIds.length === 0) {
      setCampuses([]);
      return;
    }

    setLoading("campuses", true);
    try {
      const campusesOptions = await OptimizedDataService.getCampusesForSchools(schoolIds);
      setCampuses(campusesOptions);
    } catch (error) {
      console.error("Error loading campuses:", error);
      setCampuses([]);
    } finally {
      setLoading("campuses", false);
    }
  };

  const loadCourses = async (campusIds) => {
    if (!campusIds || campusIds.length === 0) {
      setCourses([]);
      return;
    }

    setLoading("courses", true);
    try {
      const coursesOptions = await OptimizedDataService.getCoursesForCampuses(campusIds);
      setCourses(coursesOptions);
    } catch (error) {
      console.error("Error loading courses:", error);
      setCourses([]);
    } finally {
      setLoading("courses", false);
    }
  };

  useEffect(() => {
    const initializeModal = async () => {
      if (open) {
        setInitializing(true);

        try {
          await loadSchools();

          if (mode === "add") {
            setFormData(INITIAL_FORM_DATA);
            setErrors({});
          } else if (discountData) {
            const isNeverExpires =
              discountData.startDay === NEVER_EXPIRES_DATES.startDate &&
              discountData.endDay === NEVER_EXPIRES_DATES.endDate;

            const courseIds =
              discountData.courses?.map((c) => c.course?.id || c.courseId) ||
              discountData.courseIds ||
              [];

            const mappedData = {
              name: discountData.title || discountData.name || discountData.description || "",
              startDate: isNeverExpires ? "" : extractDateFromUTC(discountData.startDay),
              endDate: isNeverExpires ? "" : extractDateFromUTC(discountData.endDay),
              eligibleTravelStartDate: extractDateFromUTC(discountData.eligibleTravelStartDay),
              eligibleTravelEndDate: extractDateFromUTC(discountData.eligibleTravelEndDay),
              discountType: discountData.type === "percent" ? "percentage" : "fixed",
              discountAmount: discountData.value || 0,
              courseLinked: courseIds,
              description: discountData.description || "",
              applyOnlyToTuition: discountData.tuition || false,
              neverExpires: isNeverExpires,
              selectedSchools: [],
              selectedCampuses: [],
              image: discountData.image ? { imageUrl: discountData.image, isNew: false } : null,
            };

            setFormData(mappedData);
            setErrors({});

            if (courseIds.length > 0) {
              await initializeFromExistingCourses(courseIds);
            }
          }
        } catch (error) {
          console.error("Error initializing modal:", error);
        } finally {
          setInitializing(false);
        }
      } else {
        resetLoadingStates();
        OptimizedDataService.clearCache();
        setSchools([]);
        schoolListSearchRef.current = "";
        schoolListNextPageRef.current = 1;
        schoolListHasMoreRef.current = false;
        schoolFetchGenRef.current += 1;
      }
    };

    initializeModal();
  }, [open, mode, discountData, setInitializing, resetLoadingStates]);

  useEffect(() => {
    if (formData.selectedSchools && formData.selectedSchools.length > 0) {
      const schoolIds = formData.selectedSchools.map((school) => school.value);
      loadCampuses(schoolIds);
      if (mode === "add") {
        setFormData((prev) => ({
          ...prev,
          selectedCampuses: [],
          courseLinked: [],
        }));
      }
    } else if (!formData.selectedSchools || formData.selectedSchools.length === 0) {
      setCampuses([]);
      setCourses([]);
      if (mode === "add") {
        setFormData((prev) => ({
          ...prev,
          selectedCampuses: [],
          courseLinked: [],
        }));
      }
    }
  }, [formData.selectedSchools, mode]);

  useEffect(() => {
    if (formData.selectedCampuses && formData.selectedCampuses.length > 0) {
      const campusIds = formData.selectedCampuses.map((campus) => campus.value);
      loadCourses(campusIds);
      if (mode === "add") {
        setFormData((prev) => ({
          ...prev,
          courseLinked: [],
        }));
      }
    } else if (!formData.selectedCampuses || formData.selectedCampuses.length === 0) {
      setCourses([]);
      if (mode === "add") {
        setFormData((prev) => ({
          ...prev,
          courseLinked: [],
        }));
      }
    }
  }, [formData.selectedCampuses, mode]);

  const initializeFromExistingCourses = async (courseIds) => {
    try {
      const relatedData = await OptimizedDataService.getRelatedDataForCourses(courseIds);

      const allSchools = relatedData.schools || [];
      const allCampuses = relatedData.campuses || [];
      const allCourses = relatedData.courses || [];

      if (allSchools.length > 0) {
        setCampuses(allCampuses);
        setCourses(allCourses);

        setFormData((prev) => ({
          ...prev,
          selectedSchools: allSchools,
          selectedCampuses: allCampuses,
        }));
      }
    } catch (error) {
      console.error("Error initializing from existing courses:", error);
    }
  };

  const handleInputChange = (field, value) => {
    if (mode === "view") return;

    if (field === "discountAmount") {
      let newValue = value;

      newValue = newValue.replace(/^0+/, "");

      if (newValue === "" || /^\d+$/.test(newValue)) {
        const numValue = parseInt(newValue || "0", 10);

        if (formData.discountType === "percentage" && numValue > 100) {
          return;
        }

        setFormData((prev) => ({
          ...prev,
          [field]: newValue,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Discount name is required";
    }

    if (!formData.neverExpires) {
      if (!formData.startDate) {
        newErrors.startDate = "Start date is required";
      }
      if (!formData.endDate) {
        newErrors.endDate = "End date is required";
      }
      if (
        formData.startDate &&
        formData.endDate &&
        new Date(formData.startDate) >= new Date(formData.endDate)
      ) {
        newErrors.endDate = "End date must be after start date";
      }
    }

    if (!formData.eligibleTravelStartDate) {
      newErrors.eligibleTravelStartDate = "Eligible travel start date is required";
    }
    if (!formData.eligibleTravelEndDate) {
      newErrors.eligibleTravelEndDate = "Eligible travel end date is required";
    }
    if (
      formData.eligibleTravelStartDate &&
      formData.eligibleTravelEndDate &&
      new Date(formData.eligibleTravelStartDate) >= new Date(formData.eligibleTravelEndDate)
    ) {
      newErrors.eligibleTravelEndDate = "Eligible travel end date must be after start date";
    }

    if (formData.discountAmount <= 0) {
      newErrors.discountAmount = "Discount amount must be greater than 0";
    }

    if (formData.discountType === "percentage" && formData.discountAmount > 100) {
      newErrors.discountAmount = "Percentage cannot exceed 100%";
    }

    if (
      !formData.courseLinked ||
      !Array.isArray(formData.courseLinked) ||
      formData.courseLinked.length === 0
    ) {
      newErrors.courseLinked = "At least one programme must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!canSave) {
      return;
    }

    setIsSubmitting(true);
    try {
      const formatDateToUTC = (dateInput) => {
        if (!dateInput) return dateInput;

        if (dateInput instanceof Date) {
          const utcDate = new Date(
            Date.UTC(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate())
          );
          return utcDate.toISOString();
        }

        if (typeof dateInput === "string") {
          const dateMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (dateMatch) {
            const year = parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]) - 1;
            const day = parseInt(dateMatch[3]);

            const utcDate = new Date(Date.UTC(year, month, day, 0, 0, 0, 0));
            return utcDate.toISOString();
          }

          const date = new Date(dateInput);
          const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
          return utcDate.toISOString();
        }

        const date = new Date(dateInput);
        const utcDate = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        return utcDate.toISOString();
      };

      const formatEndDateToUTC = (dateInput) => {
        if (!dateInput) return dateInput;

        if (dateInput instanceof Date) {
          const utcDate = new Date(
            Date.UTC(
              dateInput.getFullYear(),
              dateInput.getMonth(),
              dateInput.getDate(),
              23,
              59,
              59,
              999
            )
          );
          return utcDate.toISOString();
        }

        if (typeof dateInput === "string") {
          const dateMatch = dateInput.match(/^(\d{4})-(\d{2})-(\d{2})$/);
          if (dateMatch) {
            const year = parseInt(dateMatch[1]);
            const month = parseInt(dateMatch[2]) - 1;
            const day = parseInt(dateMatch[3]);

            const utcDate = new Date(Date.UTC(year, month, day, 23, 59, 59, 999));
            return utcDate.toISOString();
          }

          const date = new Date(dateInput);
          const utcDate = new Date(
            Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
          );
          return utcDate.toISOString();
        }

        const date = new Date(dateInput);
        const utcDate = new Date(
          Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999)
        );
        return utcDate.toISOString();
      };

      const apiData = {
        title: formData.name,
        startDay: formData.neverExpires
          ? NEVER_EXPIRES_DATES.startDate
          : formatDateToUTC(formData.startDate),
        endDay: formData.neverExpires
          ? NEVER_EXPIRES_DATES.endDate
          : formatEndDateToUTC(formData.endDate),
        eligibleTravelStartDay: formatDateToUTC(formData.eligibleTravelStartDate),
        eligibleTravelEndDay: formatDateToUTC(formData.eligibleTravelEndDate),
        type: formData.discountType === "percentage" ? "percent" : "fixed",
        value: parseFloat(formData.discountAmount),
        status: "active",
        tuition: formData.applyOnlyToTuition,
        description: formData.description,
        courseIds: Array.isArray(formData.courseLinked) ? formData.courseLinked : [],
      };

      let result;
      if (mode === "edit" && discountData?.id) {
        result = await DiscountService.updateDiscount(discountData.id, apiData);

        if (formData.image?.isNew && formData.image?.file) {
          try {
            const uploadUrlData = await DiscountService.getImageUploadUrl(
              discountData.id,
              formData.image.file.type
            );

            const uploadResponse = await fetch(uploadUrlData.url, {
              method: "PUT",
              body: formData.image.file,
              headers: {
                "Content-Type": formData.image.file.type,
              },
            });

            if (!uploadResponse.ok) {
              throw new Error("Failed to upload image to S3");
            }

            const imageUrl = uploadUrlData.publicUrl || uploadUrlData.url;
            await DiscountService.updateDiscount(discountData.id, { image: imageUrl });
          } catch (error) {
            console.error("Error uploading image:", error);
          }
        }
      } else {
        result = await DiscountService.createDiscount(apiData);

        if (formData.image?.isNew && formData.image?.file && result?.id) {
          try {
            const uploadUrlData = await DiscountService.getImageUploadUrl(
              result.id,
              formData.image.file.type
            );

            const uploadResponse = await fetch(uploadUrlData.url, {
              method: "PUT",
              body: formData.image.file,
              headers: {
                "Content-Type": formData.image.file.type,
              },
            });

            if (!uploadResponse.ok) {
              throw new Error("Failed to upload image to S3");
            }

            const imageUrl = uploadUrlData.publicUrl || uploadUrlData.url;
            await DiscountService.updateDiscount(result.id, { image: imageUrl });
          } catch (error) {
            console.error("Error uploading image:", error);
          }
        }
      }

      if (onSuccess) {
        onSuccess(result, mode);
      }

      handleClose();
    } catch (error) {
      console.error("Error saving discount:", error);
      setErrors((prev) => ({
        ...prev,
        submit: error.response?.data?.message || "Error saving discount. Please try again.",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(INITIAL_FORM_DATA);
    setErrors({});
    resetLoadingStates();
    onClose();
  };

  const getTitle = () => {
    switch (mode) {
      case "view":
        return "View Discount";
      case "edit":
        return "Edit Discount";
      default:
        return "Create Discount";
    }
  };

  const getSubmitButtonText = () => {
    const baseText = mode === "edit" ? "Save Changes" : "Create Discount";
    return getSaveButtonText(baseText);
  };

  const isViewMode = mode === "view";

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "90vh",
          overflow: "auto",
        },
      }}
    >
      <DialogTitle>
        <SoftTypography variant="h5" fontWeight="medium">
          {getTitle()}
        </SoftTypography>
      </DialogTitle>

      <DialogContent sx={{ position: "relative" }}>
        <SoftBox p={2}>
          {isInitializing && (
            <SoftBox
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              zIndex={1000}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              bgcolor="rgba(255, 255, 255, 0.9)"
              sx={{ backdropFilter: "blur(2px)" }}
            >
              <CircularProgress size={60} />
              <SoftTypography variant="h6" color="text" mt={2}>
                Loading discount data...
              </SoftTypography>
              <SoftTypography variant="body2" color="text" textAlign="center" mt={1}>
                Please wait while we prepare the form
              </SoftTypography>
            </SoftBox>
          )}
          <SoftBox mb={3}>
            <SoftTypography variant="h6" fontWeight="medium" mb={2}>
              Basic Information
            </SoftTypography>

            <SoftBox mb={2}>
              <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                Name*
              </SoftTypography>
              <SoftInput
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                disabled={isViewMode || !canEdit || isSubmitting}
                fullWidth
                placeholder="Enter discount name"
              />
            </SoftBox>

            <SoftBox mb={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.neverExpires}
                    onChange={(e) => handleInputChange("neverExpires", e.target.checked)}
                    disabled={isViewMode || !canEdit || isSubmitting}
                  />
                }
                label="Never expires"
                sx={{ marginLeft: 0 }}
              />
            </SoftBox>

            {!formData.neverExpires && (
              <SoftBox display="flex" gap={2} mb={2}>
                <SoftBox flex={1}>
                  <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                    Start Date*
                  </SoftTypography>
                  <SoftDatePicker
                    value={formData.startDate}
                    onChange={(date) => handleInputChange("startDate", date[0])}
                    disabled={isViewMode || !canEdit || isSubmitting}
                    options={{
                      dateFormat: "Y-m-d",
                      placeholder: "Select start date",
                      utc: true,
                    }}
                    input={{
                      placeholder: "Select start date",
                      error: !!errors.startDate,
                      helperText: errors.startDate,
                    }}
                  />
                </SoftBox>
                <SoftBox flex={1}>
                  <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                    End Date*
                  </SoftTypography>
                  <SoftDatePicker
                    value={formData.endDate}
                    onChange={(date) => handleInputChange("endDate", date[0])}
                    disabled={isViewMode || !canEdit || isSubmitting}
                    options={{
                      dateFormat: "Y-m-d",
                      placeholder: "Select end date",
                      utc: true,
                    }}
                    input={{
                      placeholder: "Select end date",
                      error: !!errors.endDate,
                      helperText: errors.endDate,
                    }}
                  />
                </SoftBox>
              </SoftBox>
            )}
          </SoftBox>

          <Divider sx={{ my: 3 }} />

          <SoftBox mb={3}>
            <SoftTypography variant="h6" fontWeight="medium" mb={2}>
              Eligible Travel Dates
            </SoftTypography>

            <SoftBox display="flex" gap={2}>
              <SoftBox flex={1}>
                <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                  Eligible Travel Start Date*
                </SoftTypography>
                <SoftDatePicker
                  value={formData.eligibleTravelStartDate}
                  onChange={(date) => handleInputChange("eligibleTravelStartDate", date[0])}
                  disabled={isViewMode || !canEdit || isSubmitting}
                  options={{
                    dateFormat: "Y-m-d",
                    placeholder: "Select travel start date",
                    utc: true,
                  }}
                  input={{
                    placeholder: "Select travel start date",
                    error: !!errors.eligibleTravelStartDate,
                    helperText: errors.eligibleTravelStartDate,
                  }}
                />
              </SoftBox>
              <SoftBox flex={1}>
                <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                  Eligible Travel End Date*
                </SoftTypography>
                <SoftDatePicker
                  value={formData.eligibleTravelEndDate}
                  onChange={(date) => handleInputChange("eligibleTravelEndDate", date[0])}
                  disabled={isViewMode || !canEdit || isSubmitting}
                  options={{
                    dateFormat: "Y-m-d",
                    placeholder: "Select travel end date",
                  }}
                  input={{
                    placeholder: "Select travel end date",
                    error: !!errors.eligibleTravelEndDate,
                    helperText: errors.eligibleTravelEndDate,
                  }}
                />
              </SoftBox>
            </SoftBox>
          </SoftBox>

          <Divider sx={{ my: 3 }} />

          <SoftBox mb={3}>
            <SoftTypography variant="h6" fontWeight="medium" mb={2}>
              Discount Configuration
            </SoftTypography>

            <SoftBox mb={2}>
              <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                Discount Type
              </SoftTypography>
              <SoftBox display="flex" gap={1} mt={1}>
                <SoftButton
                  variant={formData.discountType === "percentage" ? "gradient" : "outlined"}
                  color={formData.discountType === "percentage" ? "info" : "light"}
                  size="small"
                  onClick={() => handleInputChange("discountType", "percentage")}
                  disabled={isViewMode || !canEdit || isSubmitting}
                  sx={{ flex: 1 }}
                >
                  PERCENTAGE OFF
                </SoftButton>
                <SoftButton
                  variant={formData.discountType === "fixed" ? "gradient" : "outlined"}
                  color={formData.discountType === "fixed" ? "info" : "light"}
                  size="small"
                  onClick={() => handleInputChange("discountType", "fixed")}
                  disabled={isViewMode || !canEdit || isSubmitting}
                  sx={{ flex: 1 }}
                >
                  AMOUNT OFF
                </SoftButton>
              </SoftBox>
            </SoftBox>

            <SoftBox mb={2}>
              <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                {formData.discountType === "percentage" ? "Percentage Off*" : "Amount Off*"}
              </SoftTypography>
              <SoftInput
                type="text"
                value={formData.discountAmount}
                onChange={(e) => handleInputChange("discountAmount", e.target.value)}
                onFocus={(e) => {
                  if (e.target.value === "0" || e.target.value === "") {
                    setFormData((prev) => ({
                      ...prev,
                      discountAmount: "",
                    }));
                  }
                }}
                error={!!errors.discountAmount}
                helperText={errors.discountAmount}
                disabled={isViewMode || !canEdit || isSubmitting}
                fullWidth
                placeholder="Enter value"
              />
            </SoftBox>

            <SoftBox mb={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.applyOnlyToTuition}
                    onChange={(e) => handleInputChange("applyOnlyToTuition", e.target.checked)}
                    disabled={isViewMode || !canEdit || isSubmitting}
                  />
                }
                label="Apply only to the programme fee"
                sx={{ marginLeft: 0 }}
              />
            </SoftBox>
          </SoftBox>

          <Divider sx={{ my: 3 }} />

          <SoftBox mb={3}>
            <SoftTypography variant="h6" fontWeight="medium" mb={2}>
              Programme Assignment
            </SoftTypography>

            <SoftBox mb={2}>
              <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                Providers*
              </SoftTypography>
              <SoftSelect
                value={formData.selectedSchools}
                onChange={(selectedOptions) => {
                  if (isViewMode) return;
                  handleInputChange("selectedSchools", selectedOptions || []);
                }}
                onInputChange={handleDiscountSchoolInputChange}
                onMenuScrollToBottom={loadMoreDiscountSchools}
                filterOption={() => true}
                options={schools}
                isMulti
                isDisabled={isViewMode || !canEdit || isSubmitting}
                isSearchable={!isViewMode}
                isClearable={!isViewMode}
                isLoading={isLoading("schools") || schoolsLoadingMore}
                placeholder={getSelectPlaceholder("schools", "Select providers")}
                fullWidth
              />
            </SoftBox>

            <SoftBox mb={2}>
              <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                Locations*
              </SoftTypography>
              <SoftSelect
                value={formData.selectedCampuses}
                onChange={(selectedOptions) => {
                  if (isViewMode) return;
                  handleInputChange("selectedCampuses", selectedOptions || []);
                }}
                options={campuses}
                isMulti
                isDisabled={
                  isViewMode ||
                  !canEdit ||
                  isSubmitting ||
                  isLoading("campuses") ||
                  !formData.selectedSchools ||
                  formData.selectedSchools.length === 0
                }
                isSearchable={!isViewMode}
                isClearable={!isViewMode}
                placeholder={
                  !formData.selectedSchools || formData.selectedSchools.length === 0
                    ? "Select providers first"
                    : getSelectPlaceholder("campuses", "Select locations")
                }
                fullWidth
              />
            </SoftBox>

            <SoftBox mb={2}>
              <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                Programmes*
              </SoftTypography>
              <SoftSelect
                value={courses.filter((course) => (formData.courseLinked || []).includes(course.value))
                  .map((course) => ({
                    ...course,
                    label: `${course.label} - ${parseCoursePeriodicity(course.periodicity)}`
                  }))
                }
                onChange={(selectedOptions) => {
                  if (isViewMode) return;
                  const courseIds = selectedOptions
                    ? selectedOptions.map((option) => option.value)
                    : [];
                  setFormData((prev) => ({ ...prev, courseLinked: courseIds }));
                  if (errors.courseLinked) {
                    setErrors((prev) => ({ ...prev, courseLinked: "" }));
                  }
                }}
                options={courses.map((course) => ({
                  ...course,
                  label: `${course.label} - ${parseCoursePeriodicity(course.periodicity)}`
                }))}
                isMulti
                isDisabled={
                  isViewMode ||
                  !canEdit ||
                  isSubmitting ||
                  isLoading("courses") ||
                  !formData.selectedCampuses ||
                  formData.selectedCampuses.length === 0
                }
                isSearchable={!isViewMode}
                isClearable={!isViewMode}
                hideSelectedOptions={!isViewMode}
                components={
                  isViewMode
                    ? {
                        MultiValueRemove: () => null,
                        DropdownIndicator: () => null,
                        IndicatorSeparator: () => null,
                      }
                    : undefined
                }
                placeholder={
                  !formData.selectedCampuses || formData.selectedCampuses.length === 0
                    ? "Select locations first"
                    : getSelectPlaceholder("courses", "Select programmes")
                }
                fullWidth
              />
              {errors.courseLinked && (
                <SoftTypography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
                  {errors.courseLinked}
                </SoftTypography>
              )}
            </SoftBox>
          </SoftBox>

          <Divider sx={{ my: 3 }} />

          <SoftBox mb={3}>
            <SoftTypography variant="h6" fontWeight="medium" mb={2}>
              Description
            </SoftTypography>

            <SoftBox mb={2}>
              <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                Description
              </SoftTypography>
              <SoftInput
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                disabled={isViewMode || !canEdit || isSubmitting}
                fullWidth
                multiline
                rows={4}
                placeholder="Enter discount description..."
              />
            </SoftBox>
          </SoftBox>

          <Divider sx={{ my: 3 }} />

          <SoftBox mb={3}>
            <DiscountImageUpload
              image={formData.image}
              onImageChange={(image) => handleInputChange("image", image)}
              disabled={isViewMode || !canEdit || isSubmitting}
              discountId={discountData?.id}
              mode={mode}
            />
          </SoftBox>
        </SoftBox>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isSubmitting || isInitializing}>
          Cancel
        </Button>
        {!isViewMode && (
          <SoftButton
            variant="gradient"
            color="info"
            onClick={handleSubmit}
            disabled={!canSave || isSubmitting || isInitializing}
          >
            {getSubmitButtonText()}
          </SoftButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

DiscountModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["add", "edit", "view"]),
  discountData: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default DiscountModal;
