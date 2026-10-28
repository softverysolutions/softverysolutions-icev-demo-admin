import React from "react";
import PropTypes from "prop-types";
import { CircularProgress } from "@mui/material";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function SchoolLoadingOverlayNew({ isVisible }) {
  if (!isVisible) return null;

  return (
    <SoftBox
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={1000}
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      bgcolor="rgba(255, 255, 255, 0.9)"
      sx={{ backdropFilter: "blur(2px)" }}
    >
      <CircularProgress size={60} />
      <SoftTypography variant="h6" color="text" mt={2}>
        Loading school data...
      </SoftTypography>
      <SoftTypography variant="body2" color="text" textAlign="center" mt={1}>
        Please wait while we prepare the form
      </SoftTypography>
    </SoftBox>
  );
}

SchoolLoadingOverlayNew.propTypes = {
  isVisible: PropTypes.bool.isRequired,
};

export default SchoolLoadingOverlayNew;
