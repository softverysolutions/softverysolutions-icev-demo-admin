import { useCallback, useState, useRef, useEffect } from "react";
import PropTypes from "prop-types";
import Alert from "@mui/material/Alert";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftDropzone from "components/SoftDropzone";
import SoftButton from "components/SoftButton";
import { formatImageUrl } from "utils/imageUtils";

function GallerySection({ gallery, onGalleryChange, disabled = false }) {
  const [showWarning, setShowWarning] = useState(false);
  const galleryRef = useRef(gallery);
  const pendingFilesRef = useRef([]);
  const processingTimeoutRef = useRef(null);

  useEffect(() => {
    galleryRef.current = gallery;
  }, [gallery]);

  useEffect(() => {
    return () => {
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }
    };
  }, []);

  const handleImageUpload = useCallback(
    (acceptedFiles) => {
      if (disabled) return;

      pendingFilesRef.current.push(...acceptedFiles);

      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current);
      }

      processingTimeoutRef.current = setTimeout(() => {
        const filesToProcess = pendingFilesRef.current;
        pendingFilesRef.current = [];

        const currentCount = galleryRef.current.length;

        if (currentCount >= 8) {
          console.log("Maximum 8 images already reached");
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
          preview: URL.createObjectURL(file),
        }));

        const updatedGallery = [...galleryRef.current, ...newImages];
        onGalleryChange(updatedGallery);
      }, 10);
    },
    [disabled, onGalleryChange]
  );

  const handleRemoveImage = (imageId) => {
    if (disabled) return;
    const updatedGallery = gallery.filter((img) => img.id !== imageId);
    onGalleryChange(updatedGallery);
  };

  const galleryDropzoneOptions = useCallback(
    () => ({
      addRemoveLinks: true,
      maxFiles: 8 - gallery.length,
      maxFilesize: 5, // 5MB
      acceptedFiles: "image/*",
      accept: (file, done) => {
        if (disabled) {
          done("Editing is disabled");
          return;
        }
        if (gallery.length >= 8) {
          console.log("Rejecting file - max limit reached");
          done("Maximum 8 images allowed");
          return;
        }
        done();
      },
      addedfile: (file) => {
        handleImageUpload([file]);
      },
      maxfilesexceeded: (file) => {
        console.log("Max files exceeded:", file.name);
        setShowWarning(true);
        setTimeout(() => setShowWarning(false), 3000);
      },
    }),
    [disabled, gallery.length, handleImageUpload]
  );

  const getImageSrc = (image) => {
    if (image.preview) {
      return image.preview;
    }
    if (image.imageUrl) {
      const formattedUrl = formatImageUrl(image.imageUrl);
      return formattedUrl;
    }
    return null;
  };

  return (
    <>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Location Gallery
      </SoftTypography>
      <SoftTypography variant="body2" color="text" mb={3}>
        Upload up to 8 photos of your campus ({gallery.length}/8)
      </SoftTypography>

      {showWarning && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Only 8 images are allowed. Some images were not added.
        </Alert>
      )}

      {gallery.length > 0 && (
        <SoftBox mb={3}>
          <Grid container spacing={2}>
            {gallery.map((image) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={image.id}>
                <SoftBox position="relative" borderRadius="lg" overflow="hidden" boxShadow="md">
                  <img
                    src={getImageSrc(image)}
                    alt="Location"
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                  <SoftBox
                    display="none"
                    alignItems="center"
                    justifyContent="center"
                    borderRadius="lg"
                    bgColor="grey-100"
                    width="100%"
                    height="150px"
                  >
                    <Icon sx={{ color: "text.secondary" }} fontSize="large">
                      image
                    </Icon>
                  </SoftBox>
                  {!disabled && (
                    <IconButton
                      size="small"
                      color="error"
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        bgcolor: "rgba(255, 255, 255, 0.8)",
                      }}
                      onClick={() => handleRemoveImage(image.id)}
                    >
                      <Icon>delete</Icon>
                    </IconButton>
                  )}
                </SoftBox>
              </Grid>
            ))}
          </Grid>
        </SoftBox>
      )}

      {gallery.length < 8 && (
        <SoftBox sx={{ height: "200px" }}>
          <SoftDropzone options={galleryDropzoneOptions()} disabled={disabled} />
        </SoftBox>
      )}
    </>
  );
}

GallerySection.propTypes = {
  gallery: PropTypes.array.isRequired,
  onGalleryChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default GallerySection;
