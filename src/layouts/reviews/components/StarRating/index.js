import PropTypes from "prop-types";
import Rating from "@mui/material/Rating";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function StarRating({ value, showValue, valueLeft, size }) {
  const numeric = typeof value === "number" ? value : null;

  const valueLabel =
    showValue && numeric != null ? (
      <SoftTypography variant="caption" fontWeight="medium" color="text">
        {numeric.toFixed(1)}
      </SoftTypography>
    ) : null;

  return (
    <SoftBox display="flex" alignItems="center" gap={0.75}>
      {valueLeft && valueLabel}
      <Rating value={numeric ?? 0} precision={0.1} readOnly size={size} />
      {!valueLeft && valueLabel}
    </SoftBox>
  );
}

StarRating.propTypes = {
  value: PropTypes.number,
  showValue: PropTypes.bool,
  valueLeft: PropTypes.bool,
  size: PropTypes.oneOf(["small", "medium", "large"]),
};

StarRating.defaultProps = {
  value: null,
  showValue: false,
  valueLeft: false,
  size: "small",
};

export default StarRating;
