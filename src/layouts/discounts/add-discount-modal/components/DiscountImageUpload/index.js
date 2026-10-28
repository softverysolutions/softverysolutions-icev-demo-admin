import { useState, useCallback } from "react";
import PropTypes from "prop-types";
import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftDropzone from "components/SoftDropzone";
import SoftButton from "components/SoftButton";

import { DiscountService } from "services/discountService";
import { formatImageUrl } from "utils/imageUtils";

function DiscountImageUpload({
  image,
  onImageChange,
  disabled = false,
  discountId = null,
  mode = "add",
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const handleFileUpload = useCallback(
    async (acceptedFiles) => {
      if (disabled || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setIsUploading(true);
      setUploadError(null);

      try {
        if (mode === "add") {
          const imageData = {
            file,
            preview: URL.createObjectURL(file),
            isNew: true,
          };
          onImageChange(imageData);
        } else if (mode === "edit" && discountId) {
          const uploadUrlData = await DiscountService.getImageUploadUrl(discountId, file.type);

          const uploadResponse = await fetch(uploadUrlData.url, {
            method: "PUT",
            body: file,
            headers: {
              "Content-Type": file.type,
            },
          });

          if (!uploadResponse.ok) {
            throw new Error("Failed to upload image to S3");
          }

          const imageUrl = uploadUrlData.publicUrl || uploadUrlData.url;
          const imageData = {
            imageUrl,
            preview: URL.createObjectURL(file),
            isNew: false,
          };
          onImageChange(imageData);
        }
      } catch (error) {
        console.error("Error uploading image:", error);
        setUploadError(error.message);
      } finally {
        setIsUploading(false);
      }
    },
    [disabled, mode, discountId, onImageChange]
  );

  const handleRemoveImage = () => {
    if (disabled) return;
    onImageChange(null);
  };

  const dropzoneOptions = useCallback(
    () => ({
      addRemoveLinks: true,
      maxFiles: 1,
      maxFilesize: 5,
      acceptedFiles: "image/*",
      accept: (file, done) => {
        if (disabled) {
          done("Editing is disabled");
          return;
        }
        if (image) {
          done("Only one image allowed. Remove current image first.");
          return;
        }
        done();
      },
      addedfile: (file) => {
        handleFileUpload([file]);
      },
      maxfilesexceeded: (file) => {
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      },
    }),
    [disabled, image, handleFileUpload]
  );

  const getImageSrc = () => {
    if (image?.preview) {
      return image.preview;
    }
    if (image?.imageUrl) {
      return formatImageUrl(image.imageUrl);
    }
    return null;
  };

  return (
    <SoftBox>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Discount Image
      </SoftTypography>
      <SoftTypography variant="body2" color="text" mb={2}>
        Upload one image for this discount (Max 5MB, JPG/PNG)
      </SoftTypography>

      {uploadError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {uploadError}
        </Alert>
      )}

      {showWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Only one image is allowed per discount
        </Alert>
      )}

      {image && (
        <SoftBox mb={2}>
          <Card sx={{ maxWidth: 300, position: "relative" }}>
            <CardMedia
              component="img"
              height="200"
              image={getImageSrc()}
              alt="Discount preview"
              sx={{ objectFit: "cover" }}
            />
            {!disabled && (
              <IconButton
                onClick={handleRemoveImage}
                sx={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  backgroundColor: "rgba(0,0,0,0.5)",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "rgba(0,0,0,0.7)",
                  },
                }}
                size="small"
              >
                <Icon fontSize="small">delete</Icon>
              </IconButton>
            )}
          </Card>
        </SoftBox>
      )}

      {!disabled && !image && (
        <SoftBox>
          <SoftDropzone options={dropzoneOptions()} />
          {isUploading && (
            <SoftBox mt={2} textAlign="center">
              <SoftTypography variant="body2" color="text">
                Uploading image...
              </SoftTypography>
            </SoftBox>
          )}
        </SoftBox>
      )}

      {image && !disabled && (
        <SoftBox mt={2}>
          <SoftButton
            variant="outlined"
            color="error"
            size="small"
            onClick={handleRemoveImage}
            startIcon={<Icon>delete</Icon>}
          >
            Remove Image
          </SoftButton>
        </SoftBox>
      )}
    </SoftBox>
  );
}

DiscountImageUpload.propTypes = {
  image: PropTypes.object,
  onImageChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  discountId: PropTypes.string,
  mode: PropTypes.oneOf(["add", "edit"]),
};

export default DiscountImageUpload;
