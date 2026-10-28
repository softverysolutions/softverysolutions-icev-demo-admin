import PropTypes from "prop-types";
import { alpha } from "@mui/material/styles";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function StatusBadge({ status }) {
  const map = {
    active: { bg: (t) => alpha(t.palette.success.main, 0.15), color: "success.main", label: "active" },
    expired: { bg: "grey.200", color: "text.secondary", label: "expired" },
    inactive: { bg: (t) => alpha(t.palette.error.main, 0.12), color: "error.main", label: "inactive" },
  };
  const s = map[status] || map.inactive;
  return (
    <SoftBox
      component="span"
      px={1.5}
      py={0.5}
      borderRadius="lg"
      sx={{ backgroundColor: s.bg, color: s.color }}
    >
      <SoftTypography variant="caption" fontWeight="medium" sx={{ color: "inherit", textTransform: "capitalize" }}>
        {s.label}
      </SoftTypography>
    </SoftBox>
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
};

export default StatusBadge;
