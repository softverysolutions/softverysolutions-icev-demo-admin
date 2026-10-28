import { useState, useEffect } from "react";
import { courseTypesToForm } from "utils/courseTypeUtils";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";

import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Divider from "@mui/material/Divider";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Grid from "@mui/material/Grid";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import BasicInformation from "../add-course-modal/components/BasicInformation";
import CourseType from "../add-course-modal/components/CourseType";
import PriceSection from "../add-course-modal/components/PriceSection";
import StartDatesSection from "../add-course-modal/components/StartDatesSection";
import PeriodicitySection from "../add-course-modal/components/PeriodicitySection";
import DurationSection from "../add-course-modal/components/DurationSection";
import ScheduleSection from "../add-course-modal/components/ScheduleSection";
import DescriptionSection from "../add-course-modal/components/DescriptionSection";
import CourseServicesStep from "../add-course-modal/components/CourseServicesStep";

import { INITIAL_FORM_DATA } from "../add-course-modal/constants";
import { CourseService } from "services/courseService";
import { CoursePriceListService } from "services/coursePriceListService";
import { CourseFeeService } from "services/courseFeeService";
import { ServiceService } from "services/serviceService";
import { CampusService } from "services/campusService";
import useFormValidation from "hooks/useFormValidation";
import CoursePageLoadingOverlay from "components/CoursePageLoadingOverlay";
import { formatDateToUTC, parseUtcDateForPicker } from "utils/dateUtils";

function getSteps() {
  return ["Basics", "Pricing", "Extras"];
}

const mapApiCourseServiceToForm = (courseService, allServices = []) => {
  const fullService = allServices.find((s) => s.id === courseService.service?.id);
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
    id: courseService.id,
    isMandatory,
    pricingTiers,
  };
};

const mapApiCourseServicesToForm = (courseServices, allServices = []) =>
  courseServices?.map((courseService) => mapApiCourseServiceToForm(courseService, allServices)) ||
  [];

const dedupeDurationPrices = (durationPrices = []) => {
  const seen = new Set();
  return durationPrices.filter((tier) => {
    const key = `${tier.minWeeks}-${tier.maxWeeks}-${tier.mode}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

function getStepContent(
  stepIndex,
  formData,
  onInputChange,
  disabled,
  errors,
  clearFieldErrorOnChange,
  campusId,
  onCancel,
  onNext,
  isEditMode,
  priceLists,
  handlePriceListSaved,
  courseFees,
  courseId,
  isDuplicateMode
) {
  switch (stepIndex) {
    case 0:
      return (
        <>
          <BasicInformation
            formData={formData}
            onInputChange={onInputChange}
            disabled={disabled}
            errors={errors}
            clearFieldErrorOnChange={clearFieldErrorOnChange}
          />
          <Divider sx={{ my: 2 }} />
          <CourseType
            formData={formData}
            onInputChange={onInputChange}
            disabled={disabled}
            errors={errors}
            clearFieldErrorOnChange={clearFieldErrorOnChange}
          />
          <Divider sx={{ my: 2 }} />
          <StartDatesSection
            formData={formData}
            onInputChange={onInputChange}
            disabled={disabled}
            errors={errors}
            clearFieldErrorOnChange={clearFieldErrorOnChange}
          />
          <Divider sx={{ my: 2 }} />
          <PeriodicitySection
            formData={formData}
            onInputChange={onInputChange}
            disabled={disabled}
          />
          <Divider sx={{ my: 2 }} />
          <DurationSection
            formData={formData}
            onInputChange={onInputChange}
            disabled={disabled}
            errors={errors}
            clearFieldErrorOnChange={clearFieldErrorOnChange}
          />
          <Divider sx={{ my: 2 }} />
          <ScheduleSection
            formData={formData}
            onInputChange={onInputChange}
            disabled={disabled}
            errors={errors}
            clearFieldErrorOnChange={clearFieldErrorOnChange}
          />
          <Divider sx={{ my: 2 }} />
          <DescriptionSection
            formData={formData}
            onInputChange={onInputChange}
            disabled={disabled}
            errors={errors}
            clearFieldErrorOnChange={clearFieldErrorOnChange}
            onCancel={onCancel}
            onNext={onNext}
            showButtons={true}
            isEditMode={isEditMode}
          />
        </>
      );
    case 1:
      return (
        <PriceSection
          formData={formData}
          onInputChange={onInputChange}
          disabled={disabled}
          errors={errors}
          clearFieldErrorOnChange={clearFieldErrorOnChange}
          initialPriceLists={priceLists || []}
          initialCourseFees={courseFees || []}
          seedFromInitialPriceList={isDuplicateMode}
          showBottomMargin={true}
          courseId={formData.courseId || courseId}
          onSavePriceList={async (payload) => {
            await CoursePriceListService.create({
              ...payload,
              courseId: formData.courseId || courseId,
            });
          }}
          onUpdatePriceList={async (id, payload) => {
            await CoursePriceListService.update(id, payload);
          }}
          onPriceListSaved={handlePriceListSaved}
          onDeletePriceList={async (id) => {
            await CoursePriceListService.delete(id);
            await handlePriceListSaved();
          }}
          onSaveCourseFees={async (fees) => {
            const currentCourseId = formData.courseId || courseId;
            if (currentCourseId && currentCourseId !== "new") {
              await CourseFeeService.createCourseFees(currentCourseId, fees);
            }
          }}
          onUpdateCourseFees={async (fees) => {
            const currentCourseId = formData.courseId || courseId;
            if (currentCourseId && currentCourseId !== "new") {
              await CourseFeeService.updateCourseFees(currentCourseId, fees);
            }
          }}
          onDeleteCourseFees={async () => {
            const currentCourseId = formData.courseId || courseId;
            if (currentCourseId && currentCourseId !== "new") {
              await CourseFeeService.deleteCourseFees(currentCourseId);
            }
          }}
        />
      );
    case 2:
      return (
        <CourseServicesStep
          formData={formData}
          onInputChange={onInputChange}
          disabled={disabled}
          campusId={campusId}
          isEditMode={isEditMode}
        />
      );
    default:
      return null;
  }
}

function AddCoursePage() {
  const { schoolId, campusId, courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDuplicateMode, setIsDuplicateMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [campusCurrency, setCampusCurrency] = useState("EUR");
  const [activeStep, setActiveStep] = useState(0);
  const [priceLists, setPriceLists] = useState([]);
  const [courseFees, setCourseFees] = useState([]);
  const [initialServices, setInitialServices] = useState([]);
  const [duplicatePriceLists, setDuplicatePriceLists] = useState([]);
  const [duplicateHighSeasonFees, setDuplicateHighSeasonFees] = useState([]);
  const steps = getSteps();

  const {
    errors,
    validateForm,
    clearAllErrors,
    clearFieldErrorOnChange,
    getFieldError,
    hasFieldError,
  } = useFormValidation();

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
    if (campusId) {
      loadCampusCurrency(campusId);
    }

    if (courseId && courseId !== "new") {
      setIsEditMode(true);
      setIsInitializing(true);
      loadCourseData(courseId);
    } else if (location.state?.duplicateData) {
      setIsDuplicateMode(true);
      setIsInitializing(true);
      loadDuplicateData(location.state.duplicateData);
    }
  }, [courseId, campusId, location.state]);

  const loadCampusCurrency = async (id) => {
    try {
      const campusData = await CampusService.getCampusById(id);
      const currency = campusData.currency || "EUR";
      setCampusCurrency(currency);
      setFormData((prev) => ({ ...prev, currency }));
    } catch (error) {
      console.error("Failed to load location currency:", error);
      setCampusCurrency("EUR");
      setFormData((prev) => ({ ...prev, currency: "EUR" }));
    }
  };

  const loadPriceLists = async (courseId) => {
    try {
      const priceListsData = await CoursePriceListService.listByCourse(courseId);
      setPriceLists(priceListsData);
    } catch (error) {
      console.error("Failed to load price lists:", error);
      setPriceLists([]);
    }
  };

  const loadCourseFees = async (courseId) => {
    try {
      const feesData = await CourseFeeService.getCourseFees(courseId);
      const mappedFees = feesData.map((fee) => ({
        id: fee.id,
        startDate: fee.startDate ? parseUtcDateForPicker(fee.startDate) : null,
        endDate: fee.endDate ? parseUtcDateForPicker(fee.endDate) : null,
        pricePerWeek: fee.supplementPerWeek?.toString() || "0",
        active: fee.active !== false,
      }));
      setCourseFees(mappedFees);
    } catch (error) {
      console.error("Failed to load programme fees:", error);
      setCourseFees([]);
    }
  };

  const handlePriceListSaved = async () => {
    if (formData.courseId) {
      await loadPriceLists(formData.courseId);
    }
  };

  const loadCourseData = async (id) => {
    try {
      const courseData = await CourseService.getCourseById(id);
      const allServices = await ServiceService.getAllServices();
      const mappedServices = mapApiCourseServicesToForm(courseData.services, allServices);

      const mappedData = {
        ...INITIAL_FORM_DATA,
        name: courseData.name || "",
        courseTypes: courseTypesToForm(courseData),
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
          startTime: "",
          endTime: "",
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
        fees:
          courseData.fees
            ?.filter((fee) => fee.name && fee.value !== undefined)
            ?.map((fee) => ({
              serviceId: null,
              name: fee.name,
              value: fee.value?.toString() || "0",
              label: fee.name,
              amount: fee.value?.toString() || "0",
            })) || [],
        services: mappedServices,
        pricingRules: [],
        campusId: courseData.campusId || campusId,
        startDatesPattern:
          courseData.startPatterns?.[0]?.patternType === "weekDay"
            ? "days-of-week"
            : "days-of-week",
        selectedDaysOfWeek:
          courseData.startPatterns?.[0]?.weekDays?.map((day) => mapWeekDayToForm(day.weekDay)) ||
          [],
        repeatEveryWeeks: courseData.startPatterns?.[0]?.repeatEvery?.toString() || "",
        daysOfMonth:
          courseData.startPatterns?.[0]?.monthDays
            ?.map((day) => day.dayOfMonth.toString())
            .join(",") || "",
        manualDates:
          courseData.startManuals?.map((manual) => extractDateFromUTC(manual.startDate)) || [],
        ...(courseData.startMode === "manually" &&
          (!courseData.startManuals || courseData.startManuals.length === 0) && {
            manualDates: [""],
          }),
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
        courseHighlights:
          courseData.courseHighlights?.length > 0 ? courseData.courseHighlights : [{ text: "" }],
        currency: courseData.currency || campusCurrency,
      };

      setFormData(mappedData);
      setInitialServices(mappedServices);
      await loadPriceLists(id);
      try {
        await loadCourseFees(id);
      } catch (feeError) {
        console.error("Failed to load programme fees:", feeError);
        setCourseFees([]);
      }
      setIsInitializing(false);
    } catch (error) {
      console.error("Failed to load programme data:", error);
      alert(`Failed to load programme data: ${error.message}`);
      setIsInitializing(false);
    }
  };

  const loadDuplicateData = async (duplicateData) => {
    try {
      const allServices = await ServiceService.getAllServices();
      const mappedServices =
        duplicateData.services?.map((courseService) => {
          const mapped = mapApiCourseServiceToForm(courseService, allServices);
          const {
            id: _csId,
            courseId: _srcCourseId,
            durationPrices: _durationPrices,
            ...restCourseService
          } = mapped;
          return {
            ...restCourseService,
            isMandatory: mapped.isMandatory,
            pricingTiers: mapped.pricingTiers,
          };
        }) || [];

      const mappedData = {
        ...INITIAL_FORM_DATA,
        name: duplicateData.name || "",
        courseTypes: courseTypesToForm(duplicateData),
        description: duplicateData.description || "",
        projectDescription: duplicateData.projectDescription || "",
        durationType: duplicateData.durationUnit || "hours",
        durationPeriod: duplicateData.durationType || "perWeek",
        duration: duplicateData.durationCount?.toString() || "",
        durationEntries: duplicateData.durationCount
          ? [
              {
                id: Date.now(),
                duration: duplicateData.durationCount.toString(),
                period: duplicateData.durationType || "perWeek",
                type: duplicateData.durationUnit || "hours",
              },
            ]
          : [],
        startDates: duplicateData.startMode === "pattern" ? "Pattern" : "Manually",
        coursePatternStartDate: duplicateData.firstStartDate
          ? extractDateFromUTC(duplicateData.firstStartDate)
          : "",
        periodicityOptions: mapPeriodicityFromAPI(duplicateData.periodicity),
        schedule: {
          startTime: "",
          endTime: "",
        },
        scheduleEntries:
          duplicateData.startTime && duplicateData.endTime
            ? [
                {
                  id: Date.now(),
                  startTime: formatTimeForDisplay(duplicateData.startTime),
                  endTime: formatTimeForDisplay(duplicateData.endTime),
                },
              ]
            : [],
        fees:
          duplicateData.fees
            ?.filter((fee) => fee.name && fee.value !== undefined)
            ?.map((fee) => ({
              serviceId: null,
              name: fee.name,
              value: fee.value?.toString() || "0",
              label: fee.name,
              amount: fee.value?.toString() || "0",
            })) || [],
        services: mappedServices,
        pricingRules: [],
        campusId: campusId,
        startDatesPattern:
          duplicateData.startPatterns?.[0]?.patternType === "weekDay"
            ? "days-of-week"
            : "days-of-week",
        selectedDaysOfWeek:
          duplicateData.startPatterns?.[0]?.weekDays?.map((day) => mapWeekDayToForm(day.weekDay)) ||
          [],
        repeatEveryWeeks: duplicateData.startPatterns?.[0]?.repeatEvery?.toString() || "",
        daysOfMonth:
          duplicateData.startPatterns?.[0]?.monthDays
            ?.map((day) => day.dayOfMonth.toString())
            .join(",") || "",
        manualDates:
          duplicateData.startManuals?.map((manual) => extractDateFromUTC(manual.startDate)) || [],
        minAge: duplicateData.minAge?.toString() || "",
        averageRating: duplicateData.averageRating ?? "",
        bestSeller: duplicateData.bestSeller || false,
        isFeatured: duplicateData.isFeatured || false,
        isActive: duplicateData.isActive !== undefined ? duplicateData.isActive : true,
        recommendedLevel: duplicateData.recommendedLevel || "",
        classSize: duplicateData.classSize || "",
        recommendedFor: duplicateData.recommendedFor || "",
        notRecommendedFor: duplicateData.notRecommendedFor || "",
        workload: duplicateData.workload?.toString() || "",
        equipment: duplicateData.equipment || "",
        certificate: duplicateData.certificate || "",
        courseHighlights:
          duplicateData.courseHighlights?.length > 0
            ? duplicateData.courseHighlights
            : [{ text: "" }],
        currency: duplicateData.currency || campusCurrency,
      };

      setFormData(mappedData);
      setInitialServices(mappedServices);

      if (duplicateData.priceLists && duplicateData.priceLists.length > 0) {
        const mappedPriceLists = duplicateData.priceLists.map((pl) => ({
          ...pl,
          id: undefined,
        }));
        setDuplicatePriceLists(mappedPriceLists);
        setPriceLists(mappedPriceLists);
      }

      if (duplicateData.highSeasonFees && duplicateData.highSeasonFees.length > 0) {
        const mappedFees = duplicateData.highSeasonFees.map((fee) => ({
          id: undefined,
          startDate: fee.startDate ? parseUtcDateForPicker(fee.startDate) : null,
          endDate: fee.endDate ? parseUtcDateForPicker(fee.endDate) : null,
          pricePerWeek: fee.supplementPerWeek?.toString() || "0",
          active: fee.active !== false,
        }));
        setDuplicateHighSeasonFees(mappedFees);
        setCourseFees(mappedFees);
      }

      setIsInitializing(false);
    } catch (error) {
      console.error("Failed to load duplicate data:", error);
      setIsInitializing(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const buildDurationPricesPayload = (pricingTiers = [], includeIds = false) =>
    pricingTiers
      .filter((tier) => tier.minWeeks && tier.maxWeeks)
      .map((tier) => {
        const payload = {
          minWeeks: parseInt(tier.minWeeks) || 1,
          maxWeeks: parseInt(tier.maxWeeks) || 1,
          price: parseFloat(tier.amount) || 0,
          mode: tier.priceType === "fixed" ? "FIXED" : "PER_WEEK",
        };

        // Only include real UUIDs from backend, not temporary timestamp-based IDs
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          tier.id
        );
        if (includeIds && isUUID) {
          payload.id = tier.id;
        }

        return payload;
      });

  const buildCourseServicePayload = (service, includeIds = false) => {
    let durationPrices = buildDurationPricesPayload(service.pricingTiers || [], includeIds);

    if (durationPrices.length === 0 && Array.isArray(service.durationPrices)) {
      durationPrices = service.durationPrices
        .filter((tier) => tier.minWeeks && tier.maxWeeks)
        .map((tier) => ({
          minWeeks: parseInt(tier.minWeeks, 10) || 1,
          maxWeeks: parseInt(tier.maxWeeks, 10) || 1,
          price: parseFloat(tier.price) || 0,
          mode: tier.mode === "FIXED" ? "FIXED" : "PER_WEEK",
        }));
    }

    return {
      serviceId: service.service?.id || service.serviceId,
      isMandatory: Boolean(service.isMandatory),
      durationPrices: dedupeDurationPrices(durationPrices),
    };
  };

  const refreshFormServicesFromCourse = async (targetCourseId) => {
    const [courseData, allServices] = await Promise.all([
      CourseService.getCourseById(targetCourseId),
      ServiceService.getAllServices(),
    ]);
    const mappedServices = mapApiCourseServicesToForm(courseData.services, allServices);
    setFormData((prev) => ({ ...prev, services: mappedServices }));
    setInitialServices(mappedServices);
  };

  const buildCourseServicesBulkItems = (services, targetCourseId) =>
    services
      .map((service) => {
        const payload = buildCourseServicePayload(service, false);
        return {
          courseId: targetCourseId,
          serviceId: payload.serviceId,
          isMandatory: payload.isMandatory,
          durationPrices: payload.durationPrices,
        };
      })
      .filter((item) => item.serviceId && item.durationPrices.length > 0);

  const syncCourseServices = async (currentCourseId) => {
    if (!currentCourseId || currentCourseId === "new") {
      return;
    }

    const currentServices = formData.services || [];

    const uniqueServicesMap = new Map();
    currentServices.forEach((service) => {
      const key = service.id || service.service?.id || service.serviceId;
      if (!uniqueServicesMap.has(key)) {
        uniqueServicesMap.set(key, service);
      } else {
      }
    });
    const deduplicatedServices = Array.from(uniqueServicesMap.values());

    const courseData = await CourseService.getCourseById(currentCourseId);
    const linkedByServiceId = new Map(
      (courseData.services || []).map((cs) => [cs.service?.id || cs.serviceId, cs])
    );

    const normalizedServices = deduplicatedServices.map((service) => {
      const serviceId = service.service?.id || service.serviceId;
      const linked = serviceId ? linkedByServiceId.get(serviceId) : null;
      if (!linked?.id || service.id) {
        return service;
      }

      const pricingTiers =
        service.pricingTiers?.length > 0
          ? service.pricingTiers
          : (linked.durationPrices || []).map((tier, index) => ({
              id: tier.id || `${Date.now()}-${index}`,
              minWeeks: tier.minWeeks || 1,
              maxWeeks: tier.maxWeeks || 4,
              priceType: tier.mode === "FIXED" ? "fixed" : "per_week",
              amount: tier.price ?? "",
            }));

      return {
        ...service,
        id: linked.id,
        pricingTiers,
      };
    });

    const isUUID = (id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const initialIdSet = new Set((initialServices || []).map((s) => s.id).filter(Boolean));
    const existingServices = normalizedServices.filter((service) => {
      if (!service.id || !isUUID(service.id)) return false;
      const serviceId = service.service?.id || service.serviceId;
      const linkedId = serviceId ? linkedByServiceId.get(serviceId)?.id : null;
      return initialIdSet.has(service.id) || linkedId === service.id;
    });
    const newServices = normalizedServices.filter((service) => {
      const serviceId = service.service?.id || service.serviceId;
      if (serviceId && linkedByServiceId.has(serviceId)) {
        return false;
      }
      return !service.id || !isUUID(service.id) || !initialIdSet.has(service.id);
    });

    const initialIds = (initialServices || []).map((service) => service.id).filter(Boolean);
    const currentIds = existingServices.map((service) => service.id);
    const removedIds = initialIds.filter((id) => !currentIds.includes(id));

    if (newServices.length > 0) {
      const itemsToCreate = buildCourseServicesBulkItems(newServices, currentCourseId);
      if (itemsToCreate.length > 0) {
        await ServiceService.createCourseServicesBulk(itemsToCreate);
      }
    }

    if (existingServices.length > 0) {
      const items = existingServices.map((service) => ({
        courseId: currentCourseId,
        courseServiceId: service.id,
        isMandatory: Boolean(service.isMandatory),
        durationPrices: buildDurationPricesPayload(service.pricingTiers || [], true),
      }));

      await ServiceService.updateCourseServicesBulk(items);
    }

    for (const removedId of removedIds) {
      await ServiceService.deleteCourseService(currentCourseId, removedId);
    }
  };

  const handleSubmit = async () => {
    const actualCourseId = formData.courseId || (courseId !== "new" ? courseId : null);
    if (!isEditMode && actualCourseId && activeStep === 1) {
      navigate(`/schools/view/${schoolId}/campus/${campusId}?newCourseId=${actualCourseId}`);
      return;
    }

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
        required: formData.startDates === "Pattern",
        custom: (value) => {
          if (formData.startDates === "Pattern" && (!value || value.trim() === "")) {
            return "Please select a start dates pattern";
          }
          return null;
        },
      },
      coursePatternStartDate: {
        required: formData.startDates === "Pattern",
        custom: (value) => {
          if (formData.startDates === "Pattern" && (!value || value.trim() === "")) {
            return "Please enter a programme pattern start date";
          }
          return null;
        },
      },
      manualDates: {
        required: formData.startDates === "Manually",
        custom: (value) => {
          if (
            formData.startDates === "Manually" &&
            (!value || !Array.isArray(value) || value.length === 0)
          ) {
            return "Please add at least one manual start date";
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

    const { isValid, errors: validationErrors } = validateForm(formData, validationRules);

    const hasDurationEntries = formData.durationEntries && formData.durationEntries.length > 0;
    const finalValidationErrors = { ...validationErrors };

    if (hasDurationEntries && finalValidationErrors.duration) {
      delete finalValidationErrors.duration;
    }

    const hasValidationErrors = Object.keys(finalValidationErrors).length > 0;

    if (hasValidationErrors) {
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

    setIsLoading(true);

    try {
      const courseDataWithCampus = {
        ...finalScheduleData,
        campusId: campusId,
      };

      let result;
      if (isEditMode) {
        result = await CourseService.updateCourse(courseId, courseDataWithCampus);
        await syncCourseServices(courseId);
        CourseService.invalidateCourseCache(courseId);
        const newCourseId = result.id;
        const paramName = "updatedCourseId";
        navigate(`/schools/view/${schoolId}/campus/${campusId}?${paramName}=${courseId}`);
      } else {
        await syncCourseServices(formData.courseId || courseId);
        navigate(`/schools/view/${schoolId}/campus/${campusId}?newCourseId=${courseId}`);
      }
    } catch (error) {
      console.error("Failed to save programme:", error);
      alert(`Failed to save programme: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(`/schools/view/${schoolId}/campus/${campusId}`);
  };

  const buildDuplicatePriceListPayload = (priceList, newCourseId) => {
    const priceListPayload = {
      courseId: newCourseId,
      startDate: formatDateToUTC(priceList.startDate),
      endDate: formatDateToUTC(priceList.endDate),
    };

    if (priceList.simplePrices?.length > 0) {
      priceListPayload.simplePrices = priceList.simplePrices;
    }
    if (priceList.flexibleDurationPrices?.length > 0) {
      priceListPayload.flexibleDurationPrices = priceList.flexibleDurationPrices;
    }
    if (priceList.fixedDurationPrices?.length > 0) {
      priceListPayload.fixedDurationPrices = priceList.fixedDurationPrices;
    }
    if (priceList.fullPaymentDiscount) {
      priceListPayload.fullPaymentDiscount = priceList.fullPaymentDiscount;
    }

    return priceListPayload;
  };

  const copyDuplicatePricingData = async (newCourseId) => {
    const sourcePriceLists =
      duplicatePriceLists.length > 0 ? duplicatePriceLists : priceLists;

    if (sourcePriceLists.length > 0) {
      for (const priceList of sourcePriceLists) {
        await CoursePriceListService.create(buildDuplicatePriceListPayload(priceList, newCourseId));
      }
      await loadPriceLists(newCourseId);
    }

    const sourceHighSeasonFees =
      duplicateHighSeasonFees.length > 0 ? duplicateHighSeasonFees : courseFees;

    if (sourceHighSeasonFees.length > 0) {
      const feesToCreate = sourceHighSeasonFees.map((fee) => ({
        startDate: formatDateToUTC(fee.startDate),
        endDate: formatDateToUTC(fee.endDate),
        supplementPerWeek: parseFloat(fee.pricePerWeek) || 0,
        active: fee.active !== false,
      }));
      await CourseFeeService.createCourseFees(newCourseId, feesToCreate);
      await loadCourseFees(newCourseId);
    }
  };

  const handleNext = async () => {
    if (!isEditMode && activeStep === 0 && courseId === "new") {
      let createdCourseId = null;
      try {
        setIsInitializing(true);
        const courseDataWithCampus = {
          ...formData,
          campusId: campusId,
          services: [],
        };

        const created = await CourseService.createCourse(courseDataWithCampus);
        createdCourseId = created.id;

        if (formData.services?.length > 0) {
          const itemsToCreate = buildCourseServicesBulkItems(formData.services, created.id);
          if (itemsToCreate.length > 0) {
            await ServiceService.createCourseServicesBulk(itemsToCreate);
            await refreshFormServicesFromCourse(created.id);
          }
        }

        if (isDuplicateMode) {
          await copyDuplicatePricingData(created.id);
        }

        window.history.replaceState(
          null,
          "",
          `/schools/view/${schoolId}/campus/${campusId}/add-course/${created.id}`
        );
        setFormData((prev) => ({ ...prev, courseId: created.id }));
        setActiveStep(1);
        return;
      } catch (err) {
        console.error("Failed to create programme before pricing:", err);
        if (createdCourseId) {
          try {
            await CourseService.rollbackCreatedCourse(createdCourseId);
          } catch (rollbackError) {
            console.error("Failed to roll back partial programme copy:", rollbackError);
          }
        }
        alert(`Failed to create programme before pricing: ${err.message}`);
        return;
      } finally {
        setIsInitializing(false);
      }
    }
    setActiveStep(activeStep + 1);
  };

  const handleBack = () => {
    setActiveStep(activeStep - 1);
  };

  const getTitle = () => {
    return isEditMode ? "Edit Programme" : "Add Programme";
  };

  const getSubmitButtonText = () => {
    return isEditMode ? "Save Programme" : "Add Programme";
  };

  const isLastStep = activeStep === steps.length - 1;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <CoursePageLoadingOverlay isVisible={isInitializing} />
      <SoftBox my={3}>
        <Grid container justifyContent="center" sx={{ height: "100%" }}>
          <Grid item xs={12} lg={10}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
            <Card sx={{ height: "100%", marginBottom: isEditMode ? "0px" : "-150px" }}>
              <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3}>
                <SoftTypography variant="h5" fontWeight="medium">
                  {getTitle()}
                </SoftTypography>
                <SoftBox display="flex" gap={2}>
                  <>
                    {activeStep === 0 ? (
                      <SoftButton color="light" onClick={handleCancel} disabled={isInitializing}>
                        Cancel
                      </SoftButton>
                    ) : (
                      <SoftButton color="light" onClick={handleBack} disabled={isInitializing}>
                        Back
                      </SoftButton>
                    )}
                    {isLastStep ? (
                      <SoftButton
                        variant="gradient"
                        color="info"
                        onClick={handleSubmit}
                        disabled={isLoading || isInitializing}
                      >
                        {isLoading
                          ? "Saving..."
                          : isInitializing
                          ? "Loading..."
                          : isEditMode
                          ? "Save"
                          : "Finish"}
                      </SoftButton>
                    ) : (
                      <SoftButton
                        variant="gradient"
                        color="info"
                        onClick={handleNext}
                        disabled={isInitializing}
                      >
                        Next
                      </SoftButton>
                    )}
                  </>
                </SoftBox>
              </SoftBox>

              <SoftBox p={3}>
                {getStepContent(
                  activeStep,
                  formData,
                  handleInputChange,
                  false,
                  errors,
                  clearFieldErrorOnChange,
                  campusId,
                  handleCancel,
                  handleNext,
                  isEditMode,
                  priceLists,
                  handlePriceListSaved,
                  courseFees,
                  courseId,
                  isDuplicateMode
                )}
              </SoftBox>

              {isEditMode && (
                <SoftBox display="flex" justifyContent="flex-end" gap={2} p={3} pt={2}>
                  <SoftButton color="light" onClick={handleCancel} disabled={isInitializing}>
                    Cancel
                  </SoftButton>
                  <SoftButton
                    variant="gradient"
                    color="info"
                    onClick={handleSubmit}
                    disabled={isLoading || isInitializing}
                  >
                    {isLoading ? "Saving..." : isInitializing ? "Loading..." : "Save"}
                  </SoftButton>
                </SoftBox>
              )}
            </Card>
          </Grid>
        </Grid>
      </SoftBox>
    </DashboardLayout>
  );
}

export default AddCoursePage;
