import { useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import SoftDropzone from "components/SoftDropzone";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

import { SchoolAwardsService } from "services/schoolAwardsService";
import { formatImageUrl } from "utils/imageUtils";

function AwardsSection({ awards, onAwardsChange, disabled = false, schoolId, schoolName }) {
  const [newAward, setNewAward] = useState({ caption: "", image: null });
  const [isLoading, setIsLoading] = useState(false);

  const handleAwardImageUpload = useCallback(
    (acceptedFiles) => {
      if (disabled || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      const preview = URL.createObjectURL(file);
      setNewAward((prev) => ({ ...prev, image: { file, preview } }));
    },
    [disabled]
  );

  const handleAddAward = async () => {
    if (!newAward.caption.trim()) {
      alert("Award caption is required.");
      return;
    }

    if (!newAward.image) {
      alert("Award image is required.");
      return;
    }

    if (disabled) {
      alert("Editing is disabled.");
      return;
    }

    const tempAward = {
      id: `temp-${Date.now()}`,
      caption: newAward.caption,
      image: newAward.image,
      isNew: true,
    };

    const updatedAwards = [...awards, tempAward];
    onAwardsChange(updatedAwards);
    setNewAward({ caption: "", image: null });
  };

  const handleRemoveAward = async (awardId) => {
    if (disabled) return;

    const awardToRemove = awards.find((award) => award.id === awardId);

    if (awardToRemove?.isNew) {
      const updatedAwards = awards.filter((award) => award.id !== awardId);
      onAwardsChange(updatedAwards);
      return;
    }

    setIsLoading(true);
    try {
      await SchoolAwardsService.deleteSchoolAward(awardId);
      const updatedAwards = awards.filter((award) => award.id !== awardId);
      onAwardsChange(updatedAwards);
    } catch (error) {
      console.error("Failed to delete award:", error);
      alert(`Failed to delete award: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAwardChange = async (awardId, field, value) => {
    const awardToUpdate = awards.find((award) => award.id === awardId);
    if (!awardToUpdate) return;

    if (awardToUpdate.isNew) {
      const updatedAwardData = {
        ...awardToUpdate,
        [field]: value,
      };
      const updatedAwards = awards.map((award) =>
        award.id === awardId ? updatedAwardData : award
      );
      onAwardsChange(updatedAwards);
      return;
    }

    setIsLoading(true);
    try {
      const updatedAwardData = {
        ...awardToUpdate,
        schoolName: schoolName,
        [field]: value,
      };

      const updatedAward = await SchoolAwardsService.updateSchoolAward(awardId, updatedAwardData);
      const mappedAward = {
        ...updatedAward,
        image: {
          preview: formatImageUrl(updatedAward.imageUrl),
        },
      };
      const updatedAwards = awards.map((award) => (award.id === awardId ? mappedAward : award));
      onAwardsChange(updatedAwards);
    } catch (error) {
      console.error("Failed to update award:", error);
      alert(`Failed to update award: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const awardDropzoneOptions = useCallback(
    () => ({
      addRemoveLinks: true,
      maxFiles: 1,
      maxFilesize: 5, // 5MB
      acceptedFiles: "image/*",
      accept: (file, done) => {
        if (disabled) {
          done("Editing is disabled");
          return;
        }
        done();
      },
      addedfile: (file) => {
        handleAwardImageUpload([file]);
      },
    }),
    [disabled, handleAwardImageUpload]
  );

  return (
    <>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Awards and Accreditations (Optional)
      </SoftTypography>

      {awards.length > 0 && (
        <Grid container spacing={2} mb={3}>
          {awards.map((award) => (
            <Grid item xs={12} md={6} key={award.id}>
              <Card>
                {(() => {
                  const imageUrl = award.imageUrl || award.image?.preview;
                  return (
                    imageUrl && (
                      <CardMedia
                        component="img"
                        height="140"
                        image={imageUrl}
                        alt={`Award ${award.caption}`}
                        sx={{ borderRadius: "8px 8px 0 0" }}
                      />
                    )
                  );
                })()}
                <SoftBox p={2}>
                  <SoftInput
                    placeholder="Award caption"
                    value={award.caption || ""}
                    onChange={(e) => handleAwardChange(award.id, "caption", e.target.value)}
                    disabled={disabled || isLoading}
                    fullWidth
                    multiline
                    rows={3}
                    sx={{ mb: 2 }}
                  />
                  {!disabled && (
                    <SoftBox display="flex" justifyContent="center" mt={1}>
                      <SoftButton
                        color="error"
                        size="small"
                        onClick={() => handleRemoveAward(award.id)}
                        disabled={isLoading}
                        startIcon={<DeleteIcon />}
                      >
                        Remove Award
                      </SoftButton>
                    </SoftBox>
                  )}
                </SoftBox>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {!disabled && (
        <SoftBox>
          <SoftTypography component="label" variant="caption" fontWeight="bold" mb={2}>
            Add New Award
          </SoftTypography>
          <Card>
            <SoftBox p={2}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <SoftInput
                    placeholder="Award caption"
                    value={newAward.caption}
                    onChange={(e) => setNewAward({ ...newAward, caption: e.target.value })}
                    fullWidth
                    multiline
                    rows={3}
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  {newAward.image && newAward.image.preview ? (
                    <SoftBox>
                      <img
                        src={newAward.image.preview}
                        alt="Award preview"
                        style={{
                          maxWidth: "200px",
                          maxHeight: "150px",
                          objectFit: "contain",
                          borderRadius: "8px",
                          marginBottom: "8px",
                        }}
                      />
                      <SoftBox>
                        <SoftButton
                          color="error"
                          size="small"
                          onClick={() => setNewAward({ ...newAward, image: null })}
                        >
                          Remove Image
                        </SoftButton>
                      </SoftBox>
                    </SoftBox>
                  ) : (
                    <SoftDropzone options={awardDropzoneOptions()} />
                  )}
                </Grid>
                <Grid item xs={12}>
                  <SoftButton
                    variant="gradient"
                    color="info"
                    size="small"
                    onClick={handleAddAward}
                    disabled={!newAward.caption.trim() || !newAward.image || isLoading}
                    startIcon={<AddIcon />}
                  >
                    {isLoading ? "Adding..." : "Add Award"}
                  </SoftButton>
                </Grid>
              </Grid>
            </SoftBox>
          </Card>
        </SoftBox>
      )}
    </>
  );
}

AwardsSection.propTypes = {
  awards: PropTypes.array.isRequired,
  onAwardsChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  schoolId: PropTypes.string,
  schoolName: PropTypes.string,
};

export default AwardsSection;
