import PropTypes from "prop-types";
import Chip from "@mui/material/Chip";
import { ADMIN_STATUS, STATUS_LABELS } from "../constants/statuses";

const STATUS_STYLES = {
  [ADMIN_STATUS.ACTIVE]: {
    bgcolor: "rgba(76, 175, 80, 0.12)",
    color: "#0B7A5A",
  },
  [ADMIN_STATUS.INACTIVE]: {
    bgcolor: "rgba(244, 67, 54, 0.12)",
    color: "#c62828",
  },
};

function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] || STATUS_STYLES[ADMIN_STATUS.INACTIVE];
  const label = STATUS_LABELS[status] || status;

  return (
    <Chip
      size="small"
      label={label}
      sx={{
        backgroundColor: style.bgcolor,
        color: style.color,
        fontWeight: 600,
        fontSize: "0.75rem",
      }}
    />
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};

export default StatusBadge;
