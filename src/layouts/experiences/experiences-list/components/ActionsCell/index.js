import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

import SoftBox from "components/SoftBox";

function ActionsCell({ row, onView, onEdit, onToggleStatus, isToggling }) {
  const experience = row.original?.actions;
  const isActive = experience?.isActive !== false;

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (!isToggling && onToggleStatus) onToggleStatus(experience);
  };

  return (
    <SoftBox
      display="flex"
      alignItems="center"
      justifyContent="center"
      gap={0.5}
      onClick={(e) => e.stopPropagation()}
    >
      {onToggleStatus && (
        <Tooltip title={isActive ? "Deactivate" : "Activate"} placement="top">
          <FormControlLabel
            control={
              <Checkbox
                checked={isActive}
                onChange={handleCheckboxChange}
                disabled={isToggling}
                size="small"
                onClick={(e) => e.stopPropagation()}
              />
            }
            label=""
            sx={{ margin: 0 }}
          />
        </Tooltip>
      )}
      <Tooltip title="View" placement="top">
        <IconButton size="small" onClick={() => onView(experience)}>
          <Icon fontSize="small">visibility</Icon>
        </IconButton>
      </Tooltip>
      <Tooltip title="Edit" placement="top">
        <IconButton size="small" onClick={() => onEdit(experience)}>
          <Icon fontSize="small">edit</Icon>
        </IconButton>
      </Tooltip>
    </SoftBox>
  );
}

ActionsCell.propTypes = {
  row: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func,
  isToggling: PropTypes.bool,
};

export default ActionsCell;
