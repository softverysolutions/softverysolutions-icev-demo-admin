import PropTypes from "prop-types";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import { PRICE_TYPE_OPTIONS } from "../../../../constants";

function PriceTypeSelector({ priceType, onPriceTypeChange, disabled = false }) {
  return (
    <SoftBox mb={3}>
      <SoftTypography component="label" variant="caption" fontWeight="bold">
        Type *
      </SoftTypography>
      <SoftBox display="flex" gap={1} mt={1}>
        {PRICE_TYPE_OPTIONS.map((option) => (
          <SoftButton
            key={option.value}
            variant={priceType === option.value ? "gradient" : "outlined"}
            color={priceType === option.value ? "info" : "light"}
            size="small"
            onClick={() => onPriceTypeChange(option.value)}
            disabled={disabled}
            sx={{ flex: 1 }}
          >
            {option.label}
          </SoftButton>
        ))}
      </SoftBox>
    </SoftBox>
  );
}

PriceTypeSelector.propTypes = {
  priceType: PropTypes.string.isRequired,
  onPriceTypeChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default PriceTypeSelector;
