import PropTypes from "prop-types";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function SchoolBreadcrumbs({ schoolName, onBackClick }) {
  return (
    <SoftBox mb={3}>
      <Breadcrumbs aria-label="breadcrumb">
        <Link
          underline="hover"
          color="inherit"
          href="#"
          onClick={onBackClick}
          sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <Icon sx={{ mr: 0.5 }}>home</Icon>
          Providers
        </Link>
        <SoftTypography color="text.primary">View</SoftTypography>
        <SoftTypography color="text.primary">{schoolName}</SoftTypography>
      </Breadcrumbs>
    </SoftBox>
  );
}

SchoolBreadcrumbs.propTypes = {
  schoolName: PropTypes.string.isRequired,
  onBackClick: PropTypes.func.isRequired,
};

export default SchoolBreadcrumbs;
