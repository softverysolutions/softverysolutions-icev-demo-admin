import PropTypes from "prop-types";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Icon from "@mui/material/Icon";
import { useState } from "react";
import SoftTypography from "components/SoftTypography";

function ActionsMenu({ row, onChangeRole, onDeactivate, onActivate, disabled }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);

  const handleOpen = (e) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleChangeRole = () => {
    handleClose();
    onChangeRole?.(row);
  };

  const handleDeactivate = () => {
    handleClose();
    onDeactivate?.(row);
  };

  const handleActivate = () => {
    handleClose();
    onActivate?.(row);
  };

  const isInactive = row?.status === "inactive";

  return (
    <>
      <IconButton
        size="small"
        onClick={handleOpen}
        disabled={disabled}
        aria-label="Actions"
        aria-controls={open ? "manager-actions-menu" : undefined}
        aria-haspopup="true"
        aria-expanded={open ? "true" : undefined}
      >
        <Icon fontSize="small">more_vert</Icon>
      </IconButton>
      <Menu
        id="manager-actions-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { minWidth: 160 } } }}
      >
        <MenuItem onClick={handleChangeRole}>
          <ListItemIcon>
            <Icon fontSize="small">admin_panel_settings</Icon>
          </ListItemIcon>
          <ListItemText>
            <SoftTypography variant="button" color="text">
              Change Role
            </SoftTypography>
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleDeactivate} disabled={isInactive}>
          <ListItemIcon>
            <Icon fontSize="small">person_off</Icon>
          </ListItemIcon>
          <ListItemText>
            <SoftTypography variant="button" color="text">
              Deactivate
            </SoftTypography>
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={handleActivate} disabled={!isInactive}>
          <ListItemIcon>
            <Icon fontSize="small">person_add</Icon>
          </ListItemIcon>
          <ListItemText>
            <SoftTypography variant="button" color="text">
              Activate
            </SoftTypography>
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

ActionsMenu.propTypes = {
  row: PropTypes.object.isRequired,
  onChangeRole: PropTypes.func,
  onDeactivate: PropTypes.func,
  onActivate: PropTypes.func,
  disabled: PropTypes.bool,
};

export default ActionsMenu;
