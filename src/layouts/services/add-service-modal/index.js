import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Stepper from "@mui/material/Stepper";
import Step from "@mui/material/Step";
import StepLabel from "@mui/material/StepLabel";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import BasicInformation from "./components/BasicInformation";
import CourseAssignmentStep from "./components/CourseAssignmentStep";

import { INITIAL_FORM_DATA, STEPPER_STEPS } from "./constants";
import { ServiceService } from "services/serviceService";
import { useModalLoadingState } from "hooks/useModalLoadingState";
import {
  buildServiceDetailPayload,
  mapServiceDetailToForm,
  validateServiceDetail,
} from "./serviceDetailFields";
import { OptimizedDataService } from "services/optimizedDataService";

function ServiceModal({ open, onClose, mode = "add", serviceData = null, onSuccess }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [activeStep, setActiveStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Detail content as loaded, so a save sends only what the admin changed.
  const initialDetailRef = useRef(null);

  const { isInitializing, canSave, canEdit, setLoading, setInitializing, resetLoadingStates } =
    useModalLoadingState(["courseAssignments"]);

  useEffect(() => {
    const initializeModal = async () => {
      if (open) {
        setInitializing(true);
        setActiveStep(0);

        try {
          if (mode === "add" && !serviceData) {
            initialDetailRef.current = null;
            setFormData(INITIAL_FORM_DATA);
            setInitializing(false);
          } else if (serviceData) {
            let fullServiceData = serviceData;
            if ((mode === "view" || mode === "edit") && serviceData.id && !serviceData.courseServices) {
              try {
                fullServiceData = await ServiceService.getServiceWithCourseServices(serviceData.id);
              } catch (error) {
                console.error("Error loading service data:", error);
              }
            }
            let courseAssignments = [];

            if (fullServiceData.courseAssignments && fullServiceData.courseAssignments.length > 0) {
              courseAssignments = fullServiceData.courseAssignments;
            } else if (fullServiceData.courseServices && fullServiceData.courseServices.length > 0) {
              const courseIds = fullServiceData.courseServices.map((cs) => cs.courseId).filter(Boolean);

              const firstCourseService = fullServiceData.courseServices[0];
              const durationPrices = firstCourseService?.durationPrices || [];
              const pricingTiers =
                durationPrices.length > 0
                  ? durationPrices.map((tier, index) => ({
                      id: `${Date.now()}-${index}`,
                      minWeeks: tier.minWeeks || 1,
                      maxWeeks: tier.maxWeeks || 4,
                      priceType: tier.mode === "FIXED" ? "fixed" : "per_week",
                      amount: tier.price ?? "",
                      durationPriceId: tier.id || null, 
                    }))
                  : [
                      {
                        id: Date.now(),
                        minWeeks: 1,
                        maxWeeks: 4,
                        priceType: "per_week",
                        amount: firstCourseService?.price || "",
                        durationPriceId: null,
                      },
                    ];

              const courseServiceMap = {};
              const courseDurationPricesMap = {};
              
              fullServiceData.courseServices.forEach((cs) => {
                if (cs.courseId && cs.id) {
                  courseServiceMap[cs.courseId] = cs.id;
                  
                  if (cs.durationPrices && cs.durationPrices.length > 0) {
                    courseDurationPricesMap[cs.courseId] = cs.durationPrices.map((dp) => ({
                      id: dp.id,
                      courseServiceId: cs.id,
                      minWeeks: dp.minWeeks || 1,
                      maxWeeks: dp.maxWeeks || 4,
                      price: dp.price ?? 0,
                      mode: dp.mode || "PER_WEEK",
                    }));
                  } else {
                    courseDurationPricesMap[cs.courseId] = [];
                  }
                }
              });

              courseAssignments = [
                {
                  id: Date.now(),
                  countryId: null,
                  schoolIds: [],
                  campusIds: [],
                  courseIds: courseIds,
                  assignToAllCampusCourses: false,
                  assignToAllCountryCourses: false,
                  isMandatory: firstCourseService?.isMandatory || false,
                  pricingTiers: pricingTiers,
                  courseServiceMap: courseServiceMap,
                  courseDurationPricesMap: courseDurationPricesMap,
                  initialCourseIds: courseIds,
                  initialSchoolIds: [],
                  initialCampusIds: [],
                },
              ];
              
           
            }

            const baseForm = {
              id: mode === "add" ? undefined : fullServiceData.id,
              type: fullServiceData.type || "other",
              name: fullServiceData.name || fullServiceData.type || "",
              description: fullServiceData.description || "",
              isActive: fullServiceData.isActive !== undefined ? fullServiceData.isActive : true,
              currency: "EUR",
              courseAssignments: courseAssignments,
              ...mapServiceDetailToForm(fullServiceData),
            };
            // A duplicate is created from scratch, so all of its copied content is sent.
            initialDetailRef.current =
              mode === "edit" ? mapServiceDetailToForm(fullServiceData) : null;

            setFormData(baseForm);

            setInitializing(false);
          }
        } catch (error) {
          console.error("Error initializing modal:", error);
          setInitializing(false);
        }
      } else {
        resetLoadingStates();
        OptimizedDataService.clearCache();
      }
    };

    initializeModal();
  }, [open, mode, serviceData, setInitializing, setLoading, resetLoadingStates]);

  const handleInputChange = (field, value) => {
    if (mode === "view") return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (activeStep < STEPPER_STEPS.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep((prev) => prev - 1);
    }
  };

  const validateStep1 = () => {
    if (!formData.type || !formData.name || !formData.currency) return false;
    // Detail content errors are shown inline on this step, so it cannot be left with them.
    return Object.keys(validateServiceDetail(formData)).length === 0;
  };

  const buildCourseServicesPayload = async (serviceId, isEditMode = false, assignmentOverride = null) => {
    const itemsToCreate = [];
    const itemsToUpdate = [];
    const itemsToDelete = [];

    const assignmentsToProcess = assignmentOverride 
      ? [assignmentOverride] 
      : (formData.courseAssignments || []);

    for (const assignment of assignmentsToProcess) {
      const courseIds = assignment.courseIds || [];
      const initialCourseIds = assignment.initialCourseIds || [];
      const pricingTiers = assignment.pricingTiers || [];
      const courseServiceMap = assignment.courseServiceMap || {};
      const courseDurationPricesMap = assignment.courseDurationPricesMap || {};

      const removedCourseIds = initialCourseIds.filter(
        (initialId) => !courseIds.includes(initialId)
      );

      const removedCourseIdsSet = new Set(removedCourseIds);

      const missingCourseServiceIds = removedCourseIds.filter((courseId) => !courseServiceMap[courseId]);
      if (missingCourseServiceIds.length > 0 && isEditMode && serviceId) {
        try {
          const courseServices = await ServiceService.getCourseServicesByServiceId(serviceId);
          courseServices.forEach((cs) => {
            if (cs.courseId && cs.id && !courseServiceMap[cs.courseId]) {
              courseServiceMap[cs.courseId] = cs.id;
            }
          });
        } catch (error) {
          console.error("[buildCourseServicesPayload] Error fetching courseServices:", error);
        }
      }

      removedCourseIds.forEach((courseId) => {
        const courseServiceId = courseServiceMap[courseId];
        if (courseServiceId) {
          itemsToDelete.push({
            courseId: courseId,
            courseServiceId: courseServiceId,
          });
        }
      });

      const coursesToProcess = courseIds.filter((courseId) => !removedCourseIdsSet.has(courseId));
      
      coursesToProcess.forEach((courseId) => {
        if (itemsToDelete.some((item) => item.courseId === courseId)) {
          return;
        }
        
        const courseServiceId = courseServiceMap[courseId];
        const existingDurationPrices = courseDurationPricesMap[courseId] || [];
        
        if (isEditMode && courseServiceId) {
          const durationPricesForUpdate = pricingTiers.map((tier) => {
            const tierMinWeeks = parseInt(tier.minWeeks) || 1;
            const tierMaxWeeks = parseInt(tier.maxWeeks) || 4;
            const tierPrice = parseFloat(tier.amount) || 0;
            const tierMode = tier.priceType === "per_week" ? "PER_WEEK" : "FIXED";
            
            let existingDp = null;
            
            if (tier.durationPriceId) {
              existingDp = existingDurationPrices.find(
                (dp) => dp.id === tier.durationPriceId && dp.courseServiceId === courseServiceId
              );
            }
            
            if (!existingDp) {
              existingDp = existingDurationPrices.find(
                (dp) => dp.courseServiceId === courseServiceId &&
                        dp.minWeeks === tierMinWeeks &&
                        dp.maxWeeks === tierMaxWeeks &&
                        dp.price === tierPrice &&
                        dp.mode === tierMode
              );
            }
            
            const durationPricePayload = {
              minWeeks: tierMinWeeks,
              maxWeeks: tierMaxWeeks,
              price: tierPrice,
              mode: tierMode,
            };
            
            if (existingDp) {
              durationPricePayload.id = String(existingDp.id);
            }
            
            return durationPricePayload;
          });
          
          const allHaveId = durationPricesForUpdate.every((dp) => dp.id);
          
          if (!allHaveId) {
            itemsToDelete.push({
              courseId: courseId,
              courseServiceId: courseServiceId,
            });
            
            itemsToCreate.push({
              serviceId: serviceId,
              courseId: courseId,
              isMandatory: Boolean(assignment.isMandatory),
              durationPrices: pricingTiers.map((tier) => ({
                minWeeks: parseInt(tier.minWeeks) || 1,
                maxWeeks: parseInt(tier.maxWeeks) || 4,
                price: parseFloat(tier.amount) || 0,
                mode: tier.priceType === "per_week" ? "PER_WEEK" : "FIXED",
              })),
            });
          } else {
            itemsToUpdate.push({
              courseId: courseId,
              courseServiceId: courseServiceId,
              isMandatory: Boolean(assignment.isMandatory),
              durationPrices: durationPricesForUpdate,
            });
          }
        } else {
          itemsToCreate.push({
            serviceId: serviceId,
            courseId: courseId,
            isMandatory: Boolean(assignment.isMandatory),
            durationPrices: pricingTiers.map((tier) => ({
              minWeeks: parseInt(tier.minWeeks) || 1,
              maxWeeks: parseInt(tier.maxWeeks) || 4,
              price: parseFloat(tier.amount) || 0,
              mode: tier.priceType === "per_week" ? "PER_WEEK" : "FIXED",
            })),
          });
        }
      });
    }

    const deletedCourseIdsSet = new Set(itemsToDelete.map((item) => item.courseId));
    const filteredItemsToCreate = itemsToCreate.filter(
      (item) => !deletedCourseIdsSet.has(item.courseId)
    );
    const filteredItemsToUpdate = itemsToUpdate.filter(
      (item) => !deletedCourseIdsSet.has(item.courseId)
    );

    return { 
      itemsToCreate: filteredItemsToCreate, 
      itemsToUpdate: filteredItemsToUpdate, 
      itemsToDelete 
    };
  };

  const validateAndCleanAssignment = async (assignment) => {
    if (!assignment) return assignment;

    const { 
      schoolIds = [], 
      campusIds = [], 
      courseIds = [], 
      initialCourseIds = [],
      initialSchoolIds = [],
      initialCampusIds = []
    } = assignment;
    
    if (courseIds.length === 0 && initialCourseIds.length === 0) {
      if (assignment.assignToAllCampusCourses && assignment.campusIds?.length > 0) {
        return assignment;
      }
      if (assignment.assignToAllCountryCourses && assignment.countryId) {
        return assignment;
      }
      return {
        ...assignment,
        schoolIds: [],
        campusIds: [],
        courseIds: [],
      };
    }

    const removedSchoolIds = initialSchoolIds.filter((id) => !schoolIds.includes(id));
    const removedCampusIds = initialCampusIds.filter((id) => !campusIds.includes(id));

    if (removedSchoolIds.length === 0 && removedCampusIds.length === 0) {
      return assignment;
    }

    const allCourseIds = [...new Set([...courseIds, ...initialCourseIds])];
    if (allCourseIds.length === 0) {
      return assignment;
    }

    let relatedData = { schools: [], campuses: [], courses: [] };
    try {
      relatedData = await OptimizedDataService.getRelatedDataForCourses(allCourseIds);
    } catch (error) {
      return assignment;
    }

    const courseToCampusMap = new Map();
    const campusToSchoolMap = new Map();
    
    relatedData.courses.forEach((course) => {
      if (course.campusId) {
        courseToCampusMap.set(course.value, course.campusId);
      }
    });

    relatedData.campuses.forEach((campus) => {
      if (campus.schoolId) {
        campusToSchoolMap.set(campus.value, campus.schoolId);
      }
    });

    let validCampusIds = campusIds.filter((campusId) => {
      const schoolId = campusToSchoolMap.get(campusId);
      if (!schoolId) return true;
      return !removedSchoolIds.includes(schoolId) && schoolIds.includes(schoolId);
    });

    validCampusIds = validCampusIds.filter((campusId) => !removedCampusIds.includes(campusId));

    const finalCourseIds = courseIds.filter((courseId) => {
      const campusId = courseToCampusMap.get(courseId);
      if (!campusId) {
        return true;
      }
      
      if (removedCampusIds.includes(campusId)) {
        return false;
      }
      
      const schoolId = campusToSchoolMap.get(campusId);
      if (schoolId && removedSchoolIds.includes(schoolId)) {
        return false;
      }
      
      return validCampusIds.includes(campusId);
    });

    return {
      ...assignment,
      schoolIds,
      campusIds: validCampusIds,
      courseIds: finalCourseIds,
      initialCourseIds: assignment.initialCourseIds || [],
      initialSchoolIds: assignment.initialSchoolIds || [],
      initialCampusIds: assignment.initialCampusIds || [],
    };
  };

  const handleSubmit = async () => {
    if (!canSave) return;

    const detailErrors = validateServiceDetail(formData);
    if (Object.keys(detailErrors).length > 0) {
      alert(Object.values(detailErrors).join("\n"));
      return;
    }

    setIsSubmitting(true);
    try {
      const servicePayload = {
        type: formData.type,
        name: formData.name,
        isActive: formData.isActive,
        currency: formData.currency,
        description: formData.description,
        ...buildServiceDetailPayload(
          formData,
          mode === "edit" && serviceData ? initialDetailRef.current : null
        ),
      };

      let newServiceId;
      if (mode === "edit" && serviceData) {
        const updatedService = await ServiceService.updateService(serviceData.id, servicePayload);
        newServiceId = updatedService.id;
      } else {
        const newService = await ServiceService.createService(servicePayload);
        newServiceId = newService.id;
      }

      let assignment = formData.courseAssignments?.[0];
      
      if (assignment) {
        assignment = await validateAndCleanAssignment(assignment);
      }
      const pricingTiers = assignment?.pricingTiers || [];

      const durationPricesPayload = pricingTiers.map((tier) => ({
        minWeeks: parseInt(tier.minWeeks) || 1,
        maxWeeks: parseInt(tier.maxWeeks) || 4,
        price: parseFloat(tier.amount) || 0,
        mode: tier.priceType === "per_week" ? "PER_WEEK" : "FIXED",
      }));

      let bulkResult = null;

      if (assignment?.assignToAllCountryCourses && assignment?.countryId) {
        try {
          bulkResult = await ServiceService.addServiceToCountryCourses(assignment.countryId, {
            serviceId: newServiceId,
            isMandatory: Boolean(assignment?.isMandatory),
            durationPrices: durationPricesPayload,
            dryRun: false,
          });
        } catch (csError) {
          console.error("Error adding service to country courses:", csError);
        }
      } else if (assignment?.assignToAllCampusCourses && assignment?.campusIds?.length > 0) {
        try {
          const allCourses = await OptimizedDataService.getCoursesForCampuses(assignment.campusIds);
          const courseIds = allCourses.map((course) => course.value);
          
          const assignmentWithAllCourses = {
            ...assignment,
            courseIds: courseIds,
            assignToAllCampusCourses: false,
          };
          
          const { itemsToCreate, itemsToUpdate, itemsToDelete } = await buildCourseServicesPayload(newServiceId, mode === "edit", assignmentWithAllCourses);
          
          if (itemsToDelete.length > 0) {
            for (const item of itemsToDelete) {
              try {
                await ServiceService.deleteCourseService(item.courseId, item.courseServiceId);
              } catch (deleteError) {
                console.error("[handleSubmit] Error deleting course service:", item, deleteError);
                throw deleteError;
              }
            }
          }
          
          if (itemsToUpdate.length > 0) {
            try {
              await ServiceService.updateCourseServicesBulk(itemsToUpdate);
            } catch (csError) {
              console.error("[handleSubmit] Error updating course services:", csError);
              throw csError;
            }
          }
          
          if (itemsToCreate.length > 0) {
            try {
              await ServiceService.createCourseServicesBulk(itemsToCreate);
            } catch (csError) {
              console.error("[handleSubmit] Error creating course services:", csError);
              throw csError;
            }
          }
        } catch (csError) {
          console.error("Error adding service to campus courses:", csError);
          throw csError;
        }
      } else {
        const { itemsToCreate, itemsToUpdate, itemsToDelete } = await buildCourseServicesPayload(newServiceId, mode === "edit", assignment);
        
        if (itemsToDelete.length > 0) {
          for (const item of itemsToDelete) {
            try {
              await ServiceService.deleteCourseService(item.courseId, item.courseServiceId);
            } catch (deleteError) {
              console.error("[handleSubmit] Error deleting course service:", item, deleteError);
              throw deleteError;
            }
          }
        }
        
        if (itemsToUpdate.length > 0) {
          try {
            await ServiceService.updateCourseServicesBulk(itemsToUpdate);
          } catch (csError) {
            console.error("[handleSubmit] Error updating course services:", csError);
            throw csError;
          }
        }
        
        if (itemsToCreate.length > 0) {
          try {
            await ServiceService.createCourseServicesBulk(itemsToCreate);
          } catch (csError) {
            console.error("[handleSubmit] Error creating course services:", csError);
            throw csError;
          }
        }
      }

      if (onSuccess) {
        onSuccess(newServiceId, mode === "edit" ? "edit" : "add");
      }

      onClose();

      if (mode === "add" && newServiceId) {
        if (bulkResult) {
          navigate(`/services/${newServiceId}/bulk-result`, { state: { bulkResult } });
        } else {
          navigate(`/services/${newServiceId}/pricing`);
        }
      }
    } catch (error) {
      console.error("Error saving service:", error);
      alert(`Failed to save extra: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "view":
        return "View Extra";
      case "edit":
        return "Edit Extra";
      default:
        return "Add Extra";
    }
  };

  const isViewMode = mode === "view";
  const isLastStep = activeStep === STEPPER_STEPS.length - 1;
  const canProceed = activeStep === 0 ? validateStep1() : true;

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
                Loading extra...
              </SoftTypography>
              <SoftTypography variant="body2" color="text" textAlign="center" mt={1}>
                Please wait while we prepare the form
              </SoftTypography>
            </SoftBox>
          )}

          <SoftBox mb={3}>
            <Stepper activeStep={activeStep} alternativeLabel>
              {STEPPER_STEPS.map((step, index) => (
                <Step key={step.label}>
                  <StepLabel
                    onClick={() => {
                      if (isViewMode && !isInitializing) {
                        setActiveStep(index);
                      }
                    }}
                    sx={{
                      cursor: isViewMode && !isInitializing ? "pointer" : "default",
                      "& .MuiStepLabel-label": {
                        cursor: isViewMode && !isInitializing ? "pointer" : "default",
                      },
                      "&:hover": {
                        opacity: isViewMode && !isInitializing ? 0.8 : 1,
                      },
                    }}
                  >
                    <SoftTypography variant="button" fontWeight="medium">
                      {step.label}
                    </SoftTypography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </SoftBox>

          <Divider sx={{ mb: 3 }} />

          <SoftBox sx={{ display: activeStep === 0 ? "block" : "none" }}>
            <BasicInformation
              formData={formData}
              onInputChange={handleInputChange}
              disabled={isViewMode || !canEdit || isSubmitting}
              mode={mode}
            />
          </SoftBox>

          {activeStep === 1 && (
            <CourseAssignmentStep
              formData={formData}
              onInputChange={handleInputChange}
              disabled={isViewMode || !canEdit || isSubmitting}
            />
          )}
        </SoftBox>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <SoftButton color="light" onClick={onClose} disabled={isSubmitting || isInitializing}>
          {isViewMode ? "Close" : "Cancel"}
        </SoftButton>

        {activeStep > 0 && (
          <SoftButton color="light" onClick={handleBack} disabled={isSubmitting || isInitializing}>
            Back
          </SoftButton>
        )}

        {isViewMode && !isLastStep && (
          <SoftButton
            variant="gradient"
            color="info"
            onClick={handleNext}
            disabled={isInitializing}
          >
            Next
          </SoftButton>
        )}

        {!isViewMode && !isLastStep && (
          <SoftButton
            variant="gradient"
            color="info"
            onClick={handleNext}
            disabled={!canProceed || isSubmitting || isInitializing}
          >
            Next
          </SoftButton>
        )}

        {!isViewMode && isLastStep && (
          <SoftButton
            variant="gradient"
            color="info"
            onClick={handleSubmit}
            disabled={!canSave || isSubmitting || isInitializing || formData._hasValidationErrors}
          >
            {isSubmitting ? "Saving..." : "Save"}
          </SoftButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

ServiceModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["add", "edit", "view"]),
  serviceData: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default ServiceModal;
