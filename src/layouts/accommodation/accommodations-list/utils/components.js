import Icon from "@mui/material/Icon";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import PropTypes from "prop-types";
import Tooltip from "@mui/material/Tooltip";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { ICON_COLOR } from "./constants";

export function PhotosCell({ value }) {
  if (!Array.isArray(value) || value.length === 0) return null;

  return (
    <SoftBox display="flex" alignItems="center" gap={1}>
      <SoftBox
        component="img"
        src={value[0]}
        alt="accommodation photo"
        borderRadius="lg"
        shadow="md"
        width="40px"
        height="40px"
        sx={{ objectFit: "cover" }}
      />
      {value.length > 1 && (
        <SoftBox
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="50%"
          bgColor="grey-100"
          width="32px"
          height="32px"
          ml={0.5}
        >
          <SoftTypography variant="caption" color="secondary" fontWeight="medium">
            +{value.length - 1}
          </SoftTypography>
        </SoftBox>
      )}
    </SoftBox>
  );
}

export function ActionsCell({
  row,
  onView,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleStatus,
  isUpdating,
  hideRowMutations,
}) {
  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (!isUpdating && onToggleStatus) {
      onToggleStatus(row);
    }
  };

  const isActive = row.isActive !== undefined ? row.isActive : true;

  return (
    <SoftBox display="flex" alignItems="center" justifyContent="center" gap={2}>
      {onToggleStatus && !hideRowMutations && (
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
      <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
        <Tooltip title="View accommodation" placement="top">
          <Icon sx={{ color: ICON_COLOR }} fontSize="medium" onClick={() => onView(row)}>
            visibility
          </Icon>
        </Tooltip>
      </SoftTypography>
      {!hideRowMutations && (
        <>
          <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
            <Tooltip title="Duplicate accommodation" placement="top">
              <Icon sx={{ color: ICON_COLOR }} fontSize="medium" onClick={() => onDuplicate(row)}>
                content_copy
              </Icon>
            </Tooltip>
          </SoftTypography>
          <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
            <Tooltip title="Edit accommodation" placement="top">
              <Icon sx={{ color: ICON_COLOR }} fontSize="medium" onClick={() => onEdit(row)}>
                edit
              </Icon>
            </Tooltip>
          </SoftTypography>
          <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
            <Tooltip title="Delete accommodation" placement="left">
              <Icon sx={{ color: ICON_COLOR }} fontSize="medium" onClick={() => onDelete(row)}>
                delete
              </Icon>
            </Tooltip>
          </SoftTypography>
        </>
      )}
    </SoftBox>
  );
}

PhotosCell.propTypes = {
  value: PropTypes.arrayOf(PropTypes.string).isRequired,
};

ActionsCell.propTypes = {
  row: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onDuplicate: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func,
  isUpdating: PropTypes.bool,
  hideRowMutations: PropTypes.bool,
};
