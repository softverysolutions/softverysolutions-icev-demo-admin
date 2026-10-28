import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import Icon from "@mui/material/Icon";

function CampusWebsite({ websiteUrl }) {
  const handleWebsiteClick = () => {
    if (websiteUrl) {
      window.open(websiteUrl, "_blank");
    }
  };

  if (!websiteUrl) {
    return (
      <SoftBox mb={3}>
        <SoftTypography variant="h6" fontWeight="medium" mb={2}>
          Website
        </SoftTypography>
        <SoftTypography variant="body2" color="text.secondary">
          No website available for this location.
        </SoftTypography>
      </SoftBox>
    );
  }

  return (
    <SoftBox mb={3}>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Website
      </SoftTypography>
      <SoftButton
        variant="gradient"
        color="success"
        size="medium"
        startIcon={<Icon sx={{ color: "white" }}>language</Icon>}
        onClick={handleWebsiteClick}
        sx={{
          borderRadius: "8px",
          textTransform: "uppercase",
          fontWeight: "bold",
        }}
      >
        Visit Website
      </SoftButton>
    </SoftBox>
  );
}

CampusWebsite.propTypes = {
  websiteUrl: PropTypes.string,
};

export default CampusWebsite;
