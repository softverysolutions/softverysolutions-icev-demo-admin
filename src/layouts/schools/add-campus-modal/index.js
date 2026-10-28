import { useState, useEffect } from "react";
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
import FacilitiesSection from "./components/FacilitiesSection";
import NationalityMixSection from "./components/NationalityMixSection";
import GallerySection from "./components/GallerySection";
import DescriptionSection from "./components/DescriptionSection";
import FirstDaysInstructionsSection from "./components/FirstDaysInstructionsSection";

import { INITIAL_CAMPUS_DATA, NATIONALITY_GROUPS } from "./constants";
import { CampusService } from "services/campusService";
import { useModalLoadingState } from "hooks/useModalLoadingState";
import CampusLoadingOverlay from "components/CampusLoadingOverlay";

function CampusModal({ open, onClose, mode = "add", campusData = null, onSuccess, schoolId }) {
  const [formData, setFormData] = useState(INITIAL_CAMPUS_DATA);
  const [isLoading, setIsLoading] = useState(false);

  const {
    isInitializing,
    setInitializing,
    resetLoadingStates,
    setLoading,
    isLoading: isLoadingState,
  } = useModalLoadingState(["countries", "cities"]);

  useEffect(() => {
    if (open) {
      setInitializing(true);

      if (mode === "add") {
        setFormData({
          ...INITIAL_CAMPUS_DATA,
          schoolId: schoolId || "",
        });
      } else if (campusData) {
        const convertedNationalities = campusData.nationalities
          ? campusData.nationalities.map((nationality, index) => ({
              id: Date.now() + index,
              group: nationality.name.toLowerCase().replace(/\s+/g, "_"),
              groupLabel: nationality.name,
              percentage: nationality.percent,
            }))
          : [];

        const convertedImages = campusData.images
          ? campusData.images.map((image, index) => {
              if (image.imageUrl && image.imageUrl.startsWith("blob:")) {
                return {
                  id: `existing-${index}`,
                  preview: image.imageUrl,
                  imageUrl: image.imageUrl,
                  isBlobUrl: true,
                };
              }

              return {
                id: `existing-${index}`,
                preview: image.imageUrl,
                imageUrl: image.imageUrl,
              };
            })
          : [];

        let processedAmenities = campusData.amenities || campusData.facilities || [];

        setFormData({
          name: campusData.name || "",
          schoolId: campusData.schoolId || "",
          cityId: campusData.cityId || "",
          countryId: campusData.countryId || "",
          currency: campusData.currency || "EUR",
          address: campusData.address || "",
          avgStudentsPerClass: campusData.avgStudentsPerClass || "",
          numberOfStudents: campusData.numberOfStudents ?? "",
          averageRating: campusData.averageRating || "",
          website: campusData.website || "",
          videoUrl: campusData.videoUrl || "",
          lat: campusData.lat || "",
          lon: campusData.lon || "",
          highlights: campusData.highlights || [],
          images: convertedImages,
          nationalities: convertedNationalities,
          amenities: processedAmenities,
          description: campusData.description || "",
          isActive: campusData.isActive !== undefined ? campusData.isActive : true,
          firstDaysInstructions: {
            arriveByTime: campusData.arriveByTime || "",
            arriveByText: campusData.arriveByText || "",
            whatToBring: campusData.whatToBring || "",
          },
        });
      }
    } else {
      resetLoadingStates();
    }
  }, [open, mode, campusData, schoolId, setInitializing, resetLoadingStates]);

  useEffect(() => {
    if (open && (mode === "add" || campusData)) {
      if (!isLoadingState("countries") && !isLoadingState("cities") && isInitializing) {
        setInitializing(false);
      }
    }
  }, [open, mode, campusData, isLoadingState, setInitializing, isInitializing]);

  const handleInputChange = (field, value) => {
    if (mode === "view") return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFirstDaysFieldChange = (field, value) => {
    if (mode === "view") return;
    setFormData((prev) => ({
      ...prev,
      firstDaysInstructions: {
        ...prev.firstDaysInstructions,
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      const submitData = {
        ...formData,
        nationalities: formData.nationalities.map((item) => ({
          name: item.groupLabel,
          percent: item.percentage,
        })),
        amenities: formData.amenities,
        images: formData.images.map((image) => {
          if (image.file) {
            return image;
          }
          return {
            imageUrl: image.imageUrl || image.preview,
          };
        }),
      };

      let result;
      if (mode === "edit") {
        result = await CampusService.updateCampus(campusData.id, submitData);
      } else {
        result = await CampusService.createCampus(submitData);
      }

      if (result.id) {
        if (onSuccess) {
          onSuccess();
        }
      }

      onClose();
    } catch (error) {
      alert(`Failed to save location: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "view":
        return "View Location";
      case "edit":
        return "Edit Location";
      default:
        return "Add Location";
    }
  };

  const getSubmitButtonText = () => {
    switch (mode) {
      case "edit":
        return "Save Location";
      default:
        return "Add Location";
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
          <CampusLoadingOverlay isVisible={isInitializing} />

          {isLoading && (
            <SoftBox mb={3}>
              <SoftTypography variant="body2" color="info" textAlign="center">
                {formData.images?.length > 1
                  ? `Processing ${formData.images.length} images... This may take a moment.`
                  : "Processing location data..."}
              </SoftTypography>
            </SoftBox>
          )}

          <BasicInformation
            formData={formData}
            onInputChange={handleInputChange}
            disabled={isViewMode || isLoading}
            setLoading={setLoading}
            isLoading={isLoadingState}
          />

          <Divider sx={{ my: 3 }} />

          <DescriptionSection
            description={formData.description}
            onDescriptionChange={(description) => handleInputChange("description", description)}
            disabled={isViewMode || isLoading}
          />

          <Divider sx={{ my: 3 }} />

          <FirstDaysInstructionsSection
            arriveByTime={formData.firstDaysInstructions?.arriveByTime}
            arriveByText={formData.firstDaysInstructions?.arriveByText}
            whatToBring={formData.firstDaysInstructions?.whatToBring}
            onFieldChange={handleFirstDaysFieldChange}
            disabled={isViewMode || isLoading}
          />

          <Divider sx={{ my: 3 }} />

          <FacilitiesSection
            facilities={formData.amenities}
            onFacilitiesChange={(amenities) => handleInputChange("amenities", amenities)}
            disabled={isViewMode || isLoading}
            modalOpen={open}
          />

          <Divider sx={{ my: 3 }} />

          <NationalityMixSection
            nationalityMix={formData.nationalities}
            onNationalityMixChange={(nationalities) =>
              handleInputChange("nationalities", nationalities)
            }
            disabled={isViewMode || isLoading}
          />

          <Divider sx={{ my: 3 }} />

          <GallerySection
            gallery={formData.images}
            onGalleryChange={(images) => handleInputChange("images", images)}
            disabled={isViewMode || isLoading}
          />
        </SoftBox>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <SoftButton color="light" onClick={onClose} disabled={isLoading || isInitializing}>
          {isViewMode ? "Close" : "Cancel"}
        </SoftButton>
        {!isViewMode && (
          <SoftButton
            variant="gradient"
            color="info"
            onClick={handleSubmit}
            disabled={isLoading || isInitializing}
          >
            {isLoading ? "Processing..." : getSubmitButtonText()}
          </SoftButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

CampusModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["add", "edit", "view"]),
  campusData: PropTypes.object,
  onSuccess: PropTypes.func,
  schoolId: PropTypes.string,
};

export default CampusModal;
