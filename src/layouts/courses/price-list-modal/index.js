import { useState, useEffect, useRef, useCallback } from "react";
import PropTypes from "prop-types";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";

import Paper from "@mui/material/Paper";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import PriceSection from "../add-course-modal/components/PriceSection";
import { CoursePriceListService } from "services/coursePriceListService";
import { CourseFeeService } from "services/courseFeeService";
import { CampusService } from "services/campusService";
import { formatDateToUTC, parseUtcDateForPicker } from "utils/dateUtils";

function PriceListModal({
  open,
  onClose,
  courseId,
  courseName,
  priceListId = null,
  campusId = null,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    pricingRules: [],
    currency: "EUR",
  });
  const [existingPriceLists, setExistingPriceLists] = useState([]);
  const [courseFees, setCourseFees] = useState([]);
  const [initialCourseFees, setInitialCourseFees] = useState([]); 
  const [errors, setErrors] = useState({});
  const [currentPriceList, setCurrentPriceList] = useState({
    startDate: "",
    endDate: "",
    highSeasonFees: [],
  });
  const latestCourseFeesRef = useRef([]);
  const priceSectionSaveRef = useRef(null);
  const priceSectionCancelRef = useRef(null);

  const loadCampusCurrency = async (id) => {
    try {
      const campusData = await CampusService.getCampusById(id);
      const currency = campusData.currency || "EUR";
      setFormData((prev) => ({ ...prev, currency }));
    } catch (error) {
      console.error("Failed to load location currency:", error);
      setFormData((prev) => ({ ...prev, currency: "EUR" }));
    }
  };

  const resetFormState = () => {
    setFormData({
      pricingRules: [],
      currency: "EUR",
    });
    setCurrentPriceList({
      startDate: "",
      endDate: "",
    });
    setErrors({});
  };

  useEffect(() => {
    if (!open) {
      setExistingPriceLists([]);
      resetFormState();
      setCourseFees([]);
      setInitialCourseFees([]);
      return;
    }

    if (open && courseId) {
      setExistingPriceLists([]);
      resetFormState();
      setCourseFees([]);

      const loadPriceLists = async () => {
        try {
          setIsLoading(true);
          const data = await CoursePriceListService.listByCourse(courseId);
          if (Array.isArray(data)) {
            setExistingPriceLists(data);
          } else {
            setExistingPriceLists([]);
          }
        } catch (e) {
          console.error("Failed to load price lists", e);
          setExistingPriceLists([]);
        } finally {
          setIsLoading(false);
        }
      };

      const loadCourseFees = async () => {
        try {
          const feesData = await CourseFeeService.getCourseFees(courseId);
          console.log('[PriceListModal] Loaded course fees:', {
            courseId,
            feesCount: feesData.length,
            feesData,
          });
          const mappedFees = feesData.map((fee) => ({
            id: fee.id,
            startDate: fee.startDate ? parseUtcDateForPicker(fee.startDate) : null,
            endDate: fee.endDate ? parseUtcDateForPicker(fee.endDate) : null,
            pricePerWeek: fee.supplementPerWeek?.toString() || "0",
            active: fee.active !== false,
          }));
          console.log('[PriceListModal] Mapped fees:', mappedFees);
          latestCourseFeesRef.current = mappedFees;
          setCourseFees(mappedFees);
          setInitialCourseFees(mappedFees); 
          setCurrentPriceList((prev) => ({
            ...prev,
            highSeasonFees: mappedFees,
          }));
        } catch (error) {
          console.error("Failed to load programme fees:", error);
          setCourseFees([]);
          setInitialCourseFees([]);
        }
      };

      loadPriceLists();
      loadCourseFees();
    }
  }, [open, courseId, priceListId]);

  useEffect(() => {
    if (courseId) {
      setExistingPriceLists([]);
      resetFormState();
    }
  }, [courseId]);

  useEffect(() => {
    if (campusId && open) {
      loadCampusCurrency(campusId);
    }
  }, [campusId, open]);

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const clearFieldErrorOnChange = (field) => {
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleSavePriceList = useCallback(async () => {
    try {
      if (typeof priceSectionSaveRef.current === "function") {
        await priceSectionSaveRef.current();
      } else {
        return;
      }
      if (courseId) {
        let feesToUse =
          latestCourseFeesRef.current.length > 0
            ? latestCourseFeesRef.current
            : courseFees.length > 0
              ? courseFees
              : initialCourseFees;

        const validFees = feesToUse.filter((fee) => {
          const hasDates = fee.startDate && fee.endDate;
          const hasPrice =
            fee.pricePerWeek &&
            fee.pricePerWeek !== "0" &&
            fee.pricePerWeek !== "";
          return hasDates && hasPrice;
        });

        const normalizeFeeForCompare = (fee) => {
          const s = fee.startDate && (Array.isArray(fee.startDate) ? fee.startDate[0] : fee.startDate);
          const e = fee.endDate && (Array.isArray(fee.endDate) ? fee.endDate[0] : fee.endDate);
          const startStr = s ? formatDateToUTC(s) : "";
          const endStr = e ? formatDateToUTC(e) : "";
          const price = String(fee.pricePerWeek ?? "").trim();
          return { id: fee.id || "", startStr, endStr, price, active: fee.active !== false };
        };

        const initialNormalized = initialCourseFees.map(normalizeFeeForCompare).sort((a, b) => (a.id || "").localeCompare(b.id || ""));
        const currentNormalized = validFees.map(normalizeFeeForCompare).sort((a, b) => (a.id || "").localeCompare(b.id || ""));
        const feesUnchanged =
          initialNormalized.length === currentNormalized.length &&
          initialNormalized.every(
            (init, i) =>
              init.id === currentNormalized[i].id &&
              init.startStr === currentNormalized[i].startStr &&
              init.endStr === currentNormalized[i].endStr &&
              init.price === currentNormalized[i].price &&
              init.active === currentNormalized[i].active
          );

        if (!feesUnchanged) {
          const initialFeeIds = new Set(
            initialCourseFees.map((f) => f.id).filter(Boolean)
          );
          const currentFeeIds = new Set(
            validFees.map((f) => f.id).filter(Boolean)
          );
          const hasDeletions = [...initialFeeIds].some(
            (id) => !currentFeeIds.has(id)
          );
          const existingFees = validFees.filter((fee) => fee.id);
          const newFees = validFees.filter((fee) => !fee.id);

          const formatFee = (fee) => {
            let startDate = fee.startDate;
            let endDate = fee.endDate;
            if (Array.isArray(startDate) && startDate.length > 0)
              startDate = startDate[0];
            if (Array.isArray(endDate) && endDate.length > 0)
              endDate = endDate[0];
            const priceVal = fee.pricePerWeek ?? "0";
            const parsed = parseFloat(
              String(priceVal).trim().replace(/[^\d.-]/g, "")
            );
            const supplementPerWeek =
              !isNaN(parsed) && parsed > 0 ? parsed : 0;
            return {
              startDate: formatDateToUTC(startDate),
              endDate: formatDateToUTC(endDate),
              supplementPerWeek,
              active: fee.active !== false,
            };
          };

          if (hasDeletions) {
            await CourseFeeService.deleteCourseFees(courseId);
            if (validFees.length > 0) {
              await CourseFeeService.createCourseFees(
                courseId,
                validFees.map(formatFee)
              );
            }
          } else {
            if (newFees.length > 0) {
              await CourseFeeService.createCourseFees(
                courseId,
                newFees.map(formatFee)
              );
            }
            if (existingFees.length > 0) {
              const feesToUpdate = existingFees.map((fee) => ({
                id: fee.id,
                ...formatFee(fee),
              }));
              const invalidFees = feesToUpdate.filter(
                (f) => f.supplementPerWeek < 1
              );
              if (invalidFees.length > 0) {
                alert(
                  "Error: Some fees have invalid prices. Please check the \"Price Per Week\" values."
                );
                return;
              }
              await CourseFeeService.updateCourseFees(courseId, feesToUpdate);
            }
          }
        }
      }

      if (courseId) {
        const data = await CoursePriceListService.listByCourse(courseId);
        if (Array.isArray(data)) {
          setExistingPriceLists(data);
        }
        try {
          const feesData = await CourseFeeService.getCourseFees(courseId);
          const mappedFees = feesData.map((fee) => ({
            id: fee.id,
            startDate: fee.startDate ? parseUtcDateForPicker(fee.startDate) : null,
            endDate: fee.endDate ? parseUtcDateForPicker(fee.endDate) : null,
            pricePerWeek: fee.supplementPerWeek?.toString() || "0",
            active: fee.active !== false,
          }));
          latestCourseFeesRef.current = mappedFees;
          setCourseFees(mappedFees);
          setInitialCourseFees(mappedFees);
          setCurrentPriceList((prev) => ({
            ...prev,
            highSeasonFees: mappedFees,
          }));
        } catch (error) {
          console.error("Failed to reload programme fees:", error);
        }
      }
      onClose();
    } catch (error) {
      if (error?.message !== "Validation failed") {
        alert(`Failed to save: ${error.message}`);
      }
    }
  }, [courseId, courseFees, initialCourseFees, onClose]);

  const handleCancel = () => {
    if (typeof priceSectionCancelRef.current === "function") {
      priceSectionCancelRef.current();
    }
    onClose();
  };

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
        <SoftBox display="flex" justifyContent="space-between" alignItems="center">
          <SoftTypography variant="h5" fontWeight="medium">
            Edit Price Lists - {courseName}
          </SoftTypography>
          <SoftBox display="flex" gap={2}>
            <SoftButton color="light" onClick={handleCancel}>
              Cancel
            </SoftButton>
            <SoftButton variant="gradient" color="info" onClick={handleSavePriceList}>
              Save
            </SoftButton>
          </SoftBox>
        </SoftBox>
      </DialogTitle>

      <DialogContent>
        <SoftBox p={2}>
          <Paper
            sx={{
              p: 2,
              border: "1px solid",
              borderColor: "grey.300",
              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              borderRadius: 4,
            }}
          >
            <PriceSection
              key={open ? courseId || "open" : "closed"}
              formData={formData}
              onInputChange={handleInputChange}
              disabled={false}
              errors={errors}
              clearFieldErrorOnChange={clearFieldErrorOnChange}
              initialPriceLists={existingPriceLists}
              initialCourseFees={courseFees}
              currentPriceList={currentPriceList}
              setCurrentPriceList={setCurrentPriceList}
              courseId={courseId}
              syncFeesOnSavePriceList={false}
              hideActionButtons
              onRegisterSaveHandler={(fn) => {
                priceSectionSaveRef.current = fn;
              }}
              onRegisterCancelHandler={(fn) => {
                priceSectionCancelRef.current = fn;
              }}
              onSavePriceList={async (payload) =>
                CoursePriceListService.create({ ...payload, courseId })
              }
              onUpdatePriceList={async (id, payload) => CoursePriceListService.update(id, payload)}
              onPriceListSaved={async () => {
                if (courseId) {
                  try {
                    const data = await CoursePriceListService.listByCourse(courseId);
                    if (Array.isArray(data)) {
                      setExistingPriceLists(data);
                    }
                  } catch (e) {
                    console.error("Failed to reload price lists", e);
                  }
                }
              }}
              onDeletePriceList={async (id) => CoursePriceListService.delete(id)}
              onSaveCourseFees={async (fees) => {
                if (courseId) {
                  await CourseFeeService.createCourseFees(courseId, fees);
                }
              }}
              onUpdateCourseFees={async (fees) => {
                if (courseId) {
                  const invalidFees = fees.filter(f => f.supplementPerWeek < 1);
                  if (invalidFees.length > 0) {
                    console.error('[PriceListModal] Invalid fees in onUpdateCourseFees:', invalidFees);
                    throw new Error(`Some fees have invalid prices (supplementPerWeek < 1). Please check the "Price Per Week" values.`);
                  }
                  await CourseFeeService.updateCourseFees(courseId, fees);
                }
              }}
              onDeleteCourseFees={async () => {
                if (courseId) {
                  await CourseFeeService.deleteCourseFees(courseId);
                }
              }}
              onHighSeasonFeesChange={(fees) => {
                if (fees.length > 0 || (latestCourseFeesRef.current.length > 0 && fees.length === 0)) {
                  latestCourseFeesRef.current = fees;
                  setCourseFees(fees);
                } else {
                  console.log('[PriceListModal] Ignoring empty fees update (likely initialization)');
                }
              }}
              onCourseFeesSynced={async () => {
                if (courseId) {
                  try {
                    const feesData = await CourseFeeService.getCourseFees(courseId);
                    const mappedFees = feesData.map((fee) => ({
                      id: fee.id,
                      startDate: fee.startDate ? parseUtcDateForPicker(fee.startDate) : null,
                      endDate: fee.endDate ? parseUtcDateForPicker(fee.endDate) : null,
                      pricePerWeek: fee.supplementPerWeek?.toString() || "0",
                      active: fee.active !== false,
                    }));
                    latestCourseFeesRef.current = mappedFees;
                    setCourseFees(mappedFees);
                    setInitialCourseFees(mappedFees);
                    setCurrentPriceList((prev) => ({ ...prev, highSeasonFees: mappedFees }));
                  } catch (error) {
                    console.error("Failed to reload programme fees after sync:", error);
                  }
                }
              }}
            />
          </Paper>
        </SoftBox>
      </DialogContent>
    </Dialog>
  );
}

PriceListModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  courseId: PropTypes.string,
  courseName: PropTypes.string,
  priceListId: PropTypes.string,
  campusId: PropTypes.string,
};

export default PriceListModal;
