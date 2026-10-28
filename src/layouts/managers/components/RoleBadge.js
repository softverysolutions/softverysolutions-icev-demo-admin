import PropTypes from "prop-types";
import Chip from "@mui/material/Chip";
import Icon from "@mui/material/Icon";
import SoftBox from "components/SoftBox";
import { ADMIN_ROLES, ROLE_LABELS } from "../constants/roles";

const ROLE_STYLES = {
  [ADMIN_ROLES.SUPER_ADMIN]: {
    bgcolor: "rgba(0, 181, 145, 0.12)",
    color: "#00b591",
    icon: "admin_panel_settings",
  },
  [ADMIN_ROLES.ADMIN]: {
    bgcolor: "rgba(158, 158, 158, 0.12)",
    color: "#616161",
    icon: "person",
  },
  [ADMIN_ROLES.CONSULTANT]: {
    bgcolor: "rgba(158, 158, 158, 0.12)",
    color: "#616161",
    icon: "support_agent",
  },
};

function RoleBadge({ role }) {
  const style = ROLE_STYLES[role] || ROLE_STYLES[ADMIN_ROLES.CONSULTANT];
  const label = ROLE_LABELS[role] || role;

  return (
    <Chip
      size="small"
      icon={<Icon sx={{ fontSize: "1rem !important", color: "inherit" }}>{style.icon}</Icon>}
      label={label}
      sx={{
        backgroundColor: style.bgcolor,
        color: style.color,
        fontWeight: 600,
        fontSize: "0.75rem",
        "& .MuiChip-icon": {
          marginLeft: "8px",
          marginRight: "-4px",
        },
      }}
    />
  );
}

RoleBadge.propTypes = {
  role: PropTypes.string.isRequired,
};

export default RoleBadge;
