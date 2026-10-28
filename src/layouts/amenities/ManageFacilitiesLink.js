import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import Icon from "@mui/material/Icon";

import SoftButton from "components/SoftButton";

export const AMENITIES_LIST_ROUTE = "/schools/amenities-list";

function ManageFacilitiesLink({ openInNewTab = false }) {
  return (
    <SoftButton
      component={Link}
      to={AMENITIES_LIST_ROUTE}
      target={openInNewTab ? "_blank" : undefined}
      rel={openInNewTab ? "noopener noreferrer" : undefined}
      variant="outlined"
      color="info"
      size="small"
      startIcon={<Icon fontSize="small">settings</Icon>}
    >
      Manage facilities &amp; icons
    </SoftButton>
  );
}

ManageFacilitiesLink.propTypes = {
  openInNewTab: PropTypes.bool,
};

export default ManageFacilitiesLink;
