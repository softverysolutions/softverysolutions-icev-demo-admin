import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  Alert,
  Divider,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "context/AuthContext";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import BasicInformation from "./components/BasicInformation";
import DescriptionSection from "./components/DescriptionSection";

import AwardsSection from "./components/AwardsSection";

import { INITIAL_FORM_DATA } from "./constants";
import { SchoolService } from "services/schoolService";
import { SchoolAwardsService } from "services/schoolAwardsService";
import { formatImageUrl } from "utils/imageUtils";
import { useModalLoadingState } from "hooks/useModalLoadingState";
import SchoolLoadingOverlayNew from "components/SchoolLoadingOverlayNew";

const reverseMapSchoolType = (apiSchoolType) => (apiSchoolType === "sport" ? "sport" : "tech");

function SchoolModal({ open, onClose, mode = "add", schoolData = null, onSuccess }) {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  const {
    isInitializing,
    setInitializing,
    resetLoadingStates,
    setLoading,
    isLoading: isLoadingState,
  } = useModalLoadingState(["countries"]);
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile } = useAuth();

  useEffect(() => {
    if (open) {
      setInitializing(true);

      if (mode === "add") {
        setFormData(INITIAL_FORM_DATA);
      } else if (schoolData) {
        const mappedData = {
          name: schoolData.name || "",
          logo: schoolData.logo ? { preview: schoolData.logo } : "",
          description: schoolData.description || "",
          type: reverseMapSchoolType(schoolData.schoolType) || "",
          countryId: schoolData.countryId || "",
          awards: schoolData.awards || [],
          contactEmail: schoolData.contactEmail || "",
          contactPhone: schoolData.contactPhone || "",
          isActive: schoolData.isActive !== undefined ? schoolData.isActive : true,
        };
        setFormData(mappedData);

        if (schoolData.id && mode !== "add") {
          loadSchoolAwards(schoolData.id);
        }
      }
    } else {
      resetLoadingStates();
    }
  }, [open, mode, schoolData, setInitializing, resetLoadingStates]);

  useEffect(() => {
    if (open && (mode === "add" || schoolData)) {
      if (!isLoadingState("countries") && isInitializing) {
        setInitializing(false);
      }
    }
  }, [open, mode, schoolData, isLoadingState, setInitializing, isInitializing]);

  const loadSchoolAwards = async (schoolId) => {
    try {
      const awards = await SchoolAwardsService.getSchoolAwards(schoolId);
      const mappedAwards = awards.map((award) => ({
        ...award,
        image: {
          preview: award.imageUrl,
        },
        isNew: false,
      }));
      setFormData((prev) => ({ ...prev, awards: mappedAwards }));
    } catch (error) {
      console.error("Failed to load provider awards:", error);
    }
  };

  const handleInputChange = (field, value) => {
    if (mode === "view") return;
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      let result;
      if (mode === "edit") {
        result = await SchoolService.updateSchool(schoolData.id, formData);
      } else {
        result = await SchoolService.createSchool(formData);
      }

      const newAwards = formData.awards.filter((award) => award.isNew);
      if (newAwards.length > 0 && result.id) {
        for (const award of newAwards) {
          try {
            const awardData = {
              schoolId: result.id,
              schoolName: formData.name,
              caption: award.caption,
              image: award.image,
            };

            await SchoolAwardsService.createSchoolAward(awardData);
          } catch (error) {
            console.error("Failed to save award:", award.caption, error);
            alert(`Failed to save award "${award.caption}": ${error.message}`);
          }
        }
      }

      const tempSchool = {
        id: result.id || (mode === "edit" ? schoolData.id : `temp-${Date.now()}`),
        name: formData.name,
        logo: formData.logo?.preview || formData.logo || "",
        description: formData.description,
        schoolType: formData.type,
        countryId: formData.countryId,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,
        country: { name: "Unknown" },
        campuses: [],
        currency: "EUR",
      };

      onClose();

      if (onSuccess) {
        if (mode === "edit") {
          onSuccess(tempSchool, mode);
        } else {
          onSuccess(result, "add");
        }
      }
    } catch (error) {
      alert(`Failed to save provider: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "view":
        return "View Provider";
      case "edit":
        return "Edit Provider";
      default:
        return "Add Provider";
    }
  };

  const getSubmitButtonText = () => {
    switch (mode) {
      case "edit":
        return "Save Provider";
      default:
        return "Add Provider";
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
          <SchoolLoadingOverlayNew isVisible={isInitializing} />
          {!userProfile && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              <Typography variant="body2">
                <strong>User profile not loaded.</strong> This might be causing the 403 error.
              </Typography>
              <Box sx={{ mt: 1, display: "flex", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={async () => {
                    try {
                      const { AuthService } = await import("services/authService");
                      await AuthService.getCurrentUserProfile();
                      window.location.reload();
                    } catch (error) {
                      console.error("Failed to sync profile:", error);
                    }
                  }}
                >
                  Sync User Profile
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={async () => {
                    try {
                      const { AuthService } = await import("services/authService");
                      const isAPIHealthy = await AuthService.testAPI();
                      alert(`API Health Check: ${isAPIHealthy ? "OK" : "FAILED"}`);
                    } catch (error) {
                      alert("API Health Check: FAILED");
                    }
                  }}
                >
                  Test API
                </Button>
              </Box>
            </Alert>
          )}

          <BasicInformation
            formData={formData}
            onInputChange={handleInputChange}
            disabled={isViewMode}
            setLoading={setLoading}
            isLoading={isLoadingState}
          />

          <Divider sx={{ my: 3 }} />

          <DescriptionSection
            description={formData.description}
            onDescriptionChange={(value) => handleInputChange("description", value)}
            disabled={isViewMode}
          />

          <Divider sx={{ my: 3 }} />

          <Divider sx={{ my: 3 }} />

          <AwardsSection
            awards={formData.awards}
            onAwardsChange={(awards) => handleInputChange("awards", awards)}
            disabled={isViewMode}
            schoolId={schoolData?.id}
            schoolName={formData.name}
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
            {isLoading ? "Saving..." : getSubmitButtonText()}
          </SoftButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

SchoolModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["add", "edit", "view"]),
  schoolData: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default SchoolModal;
