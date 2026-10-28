import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";

import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

const ICON_COLOR = "text.secondary";

export function ActionsCell({ row }) {
  const navigate = useNavigate();

  const handleView = () => {
    if (!row.id) {
      alert(`Error: User ID is missing. Cannot view user details.`);
      return;
    }

    navigate(`/users/view/${row.id}`);
  };

  return (
    <SoftBox display="flex" alignItems="center" justifyContent="center" gap={2}>
      <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
        <Tooltip title="View user" placement="top">
          <Icon sx={{ color: ICON_COLOR }} fontSize="medium" onClick={handleView}>
            visibility
          </Icon>
        </Tooltip>
      </SoftTypography>
    </SoftBox>
  );
}

ActionsCell.propTypes = {
  row: PropTypes.object.isRequired,
};
