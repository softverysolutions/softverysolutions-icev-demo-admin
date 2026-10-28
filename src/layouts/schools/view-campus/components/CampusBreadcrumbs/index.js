import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

function CampusBreadcrumbs({ schoolName, campusName, onBackClick }) {
  const truncatedCampusName = campusName && campusName.length > 15 
    ? `${campusName.substring(0, 15)}...` 
    : campusName;

  return (
    <SoftBox display="flex" alignItems="center" mb={3}>
      <SoftButton
        variant="text"
        color="info"
        size="small"
        startIcon={<Icon>arrow_back</Icon>}
        onClick={onBackClick}
        sx={{ mr: 2 }}
      >
        Back to Provider
      </SoftButton>
      <SoftTypography variant="body2" color="text" sx={{ mr: 1 }}>
        {schoolName}
      </SoftTypography>
      <Icon fontSize="small" color="text" sx={{ mr: 1 }}>
        chevron_right
      </Icon>
      <SoftTypography variant="body2" color="info" fontWeight="medium">
        {truncatedCampusName}
      </SoftTypography>
    </SoftBox>
  );
}

CampusBreadcrumbs.propTypes = {
  schoolName: PropTypes.string.isRequired,
  campusName: PropTypes.string.isRequired,
  onBackClick: PropTypes.func.isRequired,
};

export default CampusBreadcrumbs;
