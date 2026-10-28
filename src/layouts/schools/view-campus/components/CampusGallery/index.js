import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftAvatar from "components/SoftAvatar";

function CampusGallery({ images = [] }) {
  if (!images || images.length === 0) {
    return (
      <SoftBox mb={3}>
        <SoftTypography variant="h6" fontWeight="medium" mb={2}>
          Gallery
        </SoftTypography>
        <SoftTypography variant="body2" color="text.secondary">
          No images available for this location.
        </SoftTypography>
      </SoftBox>
    );
  }

  return (
    <SoftBox mb={3}>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Gallery
      </SoftTypography>
      <Grid container spacing={2}>
        {images.map((image, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <SoftAvatar
              src={image.imageUrl}
              alt={`Campus image ${index + 1}`}
              variant="rounded"
              size="xl"
              sx={{ width: "100%", height: "200px" }}
            />
          </Grid>
        ))}
      </Grid>
    </SoftBox>
  );
}

CampusGallery.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      imageUrl: PropTypes.string.isRequired,
    })
  ),
};

export default CampusGallery;
