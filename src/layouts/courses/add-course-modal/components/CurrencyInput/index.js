import PropTypes from "prop-types";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";

function CurrencyInput({
  value,
  onChange,
  placeholder = "0",
  currency,
  disabled = false,
  fullWidth = true,
}) {
  return (
    <SoftBox sx={{ position: "relative" }}>
      <SoftTypography
        variant="body2"
        sx={{
          position: "absolute",
          right: "16px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 2,
          color: "text.secondary",
          fontWeight: "500",
          minWidth: "60px",
          backgroundColor: "white",
          paddingRight: "8px",
        }}
      >
        {currency}
      </SoftTypography>
      <SoftInput
        type="number"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        fullWidth={fullWidth}
        sx={{
          "& .MuiInputBase-input": {
            paddingLeft: "80px",
          },
          "& .MuiInputAdornment-root": {
            display: "none !important",
          },
          "& .MuiInputAdornment-positionStart": {
            display: "none !important",
          },
        }}
      />
    </SoftBox>
  );
}

CurrencyInput.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  currency: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  fullWidth: PropTypes.bool,
};

export default CurrencyInput;
