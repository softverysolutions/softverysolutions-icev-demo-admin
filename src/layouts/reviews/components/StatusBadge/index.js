import PropTypes from "prop-types";
import SoftBadge from "components/SoftBadge";
import { STATUS_COLOR, STATUS_LABEL } from "../../constants";

function StatusBadge({ status }) {
  if (!status) return null;
  return (
    <SoftBadge
      badgeContent={STATUS_LABEL[status] || status}
      color={STATUS_COLOR[status] || "secondary"}
      size="xs"
      container
    />
  );
}

StatusBadge.propTypes = {
  status: PropTypes.string,
};

StatusBadge.defaultProps = {
  status: "",
};

export default StatusBadge;
