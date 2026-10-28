import { useState, useEffect } from "react";
import { courseTypesToForm } from "utils/courseTypeUtils";
import PropTypes from "prop-types";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import BasicInformation from "./components/BasicInformation";
import CourseType from "./components/CourseType";
import PriceSection from "./components/PriceSection";
import StartDatesSection from "./components/StartDatesSection";
import PeriodicitySection from "./components/PeriodicitySection";
import DurationSection from "./components/DurationSection";
import ScheduleSection from "./components/ScheduleSection";
import DescriptionSection from "./components/DescriptionSection";
import CourseServicesStep from "./components/CourseServicesStep";

import { INITIAL_FORM_DATA } from "./constants";
import { CourseService } from "services/courseService";
import { useModalLoadingState } from "hooks/useModalLoadingState";
import useFormValidation from "hooks/useFormValidation";
import CourseLoadingOverlay from "components/CourseLoadingOverlay";

function CourseModal({
  open,
  onClose,
  mode = "add",
  courseData = null,
  campusId = null,
  onSuccess,
}) {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const {
    errors,
    validateForm,
    clearAllErrors,
    clearFieldErrorOnChange,
    getFieldError,
    hasFieldError,
  } = useFormValidation();

  const { isInitializing, setInitializing, resetLoadingStates } = useModalLoadingState([]);

  const mapPeriodicityFromAPI = (periodicity) => {
    if (periodicity === "fullTime") {
      return ["full-time"];
    } else if (periodicity === "morning") {
      return ["morning"];
    } else if (periodicity === "afternoon") {
      return ["afternoon"];
    } else if (periodicity === "evening") {
      return ["evening"];
    }
    return [];
  };


  const formatTimeForDisplay = (isoTimeString) => {
    try {
      const timeMatch = isoTimeString.match(/T(\d{2}):(\d{2}):(\d{2})/);
      if (!timeMatch) {
        return isoTimeString;
      }

      const hours = parseInt(timeMatch[1]);
      const minutes = parseInt(timeMatch[2]);

      const ampm = hours >= 12 ? "PM" : "AM";
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, "0");

      return `${displayHours}:${displayMinutes} ${ampm}`;
    } catch (error) {
      console.error("Error formatting time:", error);
      return isoTimeString;
    }
  };

  const extractDateFromUTC = (utcDateString) => {
    if (!utcDateString) return "";

    const dateMatch = utcDateString.match(/^(\d{4}-\d{2}-\d{2})/);
    if (dateMatch) {
      return dateMatch[1];
    }

    return utcDateString;
  };

  const mapWeekDayToForm = (weekDay) => {
    const dayMap = {
      monday: "mon",
      tuesday: "tue",
      wednesday: "wed",
      thursday: "thu",
      friday: "fri",
      saturday: "sat",
      sunday: "sun",
    };
    return dayMap[weekDay] || weekDay;
  };

  useEffect(() => {
    const loadCourseData = async () => {
      if (open) {
        setInitializing(true);

        if (mode === "add" && !courseData) {
          setFormData(INITIAL_FORM_DATA);
          setTimeout(() => {
            setInitializing(false);
          }, 100);
        } else if (courseData && courseData.id) {
          try {
            const { CourseService } = await import("../../../services/courseService");
            const { ServiceService } = await import("../../../services/serviceService");
            const fullCourseData = await CourseService.getCourseById(courseData.id);

            const allServices = await ServiceService.getAllServices();

            const mappedServices =
              fullCourseData.services?.map((courseService) => {
                const fullService = allServices.find((s) => s.id === courseService.service.id);
                const isMandatory =
                  courseService.isMandatory !== undefined
                    ? courseService.isMandatory
                    : fullService?.courseServices?.some((cs) => cs.isMandatory) || false;
                const pricingTiers =
                  courseService.durationPrices && courseService.durationPrices.length > 0
                    ? courseService.durationPrices.map((tier, index) => ({
                        id: tier.id || `${Date.now()}-${index}`,
                        minWeeks: tier.minWeeks || 1,
                        maxWeeks: tier.maxWeeks || 4,
                        priceType: tier.mode === "FIXED" ? "fixed" : "per_week",
                        amount: tier.price ?? "",
                      }))
                    : [
                        {
                          id: Date.now(),
                          minWeeks: 1,
                          maxWeeks: 4,
                          priceType: "per_week",
                          amount: courseService.price ?? "",
                        },
                      ];
                return {
                  ...courseService,
                  isMandatory,
                  pricingTiers,
                };
              }) || [];

            const updatedCourseData = {
              ...fullCourseData,
              services: mappedServices,
            };

            mapAndSetFormData(updatedCourseData);
            setInitializing(false);
          } catch (error) {
            console.error("Failed to load programme data in modal:", error);
            mapAndSetFormData(courseData);
            setInitializing(false);
          }
        } else if (courseData) {
          mapAndSetFormData(courseData);
          setTimeout(() => {
            setInitializing(false);
          }, 100);
        } else {
          setFormData(INITIAL_FORM_DATA);
          setTimeout(() => {
            setInitializing(false);
          }, 100);
        }
      } else {
        resetLoadingStates();
      }
    };

    const mapAndSetFormData = (courseData) => {
      const courseTypes = courseTypesToForm(courseData);

      const mappedServicesSafe = (courseData.services || []).map((courseService) => {
        const pricingTiers =
          courseService.pricingTiers && courseService.pricingTiers.length > 0
            ? courseService.pricingTiers
            : courseService.durationPrices && courseService.durationPrices.length > 0
            ? courseService.durationPrices.map((tier, index) => ({
                id: tier.id || `${Date.now()}-${index}`,
                minWeeks: tier.minWeeks || 1,
                maxWeeks: tier.maxWeeks || 4,
                priceType: tier.mode === "FIXED" ? "fixed" : "per_week",
                amount: tier.price ?? "",
              }))
            : [
                {
                  id: Date.now(),
                  minWeeks: 1,
                  maxWeeks: 4,
                  priceType: "per_week",
                  amount: courseService.price ?? "",
                },
              ];

        return {
          ...courseService,
          isMandatory: courseService.isMandatory !== undefined ? courseService.isMandatory : false,
          pricingTiers,
        };
      });

      setFormData({
        ...INITIAL_FORM_DATA,
        name: courseData.name || "",
        courseTypes: courseTypes,
        description: courseData.description || "",
        projectDescription: courseData.projectDescription || "",
        durationType: courseData.durationUnit || "hours",
        durationPeriod: courseData.durationType || "perWeek",
        duration: courseData.durationCount?.toString() || "",
        durationEntries: courseData.durationCount
          ? [
              {
                id: Date.now(),
                duration: courseData.durationCount.toString(),
                period: courseData.durationType || "perWeek",
                type: courseData.durationUnit || "hours",
              },
            ]
          : [],
        startDates: courseData.startMode === "pattern" ? "Pattern" : "Manually",
        coursePatternStartDate: courseData.firstStartDate
          ? extractDateFromUTC(courseData.firstStartDate)
          : "",
        periodicityOptions: mapPeriodicityFromAPI(courseData.periodicity),
        schedule: {
          startTime: courseData.startTime ? formatTimeForDisplay(courseData.startTime) : "",
          endTime: courseData.endTime ? formatTimeForDisplay(courseData.endTime) : "",
        },
        scheduleEntries:
          courseData.startTime && courseData.endTime
            ? [
                {
                  id: Date.now(),
                  startTime: formatTimeForDisplay(courseData.startTime),
                  endTime: formatTimeForDisplay(courseData.endTime),
                },
              ]
            : [],
        minAge: courseData.minAge?.toString() || "",
        averageRating: courseData.averageRating ?? "",
        bestSeller: courseData.bestSeller || false,
        isFeatured: courseData.isFeatured || false,
        isActive: courseData.isActive !== undefined ? courseData.isActive : true,
        recommendedLevel: courseData.recommendedLevel || "",
        classSize: courseData.classSize || "",
        recommendedFor: courseData.recommendedFor || "",
        notRecommendedFor: courseData.notRecommendedFor || "",
        workload: courseData.workload?.toString() || "",
        equipment: courseData.equipment || "",
        certificate: courseData.certificate || "",
        courseHighlights: courseData.courseHighlights?.length > 0 
          ? courseData.courseHighlights 
          : [{ text: "" }],
        pricingRules: [],
        fees:
          courseData.fees
            ?.filter((fee) => fee.name && fee.value !== undefined)
            ?.map((fee) => ({
              name: fee.name,
              value: fee.value?.toString() || "0",
            })) || [],
        services: mappedServicesSafe,
        startDatesPattern:
          courseData.startPatterns?.[0]?.patternType === "weekDay"
            ? "days-of-week"
            : "days-of-week",
        selectedDaysOfWeek:
          courseData.startPatterns?.[0]?.weekDays?.map((day) => mapWeekDayToForm(day.weekDay)) ||
          [],
        daysOfMonth:
          courseData.startPatterns?.[0]?.monthDays
            ?.map((day) => day.dayOfMonth?.toString())
            .join(", ") || "",
        manualDates:
          courseData.startManuals?.map((manual) => extractDateFromUTC(manual.startDate)) || [],
        rangeStart: courseData.startManuals?.[0]?.startDate || "",
        rangeEnd: courseData.startManuals?.[courseData.startManuals.length - 1]?.startDate || "",
        repeatEveryWeeks: courseData.startPatterns?.[0]?.repeatEvery?.toString() || "",
      });
    };

    loadCourseData();
  }, [open, courseData, setInitializing, resetLoadingStates]);

  const handleInputChange = (field, value) => {
    if (mode === "view") return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const validationRules = {
      name: { required: true, minLength: 2, maxLength: 100 },
      minAge: {
        required: true,
        min: 0,
        max: 90,
      },
      schedule: {
        required: true,
        custom: (value) => {
          if (formData.scheduleEntries && formData.scheduleEntries.length > 0) {
            return null;
          }

          return "Schedule is required";
        },
      },
      courseTypes: {
        required: true,
        custom: (value) => {
          if (!value || !Array.isArray(value) || value.length === 0) {
            return "Please choose Tech or Sport";
          }
          const hasProgramTypes = value.every(
            (ct) => ct.programTypes && ct.programTypes.length > 0
          );
          if (!hasProgramTypes) {
            return "Please pick at least one programme type";
          }
          return null;
        },
      },
      startDatesPattern: {
        required: true,
        custom: (value) => {
          if (formData.startDates === "Pattern" && (!value || value.trim() === "")) {
            return "Please select a start dates pattern";
          }
          return null;
        },
      },
      coursePatternStartDate: {
        required: true,
        custom: (value) => {
          if (formData.startDates === "Pattern" && (!value || value.trim() === "")) {
            return "Please enter a programme pattern start date";
          }
          return null;
        },
      },
      duration: {
        required: true,
        custom: (value) => {
          if (formData.durationEntries && formData.durationEntries.length > 0) {
            return null;
          }

          if (!value || value.trim() === "") {
            return "Duration Value is required";
          }

          return null;
        },
      },
    };

    const hasDurationEntries = formData.durationEntries && formData.durationEntries.length > 0;

    const modifiedValidationRules = { ...validationRules };
    if (hasDurationEntries) {
      modifiedValidationRules.duration = {
        required: false,
        custom: () => {
          console.log(" Duration validation bypassed due to durationEntries");
          return null;
        },
      };
    } else {
      console.log("No duration entries found, using original validation rules");
    }

    const { isValid, errors: validationErrors } = validateForm(formData, modifiedValidationRules);

    if (!isValid) {
      return;
    }

    let finalScheduleData = { ...formData };
    if (formData.scheduleEntries && formData.scheduleEntries.length > 0) {
      const firstEntry = formData.scheduleEntries[0];
      finalScheduleData.schedule = {
        startTime: firstEntry.startTime,
        endTime: firstEntry.endTime,
      };
    } else if (formData.schedule?.startTime && formData.schedule?.endTime) {
      finalScheduleData.schedule = formData.schedule;
    }

    const resolvedCampusId = campusId || courseData?.campusId;
    const payload = {
      ...finalScheduleData,
      campusId: resolvedCampusId,
    };

    try {
      setInitializing(true);
      if (mode === "edit" && courseData?.id) {
        await CourseService.updateCourse(courseData.id, payload);
      } else if (mode === "add") {
        await CourseService.createCourse(payload);
      }
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Failed to save programme:", error);
      alert(`Failed to save programme: ${error.message}`);
    } finally {
      setInitializing(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "view":
        return "View Programme";
      case "edit":
        return "Edit Programme";
      case "add":
        return "Add New Programme";
      default:
        return "View Programme";
    }
  };

  const getSubmitButtonText = () => {
    switch (mode) {
      case "edit":
        return "Save Programme";
      case "add":
        return "Create Programme";
      default:
        return "Save Programme";
    }
  };

  const isViewMode = mode === "view";

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
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
          <CourseLoadingOverlay isVisible={isInitializing} />
          <BasicInformation
            formData={formData}
            onInputChange={handleInputChange}
            disabled={isViewMode}
            errors={errors}
            clearFieldErrorOnChange={clearFieldErrorOnChange}
          />

          <Divider sx={{ my: 2 }} />

          <CourseType
            formData={formData}
            onInputChange={handleInputChange}
            disabled={isViewMode}
            errors={errors}
            clearFieldErrorOnChange={clearFieldErrorOnChange}
          />

          <Divider sx={{ my: 2 }} />

          {!isViewMode && (
            <>
              <PriceSection
                formData={formData}
                onInputChange={handleInputChange}
                disabled={isViewMode}
                errors={errors}
                clearFieldErrorOnChange={clearFieldErrorOnChange}
                showBottomMargin={true}
              />
              <Divider sx={{ my: 2 }} />
            </>
          )}

          <CourseServicesStep
            formData={formData}
            onInputChange={handleInputChange}
            disabled={isViewMode}
            campusId={campusId}
            isEditMode={mode === "edit"}
          />

          <Divider sx={{ my: 2 }} />

          <StartDatesSection
            formData={formData}
            onInputChange={handleInputChange}
            disabled={isViewMode}
            errors={errors}
            clearFieldErrorOnChange={clearFieldErrorOnChange}
          />

          <Divider sx={{ my: 2 }} />

          <PeriodicitySection
            formData={formData}
            onInputChange={handleInputChange}
            disabled={isViewMode}
          />

          <Divider sx={{ my: 2 }} />

          <DurationSection
            formData={formData}
            onInputChange={handleInputChange}
            disabled={isViewMode}
            errors={errors}
            clearFieldErrorOnChange={clearFieldErrorOnChange}
          />

          <Divider sx={{ my: 2 }} />

          <ScheduleSection
            formData={formData}
            onInputChange={handleInputChange}
            disabled={isViewMode}
            errors={errors}
            clearFieldErrorOnChange={clearFieldErrorOnChange}
          />

          <Divider sx={{ my: 2 }} />

          <DescriptionSection
            formData={formData}
            onInputChange={handleInputChange}
            disabled={isViewMode}
          />
        </SoftBox>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <SoftButton color="light" onClick={onClose} disabled={isInitializing}>
          {isViewMode ? "Close" : "Cancel"}
        </SoftButton>
        {!isViewMode && (
          <SoftButton
            variant="gradient"
            color="info"
            onClick={handleSubmit}
            disabled={isInitializing}
          >
            {getSubmitButtonText()}
          </SoftButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

CourseModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["add", "edit", "view"]),
  courseData: PropTypes.object,
  campusId: PropTypes.string,
  onSuccess: PropTypes.func,
};

export default CourseModal;
