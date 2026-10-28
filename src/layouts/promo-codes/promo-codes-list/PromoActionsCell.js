import PropTypes from "prop-types";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

const ICON_COLOR = "#241A5C";

function PromoActionsCell({ value }) {
  const { row, onView, onEdit, onToggleActive, isActive, isUpdating } = value;

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (!isUpdating && onToggleActive) {
      onToggleActive(row);
    }
  };

  return (
    <SoftBox display="flex" alignItems="center" justifyContent="center" gap={2} flexWrap="wrap">
      {onToggleActive && (
        <FormControlLabel
          control={
            <Checkbox
              checked={isActive}
              onChange={handleCheckboxChange}
              disabled={isUpdating}
              size="small"
              onClick={(e) => e.stopPropagation()}
            />
          }
          label=""
          sx={{ margin: 0 }}
        />
      )}
      {onView && (
        <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
          <Tooltip title="View" placement="top">
            <Icon
              sx={{ color: ICON_COLOR }}
              fontSize="medium"
              onClick={(e) => {
                e.stopPropagation();
                onView(row);
              }}
            >
              visibility
            </Icon>
          </Tooltip>
        </SoftTypography>
      )}
      {onEdit && (
        <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
          <Tooltip title="Edit" placement="top">
            <Icon
              sx={{ color: ICON_COLOR }}
              fontSize="medium"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row);
              }}
            >
              edit
            </Icon>
          </Tooltip>
        </SoftTypography>
      )}
    </SoftBox>
  );
}

PromoActionsCell.propTypes = {
  value: PropTypes.shape({
    row: PropTypes.object.isRequired,
    onView: PropTypes.func,
    onEdit: PropTypes.func,
    onToggleActive: PropTypes.func,
    isActive: PropTypes.bool,
    isUpdating: PropTypes.bool,
  }).isRequired,
};

export default PromoActionsCell;
