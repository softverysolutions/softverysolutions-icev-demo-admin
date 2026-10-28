import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import CircularProgress from "@mui/material/CircularProgress";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";

import BasicInformation from "./components/BasicInformation";
import DescriptionSection from "./components/DescriptionSection";
import HostInstructionsSection from "./components/HostInstructionsSection";
import FacilitiesSection from "./components/FacilitiesSection";
import PriceRangeSection from "./components/PriceRangeSection";
import ImageGallery from "./components/ImageGallery";

import { INITIAL_FORM_DATA, INITIAL_PRICE_RANGE, ROOM_TYPE_TO_BACKEND_MAP } from "./constants";
import {
  updateMandatoryServiceRow,
  addMandatoryServiceRow,
  removeMandatoryServiceRow,
} from "./utils/formUtils";
import MandatoryServicesSection from "./components/MandatoryServicesSection";
import { AccommodationService } from "services/accommodationService";
import { AccommodationServicesService } from "services/accommodationServicesService";
import { AccommodationFeeService } from "services/accommodationFeeService";
import { AmenityService } from "services/amenityService";
import { getCurrencySymbol } from "services/currencyService";
import { useModalLoadingState } from "hooks/useModalLoadingState";
import AccommodationLoadingOverlay from "components/AccommodationLoadingOverlay";
import {
  formatDiscountValueInput,
  getDiscountValueForApi,
  validateDiscountValueForSave,
  validateDiscountPercentMax,
} from "utils/discountValueInput";
import {
  mapApiServiceToRow,
  toApiAccommodationServices,
  toApiAccommodationServicesForCreate,
  validateMandatoryServicesForSave,
  createEmptyMandatoryServiceRow,
} from "utils/accommodationMandatoryServices";
import { validateHostContactFields } from "utils/hostContactValidation";

const ACC_MODAL_LOG = "[AccommodationModal]";

function AccommodationModal({
  open,
  onClose,
  mode = "add",
  accommodationData = null,
  schoolId,
  campusId = null,
  onSuccess,
}) {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [priceRange, setPriceRange] = useState(INITIAL_PRICE_RANGE);
  const [availableAmenities, setAvailableAmenities] = useState([]);
  const [fullPaymentDiscount, setFullPaymentDiscount] = useState(null);
  const previousMandatoryServiceIdsRef = useRef([]);

  const { isInitializing, setInitializing, resetLoadingStates, setLoading, isLoading } =
    useModalLoadingState(["cities", "campuses"]);

  useEffect(() => {
    const loadAmenities = async () => {
      try {
        const amenities = await AmenityService.getAllAmenities();
        const uniqueAmenities = amenities.filter(
          (amenity, index, self) => index === self.findIndex((a) => a.name === amenity.name)
        );
        setAvailableAmenities(uniqueAmenities);
      } catch (error) {
        console.error("Error loading amenities:", error);
      }
    };

    loadAmenities();
  }, []);

  useEffect(() => {
    if (open) {
      setInitializing(true);

      if (mode === "add" && !accommodationData) {
        previousMandatoryServiceIdsRef.current = [];
        setFormData({
          ...INITIAL_FORM_DATA,
          schoolId: schoolId || "",
          facilities: [],
        });
        setPriceRange(INITIAL_PRICE_RANGE);
        setFullPaymentDiscount(null);
      } else if (accommodationData) {
        let priceRangeData = {
          type: "simple",
          simple: { price: 0, unit: "week" },
          flexible: [],
          fixed: [],
          highSeasonFees: [],
          mandatoryServices: [],
        };

        if (accommodationData.simplePrices && accommodationData.simplePrices.length > 0) {
          priceRangeData = {
            type: "simple",
            simple: {
              price: accommodationData.simplePrices[0].price || 0,
              unit: accommodationData.simplePrices[0].period || "week",
            },
            flexible: [],
            fixed: [],
            highSeasonFees: accommodationData.highSeasonFees || [],
            mandatoryServices: [],
          };
        } else if (
          (accommodationData.flexiblePrices || accommodationData.flexibleDurationPrices) &&
          (accommodationData.flexiblePrices?.length > 0 ||
            accommodationData.flexibleDurationPrices?.length > 0)
        ) {
          const flexibleData =
            accommodationData.flexibleDurationPrices || accommodationData.flexiblePrices;
          priceRangeData = {
            type: "flexible",
            simple: { price: 0, unit: "week" },
            flexible: flexibleData.map((item) => {
              let maxValue = "";

              if (
                item.maxWeeks === undefined ||
                item.maxWeeks === null ||
                item.maxWeeks === 999999
              ) {
                maxValue = "No max";
              } else if (item.maxWeeks >= 100000) {
                const originalValue = item.maxWeeks - 100000;
                maxValue = `${originalValue}+`;
              } else {
                maxValue = item.maxWeeks.toString();
              }

              return {
                min: item.minWeeks.toString(),
                max: maxValue,
                price: item.pricePerWeek,
                unit: "week",
              };
            }),
            fixed: [],
            highSeasonFees: accommodationData.highSeasonFees || [],
            mandatoryServices: [],
          };
        } else if (
          (accommodationData.fixedPrices || accommodationData.fixedDurationPrices) &&
          (accommodationData.fixedPrices?.length > 0 ||
            accommodationData.fixedDurationPrices?.length > 0)
        ) {
          const fixedData = accommodationData.fixedDurationPrices || accommodationData.fixedPrices;
          priceRangeData = {
            type: "fixed",
            simple: { price: 0, unit: "week" },
            flexible: [],
            fixed: fixedData.map((item) => ({
              duration: item.durationWeeks,
              price: item.totalPrice,
              unit: "week",
            })),
            highSeasonFees: accommodationData.highSeasonFees || [],
            mandatoryServices: [],
          };
        }

        const convertedImages = accommodationData.images
          ? accommodationData.images.map((image, index) => ({
              id: `existing-${index}`,
              preview: image.imageUrl,
              imageUrl: image.imageUrl,
              caption: image.description || "",
              isExisting: true,
            }))
          : [];

        let facilities = [];
        if (accommodationData.amenities && accommodationData.amenities.length > 0) {
          facilities = accommodationData.amenities
            .map((amenityName) => {
              const amenity = availableAmenities.find((a) => a.name === amenityName);
              return amenity ? { amenityId: amenity.id } : null;
            })
            .filter(Boolean);
        }

        const reverseRoomTypeMap = {};
        Object.entries(ROOM_TYPE_TO_BACKEND_MAP).forEach(([frontend, backend]) => {
          reverseRoomTypeMap[backend] = frontend;
        });

        const campusIds = accommodationData.campuses
          ? accommodationData.campuses.map((campus) => campus.campusId)
          : accommodationData.campusIds || [];

        setFormData({
          name: accommodationData.name || "",
          cityId: accommodationData.cityId || "",
          address: accommodationData.address || "",
          currency: accommodationData.currency || "EUR",
          category: accommodationData.category || "",
          roomType: reverseRoomTypeMap[accommodationData.type] || accommodationData.type || "",
          bathroom: accommodationData.bathroomType || "",
          description: accommodationData.description || "",
          regime: accommodationData.regimeType || "",
          ageLimitMin: accommodationData.minAge?.toString() || "",
          ageLimitMax: accommodationData.maxAge?.toString() || "",
          schoolId: accommodationData.schoolId || schoolId || "",
          facilities: facilities,
          youtubeUrl: accommodationData.url || "",
          images: convertedImages,
          campusIds: campusIds,
          isActive: accommodationData.isActive !== undefined ? accommodationData.isActive : true,
          accommodationInstructions: accommodationData.accommodationInstructions || "",
          accommodationInstructionsNote: accommodationData.accommodationInstructionsNote || "",
          accommodationContactType: accommodationData.accommodationContactType || "",
          accommodationContactName: accommodationData.accommodationContactName || "",
          hostPhone: accommodationData.hostPhone || "",
          hostWhatsapp: accommodationData.hostWhatsapp || "",
          hostEmail: accommodationData.hostEmail || "",
          houseRules: accommodationData.houseRules || "",
        });

        if (accommodationData.fullPaymentDiscount && accommodationData.fullPaymentDiscount.status) {
          const v = accommodationData.fullPaymentDiscount.value;
          const defaultValue = accommodationData.fullPaymentDiscount.type === "fixed" ? "0" : "5";
          setFullPaymentDiscount({
            status: accommodationData.fullPaymentDiscount.status,
            applyToBasePrice: accommodationData.fullPaymentDiscount.applyToBasePrice !== false,
            type: accommodationData.fullPaymentDiscount.type || "percent",
            value: v !== undefined && v !== null && v !== "" ? String(v) : defaultValue,
          });
        } else {
          setFullPaymentDiscount(null);
        }

        if (
          accommodationData.fees &&
          Array.isArray(accommodationData.fees) &&
          accommodationData.fees.length > 0
        ) {
          const highSeasonFees = accommodationData.fees.map((fee) => ({
            id: mode === "add" ? undefined : fee.id,
            startDate: fee.startDate ? new Date(fee.startDate) : null,
            endDate: fee.endDate ? new Date(fee.endDate) : null,
            pricePerWeek: fee.supplementPerWeek?.toString() || "0",
            active: fee.active !== false,
          }));
          priceRangeData.highSeasonFees = highSeasonFees;
        } else if (accommodationData.id) {
          AccommodationFeeService.getAccommodationFees(accommodationData.id)
            .then((feesData) => {
              if (feesData && feesData.length > 0) {
                const highSeasonFees = feesData.map((fee) => ({
                  id: fee.id,
                  startDate: fee.startDate ? new Date(fee.startDate) : null,
                  endDate: fee.endDate ? new Date(fee.endDate) : null,
                  pricePerWeek: fee.supplementPerWeek?.toString() || "0",
                  active: fee.active !== false,
                }));
                setPriceRange((prev) => ({
                  ...prev,
                  highSeasonFees: highSeasonFees,
                }));
              }
            })
            .catch((error) => {
              console.log("Fees not available:", error.message);
            });
        }

        if (!accommodationData.id) {
          if (Array.isArray(accommodationData.services) && accommodationData.services.length > 0) {
            priceRangeData.mandatoryServices = accommodationData.services.map(mapApiServiceToRow);
          }
          previousMandatoryServiceIdsRef.current = [];
        }

        setPriceRange(priceRangeData);

        if (accommodationData.id) {
          AccommodationServicesService.getServices(accommodationData.id)
            .then((list) => {
              const mapped = (list || []).map(mapApiServiceToRow);
              previousMandatoryServiceIdsRef.current = (list || [])
                .map((s) => s.id)
                .filter(Boolean);
              setPriceRange((prev) => ({
                ...prev,
                mandatoryServices: mapped,
              }));
            })
            .catch((error) => {
              if (
                Array.isArray(accommodationData.services) &&
                accommodationData.services.length > 0
              ) {
                setPriceRange((prev) => ({
                  ...prev,
                  mandatoryServices: accommodationData.services.map(mapApiServiceToRow),
                }));
              }
              previousMandatoryServiceIdsRef.current = [];
            });
        }
      }
    } else {
      resetLoadingStates();
    }
  }, [open, mode, accommodationData, availableAmenities, setInitializing, resetLoadingStates]);

  useEffect(() => {
    if (open && (mode === "add" || accommodationData)) {
      if (!isLoading("cities") && !isLoading("campuses") && isInitializing) {
        setInitializing(false);
      }
    }
  }, [open, mode, accommodationData, isLoading, setInitializing, isInitializing]);

  const handleInputChange = (field, value) => {
    if (mode === "view") return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFacilitiesChange = (facilities) => {
    if (mode === "view") return;
    setFormData((prev) => ({ ...prev, facilities }));
  };

  const handleMandatoryChange = (index, field, value) => {
    if (mode === "view") return;
    setPriceRange((prev) => updateMandatoryServiceRow(prev, index, field, value));
  };

  const handleMandatoryAdd = () => {
    if (mode === "view") return;
    setPriceRange((prev) => addMandatoryServiceRow(prev, createEmptyMandatoryServiceRow));
  };

  const handleMandatoryRemove = (index) => {
    if (mode === "view") return;
    setPriceRange((prev) => removeMandatoryServiceRow(prev, index));
  };

  const parseMaxWeeks = (maxValue) => {
    if (!maxValue || maxValue === "" || maxValue === "No max") {
      return 999999;
    }

    if (typeof maxValue === "string" && maxValue.endsWith("+")) {
      const numValue = parseInt(maxValue.slice(0, -1));
      if (!isNaN(numValue)) {
        return 100000 + numValue;
      }
      return 999999;
    }

    const numValue = parseInt(maxValue);
    return isNaN(numValue) ? 999999 : numValue;
  };

  const handleSubmit = async () => {
    try {
      if (!formData.schoolId || formData.schoolId.trim() === "") {
        alert(
          "Please select at least one location. The provider is taken from the selected location."
        );
        return;
      }

      const hostContactValidation = validateHostContactFields({
        hostPhone: formData.hostPhone,
        hostWhatsapp: formData.hostWhatsapp,
        hostEmail: formData.hostEmail,
      });
      if (!hostContactValidation.valid) {
        alert(hostContactValidation.message);
        return;
      }

      const processedAmenityIds = [];

      if (Array.isArray(formData.facilities)) {
        formData.facilities.forEach((facility) => {
          if (Array.isArray(facility)) {
            facility.forEach((item) => {
              if (typeof item === "object" && item.amenityId) {
                processedAmenityIds.push(item.amenityId);
              } else if (typeof item === "string") {
                processedAmenityIds.push(item);
              }
            });
          } else if (typeof facility === "object" && facility.amenityId) {
            processedAmenityIds.push(facility.amenityId);
          } else if (typeof facility === "string") {
            processedAmenityIds.push(facility);
          }
        });
      }

      const uniqueAmenityIds = [...new Set(processedAmenityIds)];

      let simplePrices = [];
      let flexiblePrices = [];
      let fixedPrices = [];

      if (priceRange.type === "simple" && priceRange.simple.price > 0) {
        simplePrices = [
          {
            price: parseFloat(priceRange.simple.price),
            period: "week",
          },
        ];
      } else if (priceRange.type === "flexible" && priceRange.flexible.length > 0) {
        flexiblePrices = priceRange.flexible.map((item) => {
          const minWeeks = parseInt(item.min);
          const maxWeeks = parseMaxWeeks(item.max);

          if (isNaN(minWeeks)) {
            throw new Error(`Invalid minimum weeks value: ${item.min}`);
          }

          return {
            minWeeks: minWeeks,
            maxWeeks: maxWeeks,
            pricePerWeek: parseFloat(item.price),
          };
        });
      } else if (priceRange.type === "fixed" && priceRange.fixed.length > 0) {
        fixedPrices = priceRange.fixed.map((item) => ({
          durationWeeks: parseInt(item.duration),
          totalPrice: parseFloat(item.price),
        }));
      }

      const accommodationDataWithSchool = {
        name: formData.name,
        category: formData.category,
        type: ROOM_TYPE_TO_BACKEND_MAP[formData.roomType] || "Private",
        bathroomType: formData.bathroom,
        regimeType: formData.regime,
        schoolId: formData.schoolId || "",
        cityId: formData.cityId,
        currency: formData.currency,
        address: formData.address || "",
        minAge: parseInt(formData.ageLimitMin) || 18,
        maxAge: parseInt(formData.ageLimitMax) || 65,
        description: formData.description,
        url: formData.youtubeUrl,
        images: formData.images,
        amenityIds: uniqueAmenityIds,
        isActive: formData.isActive !== undefined ? formData.isActive : true,
        accommodationInstructions: formData.accommodationInstructions,
        accommodationInstructionsNote: formData.accommodationInstructionsNote,
        accommodationContactType: formData.accommodationContactType,
        accommodationContactName: formData.accommodationContactName,
        hostPhone: formData.hostPhone,
        hostWhatsapp: formData.hostWhatsapp,
        hostEmail: formData.hostEmail,
        houseRules: formData.houseRules,
      };

      if (priceRange.type === "simple" && simplePrices.length > 0) {
        accommodationDataWithSchool.simplePrices = simplePrices;
      } else if (priceRange.type === "flexible" && flexiblePrices.length > 0) {
        accommodationDataWithSchool.flexiblePrices = flexiblePrices;
      } else if (priceRange.type === "fixed" && fixedPrices.length > 0) {
        accommodationDataWithSchool.fixedPrices = fixedPrices;
      }

      // TODO: Remove this comment when backend supports highSeasonFees
      // Temporarily disabled - backend doesn't support highSeasonFees yet
      // if (priceRange.highSeasonFees && priceRange.highSeasonFees.length > 0) {
      //   const validHighSeasonFees = priceRange.highSeasonFees
      //     .filter((fee) => fee.startDate && fee.endDate && fee.pricePerWeek)
      //     .map((fee) => {
      //       let startDate = fee.startDate;
      //       let endDate = fee.endDate;

      //       if (Array.isArray(startDate) && startDate.length > 0) {
      //         startDate = startDate[0];
      //       }
      //       if (Array.isArray(endDate) && endDate.length > 0) {
      //         endDate = endDate[0];
      //       }

      //       if (startDate instanceof Date) {
      //         startDate = startDate.toISOString().split("T")[0];
      //       }
      //       if (endDate instanceof Date) {
      //         endDate = endDate.toISOString().split("T")[0];
      //       }

      //       return {
      //         startDate: startDate,
      //         endDate: endDate,
      //         pricePerWeek: parseFloat(fee.pricePerWeek) || 0,
      //       };
      //     });

      //   if (validHighSeasonFees.length > 0) {
      //     accommodationDataWithSchool.highSeasonFees = validHighSeasonFees;
      //   }
      // }

      accommodationDataWithSchool.campusIds = campusId ? [campusId] : formData.campusIds || [];

      if (fullPaymentDiscount && fullPaymentDiscount.status === "active") {
        const valueValidation = validateDiscountValueForSave(fullPaymentDiscount.value);
        if (!valueValidation.valid) {
          alert(valueValidation.message);
          return;
        }
        if (fullPaymentDiscount.type === "percent") {
          const percentValidation = validateDiscountPercentMax(fullPaymentDiscount.value);
          if (!percentValidation.valid) {
            alert(percentValidation.message);
            return;
          }
        }
        accommodationDataWithSchool.fullPaymentDiscount = {
          status: "active",
          applyToBasePrice: fullPaymentDiscount.applyToBasePrice,
          type: fullPaymentDiscount.type,
          value: getDiscountValueForApi(fullPaymentDiscount.value),
        };
      } else {
        accommodationDataWithSchool.fullPaymentDiscount = null;
      }

      const mandatoryValidation = validateMandatoryServicesForSave(
        priceRange.mandatoryServices || []
      );
      if (!mandatoryValidation.valid) {
        alert(mandatoryValidation.message);
        return;
      }

      const persistMandatoryServices = async (accommodationId) => {
        const rows = priceRange.mandatoryServices || [];
        const items = toApiAccommodationServices(rows);

        if (mode === "edit") {
          const previousIds = previousMandatoryServiceIdsRef.current || [];
          const currentIds = new Set(items.filter((i) => i.id).map((i) => i.id));
          const idsToDelete = previousIds.filter((id) => !currentIds.has(id));
          const toCreate = items.filter((i) => !i.id);
          const toUpdate = items.filter((i) => i.id);

          if (idsToDelete.length > 0) {
            await AccommodationServicesService.deleteServices(accommodationId, idsToDelete);
          }
          if (toCreate.length > 0) {
            await AccommodationServicesService.createServices(accommodationId, { items: toCreate });
          }
          if (toUpdate.length > 0) {
            await AccommodationServicesService.updateServices(accommodationId, { items: toUpdate });
          }
        } else {
          const toCreate = toApiAccommodationServicesForCreate(rows);
          if (toCreate.length > 0) {
            await AccommodationServicesService.createServices(accommodationId, { items: toCreate });
          }
        }
      };

      let result;
      if (mode === "edit") {
        result = await AccommodationService.updateAccommodation(
          accommodationData.id,
          accommodationDataWithSchool
        );

        if (result.id) {
          try {
            const validFees = (priceRange.highSeasonFees || []).filter(
              (fee) => fee.startDate && fee.endDate
            );

            const existingFees = validFees.filter((fee) => fee.id);
            const newFees = validFees.filter((fee) => !fee.id);

            if (existingFees.length > 0) {
              const feesToUpdate = existingFees.map((fee) => {
                const startDateObj =
                  fee.startDate instanceof Date ? fee.startDate : new Date(fee.startDate);
                const endDateObj =
                  fee.endDate instanceof Date ? fee.endDate : new Date(fee.endDate);

                if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
                  throw new Error("Invalid date format");
                }

                return {
                  id: fee.id,
                  startDate: startDateObj.toISOString(),
                  endDate: endDateObj.toISOString(),
                  supplementPerWeek: parseFloat(fee.pricePerWeek) || 0,
                  active: fee.active !== false,
                };
              });

              await AccommodationFeeService.updateAccommodationFees(result.id, feesToUpdate);
            }

            if (newFees.length > 0) {
              const feesToCreate = newFees.map((fee) => {
                const startDateObj =
                  fee.startDate instanceof Date ? fee.startDate : new Date(fee.startDate);
                const endDateObj =
                  fee.endDate instanceof Date ? fee.endDate : new Date(fee.endDate);

                if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
                  throw new Error("Invalid date format");
                }

                return {
                  startDate: startDateObj.toISOString(),
                  endDate: endDateObj.toISOString(),
                  supplementPerWeek: parseFloat(fee.pricePerWeek) || 0,
                  active: fee.active !== false,
                };
              });

              await AccommodationFeeService.createAccommodationFees(result.id, feesToCreate);
            }

            if (validFees.length === 0) {
              await AccommodationFeeService.deleteAccommodationFees(result.id);
            }
          } catch (feeError) {
            console.error("Failed to update fees:", feeError);
          }
        }
      } else {
        result = await AccommodationService.createAccommodation(accommodationDataWithSchool);

        if (result.id && priceRange.highSeasonFees && priceRange.highSeasonFees.length > 0) {
          try {
            const feesToCreate = priceRange.highSeasonFees
              .filter((fee) => fee.startDate && fee.endDate)
              .map((fee) => {
                const startDateObj =
                  fee.startDate instanceof Date ? fee.startDate : new Date(fee.startDate);
                const endDateObj =
                  fee.endDate instanceof Date ? fee.endDate : new Date(fee.endDate);

                if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
                  throw new Error("Invalid date format");
                }

                return {
                  startDate: startDateObj.toISOString(),
                  endDate: endDateObj.toISOString(),
                  supplementPerWeek: parseFloat(fee.pricePerWeek) || 0,
                  active: fee.active !== false,
                };
              });

            if (feesToCreate.length > 0) {
              await AccommodationFeeService.createAccommodationFees(result.id, feesToCreate);
            }
          } catch (feeError) {
            console.error("Failed to create fees:", feeError);
          }
        }
      }

      if (result?.id) {
        try {
          await persistMandatoryServices(result.id);
        } catch (msError) {
          console.error("Failed to save mandatory services:", msError);
          if (msError?.stack) {
            console.error(msError.stack);
          }
          alert(
            `Accommodation saved, but mandatory services could not be saved: ${msError.message}`
          );
        }
      }

      if (result.id && onSuccess) {
        onSuccess(result);
      }

      onClose();
    } catch (error) {
      console.error("Failed to save accommodation:", error);
      alert(`Failed to save accommodation: ${error.message}`);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "view":
        return "View Accommodation";
      case "edit":
        return "Edit Accommodation";
      default:
        return "Add New Accommodation";
    }
  };

  const getSubmitButtonText = () => {
    switch (mode) {
      case "edit":
        return "Save Accommodation";
      default:
        return "Create Accommodation";
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
          <AccommodationLoadingOverlay isVisible={isInitializing} />
          <BasicInformation
            formData={formData}
            onInputChange={handleInputChange}
            disabled={isViewMode}
            schoolId={schoolId}
            setLoading={setLoading}
            isLoading={isLoading}
          />

          <Divider sx={{ my: 3 }} />

          <DescriptionSection
            description={formData.description}
            onDescriptionChange={(value) => handleInputChange("description", value)}
            disabled={isViewMode}
          />

          <Divider sx={{ my: 3 }} />

          <HostInstructionsSection
            accommodationInstructions={formData.accommodationInstructions}
            accommodationInstructionsNote={formData.accommodationInstructionsNote}
            accommodationContactType={formData.accommodationContactType}
            accommodationContactName={formData.accommodationContactName}
            hostPhone={formData.hostPhone}
            hostWhatsapp={formData.hostWhatsapp}
            hostEmail={formData.hostEmail}
            houseRules={formData.houseRules}
            onFieldChange={handleInputChange}
            disabled={isViewMode}
          />

          <Divider sx={{ my: 3 }} />

          <FacilitiesSection
            facilities={formData.facilities}
            onFacilityChange={handleFacilitiesChange}
            disabled={isViewMode}
          />

          <Divider sx={{ my: 3 }} />

          <PriceRangeSection
            priceRange={priceRange}
            setPriceRange={setPriceRange}
            currency={formData.currency}
            disabled={isViewMode}
          />

          <MandatoryServicesSection
            rows={priceRange.mandatoryServices || []}
            currency={formData.currency}
            onChange={handleMandatoryChange}
            onAdd={handleMandatoryAdd}
            onRemove={handleMandatoryRemove}
            disabled={isViewMode}
          />

          <Divider sx={{ my: 3 }} />

          <SoftBox
            p={2}
            sx={{
              border: "1px solid",
              borderColor: "grey.300",
              borderRadius: 2,
              backgroundColor: "grey.50",
            }}
          >
            <SoftBox
              display="flex"
              alignItems="flex-end"
              justifyContent="space-between"
              mb={fullPaymentDiscount?.status === "active" ? 2 : 0}
            >
              <SoftTypography variant="h6" fontWeight="medium">
                Full Payer Discount
              </SoftTypography>
              <FormControlLabel
                sx={{ alignItems: "center", marginRight: 0 }}
                control={
                  <Switch
                    checked={fullPaymentDiscount?.status === "active" ?? false}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFullPaymentDiscount({
                          status: "active",
                          applyToBasePrice: true,
                          type: "percent",
                          value: "5",
                        });
                      } else {
                        setFullPaymentDiscount(null);
                      }
                    }}
                    color="info"
                    disabled={isViewMode}
                  />
                }
                label={
                  <SoftTypography variant="button" color="text">
                    {fullPaymentDiscount?.status === "active" ? "Enabled" : "Disabled"}
                  </SoftTypography>
                }
              />
            </SoftBox>
            {fullPaymentDiscount?.status === "active" && (
              <SoftBox display="flex" flexDirection="column" gap={2} mt={2}>
                <SoftBox
                  display="flex"
                  gap={2}
                  flexWrap="wrap"
                  width="100%"
                  sx={{ marginBottom: "5px" }}
                >
                  <SoftBox flex="1" minWidth={120} sx={{ minWidth: 0 }}>
                    <SoftTypography
                      component="label"
                      variant="caption"
                      fontWeight="bold"
                      display="block"
                      mb={0.5}
                    >
                      Apply to
                    </SoftTypography>
                    <SoftSelect
                      options={[
                        { value: "base_only", label: "Base price only" },
                        { value: "base_and_fees", label: "Base + fees" },
                      ]}
                      value={
                        fullPaymentDiscount.applyToBasePrice
                          ? { value: "base_only", label: "Base price only" }
                          : { value: "base_and_fees", label: "Base + fees" }
                      }
                      onChange={(option) =>
                        setFullPaymentDiscount((prev) => ({
                          ...prev,
                          applyToBasePrice: option?.value === "base_only",
                        }))
                      }
                      isDisabled={isViewMode}
                      size="small"
                      placeholder="Select..."
                    />
                  </SoftBox>
                  <SoftBox flex="1" minWidth={120} sx={{ minWidth: 0 }}>
                    <SoftTypography
                      component="label"
                      variant="caption"
                      fontWeight="bold"
                      display="block"
                      mb={0.5}
                    >
                      Discount type
                    </SoftTypography>
                    <SoftSelect
                      options={[
                        { value: "percent", label: "Percentage (%)" },
                        { value: "fixed", label: "Fixed amount" },
                      ]}
                      value={
                        fullPaymentDiscount.type === "fixed"
                          ? { value: "fixed", label: "Fixed amount" }
                          : { value: "percent", label: "Percentage (%)" }
                      }
                      onChange={(option) =>
                        setFullPaymentDiscount((prev) => ({
                          ...prev,
                          type: option?.value || "percent",
                        }))
                      }
                      isDisabled={isViewMode}
                      size="small"
                      placeholder="Select..."
                    />
                  </SoftBox>
                  <SoftBox flex="1" minWidth={120} sx={{ minWidth: 0 }}>
                    <SoftTypography
                      component="label"
                      variant="caption"
                      fontWeight="bold"
                      display="block"
                      mb={0.5}
                    >
                      Value
                    </SoftTypography>
                    <SoftBox display="flex" alignItems="center" gap={0.5} width="100%">
                      {fullPaymentDiscount.type === "fixed" && (
                        <SoftTypography variant="caption" color="text">
                          {getCurrencySymbol(formData.currency) || "€"}
                        </SoftTypography>
                      )}
                      <SoftInput
                        type="text"
                        inputMode="decimal"
                        value={fullPaymentDiscount.value ?? ""}
                        onChange={(e) => {
                          const isPercent = fullPaymentDiscount.type === "percent";
                          const formatted = formatDiscountValueInput(e.target.value, isPercent);
                          setFullPaymentDiscount((prev) => ({
                            ...prev,
                            value: formatted,
                          }));
                        }}
                        disabled={isViewMode}
                        size="small"
                        placeholder={fullPaymentDiscount.type === "percent" ? "e.g. 5" : "0"}
                        sx={{ flex: 1, minWidth: 0 }}
                      />
                      {fullPaymentDiscount.type === "percent" && (
                        <SoftTypography variant="caption" color="text">
                          %
                        </SoftTypography>
                      )}
                    </SoftBox>
                  </SoftBox>
                </SoftBox>
                <SoftTypography variant="caption" color="text">
                  Applies only when payment option = Pay in Full.
                </SoftTypography>
              </SoftBox>
            )}
          </SoftBox>

          <Divider sx={{ my: 3 }} />

          <ImageGallery
            images={formData.images}
            onChange={(images) => handleInputChange("images", images)}
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

AccommodationModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["add", "edit", "view"]),
  accommodationData: PropTypes.object,
  schoolId: PropTypes.string,
  campusId: PropTypes.string,
  onSuccess: PropTypes.func,
};

export default AccommodationModal;
