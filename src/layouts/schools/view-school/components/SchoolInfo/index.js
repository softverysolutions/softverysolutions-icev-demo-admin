import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftBadge from "components/SoftBadge";

function SchoolInfo({ info }) {
  return (
    <SoftBox mb={3}>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Contact Information
      </SoftTypography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <SoftBox mb={2}>
            <SoftTypography variant="body2" color="text" fontWeight="medium" mb={1}>
              Email
            </SoftTypography>
            <SoftTypography variant="body2" color="text">
              {info.contactEmail}
            </SoftTypography>
          </SoftBox>
        </Grid>
        <Grid item xs={12} sm={6}>
          <SoftBox mb={2}>
            <SoftTypography variant="body2" color="text" fontWeight="medium" mb={1}>
              Phone
            </SoftTypography>
            <SoftTypography variant="body2" color="text">
              {info.contactPhone}
            </SoftTypography>
          </SoftBox>
        </Grid>
      </Grid>
    </SoftBox>
  );
}

SchoolInfo.propTypes = {
  info: PropTypes.object.isRequired,
};

export default SchoolInfo;
