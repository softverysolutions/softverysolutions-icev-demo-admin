import { useState, useCallback, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Alert from "@mui/material/Alert";

import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftDropzone from "components/SoftDropzone";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

function ImageGallery({ images, onChange, disabled = false }) {
  const [imageFiles, setImageFiles] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
  const imageFilesRef = useRef([]);
  const pendingFilesRef = useRef([]);
  const processingTimeoutRef = useRef(null);

  useEffect(() => {
    if (images && images.length > 0) {
      setImageFiles(images);
      imageFilesRef.current = images;
    } else {
      setImageFiles([]);
      imageFilesRef.current = [];
    }
  }, [images]);

  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  const handleFileUpload = useCallback(
    (acceptedFiles) => {
      if (disabled) return;

      pendingFilesRef.current.push(...acceptedFiles);

      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }

      processingTimeoutRef.current = setTimeout(() => {
        const filesToProcess = pendingFilesRef.current;
        pendingFilesRef.current = [];

        const currentCount = imageFilesRef.current.length;

        if (currentCount >= 8) {
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 3000);
          return;
        }

        const remainingSlots = 8 - currentCount;
        const filesToAdd = filesToProcess.slice(0, remainingSlots);

        if (filesToAdd.length < filesToProcess.length) {
          setShowWarning(true);
          setTimeout(() => setShowWarning(false), 3000);
        }

        const newImages = filesToAdd.map((file) => ({
          id: Date.now() + Math.random(),
          file,
          caption: "",
          preview: URL.createObjectURL(file),
        }));

        const updatedImages = [...imageFilesRef.current, ...newImages];
        imageFilesRef.current = updatedImages;
        setImageFiles(updatedImages);
        onChange(updatedImages);
      }, 10);
    },
    [disabled, onChange]
  );

  const handleCaptionChange = (index, caption) => {
    if (disabled) return;

    const updatedImages = imageFiles.map((img, i) => (i === index ? { ...img, caption } : img));
    setImageFiles(updatedImages);
    onChange(updatedImages);
  };

  const handleRemoveImage = (index) => {
    if (disabled) return;

    const updatedImages = imageFiles.filter((_, i) => i !== index);
    setImageFiles(updatedImages);
    onChange(updatedImages);
  };

  const dropzoneOptions = useCallback(
    () => ({
      addRemoveLinks: true,
      maxFiles: 8 - imageFiles.length,
      maxFilesize: 10,
      acceptedFiles: "image/*",
      accept: (file, done) => {
        if (disabled) {
          done("Editing is disabled");
          return;
        }
        if (imageFiles.length >= 8) {
          done("Maximum 8 images allowed");
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
    [disabled, imageFiles.length, handleFileUpload]
  );

  return (
    <SoftBox>
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <SoftTypography variant="h6" fontWeight="medium">
          Photos
        </SoftTypography>
      </SoftBox>

      {imageFiles.length > 0 && (
        <Grid container spacing={2} mb={3}>
          {imageFiles.map((image, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image={image.preview}
                  alt={`Image ${index + 1}`}
                  sx={{ borderRadius: "8px 8px 0 0" }}
                />
                <SoftBox p={2}>
                  <SoftInput
                    placeholder="Enter a caption"
                    value={image.caption}
                    onChange={(e) => handleCaptionChange(index, e.target.value)}
                    fullWidth
                    disabled={disabled}
                  />
                  {!disabled && (
                    <SoftBox display="flex" justifyContent="flex-end" mt={1}>
                      <IconButton size="small">
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveImage(index)}
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </SoftBox>
                  )}
                </SoftBox>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {showWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Only 8 images are allowed. Some images were not added.
        </Alert>
      )}

      {!disabled && imageFiles.length < 8 && (
        <SoftBox>
          <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
            Upload Images (Max 8 photos, 10MB each)
          </SoftTypography>
          <SoftDropzone options={dropzoneOptions()} />
        </SoftBox>
      )}

      {imageFiles.length >= 8 && (
        <SoftBox>
          <SoftTypography variant="body2" color="text">
            Maximum 8 images reached
          </SoftTypography>
        </SoftBox>
      )}
    </SoftBox>
  );
}

ImageGallery.propTypes = {
  images: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default ImageGallery;
