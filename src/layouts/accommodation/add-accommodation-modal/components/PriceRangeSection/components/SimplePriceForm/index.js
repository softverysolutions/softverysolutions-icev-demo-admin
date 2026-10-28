import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import CurrencyInput from "../CurrencyInput";
import HighSeasonFeesList from "../HighSeasonFeesList";

function SimplePriceForm({
  simple,
  currency,
  onSimpleChange,
  highSeasonFees = [],
  onHighSeasonFeeUpdate,
  onHighSeasonFeeRemove,
  onHighSeasonFeeAdd,
  disabled = false,
}) {
  return (
    <SoftBox>
      <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1} display="block">
        Enter a price
      </SoftTypography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={10}>
          <CurrencyInput
            value={simple.price}
            onChange={(e) => {
              const value = e.target.value.replace(/^0+/, "") || "0";
              onSimpleChange({ ...simple, price: value });
            }}
            currency={currency}
            disabled={disabled}
          />
        </Grid>
        <Grid item xs={2}>
          <SoftTypography variant="button" sx={{ textAlign: "center", display: "block" }}>
            Per Week
          </SoftTypography>
        </Grid>
      </Grid>

      <HighSeasonFeesList
        highSeasonFees={highSeasonFees}
        currency={currency}
        onUpdateRow={onHighSeasonFeeUpdate}
        onRemoveRow={onHighSeasonFeeRemove}
        onAddRow={onHighSeasonFeeAdd}
        disabled={disabled}
      />
    </SoftBox>
  );
}

SimplePriceForm.propTypes = {
  simple: PropTypes.shape({
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    unit: PropTypes.string,
  }).isRequired,
  currency: PropTypes.string.isRequired,
  onSimpleChange: PropTypes.func.isRequired,
  highSeasonFees: PropTypes.array,
  onHighSeasonFeeUpdate: PropTypes.func,
  onHighSeasonFeeRemove: PropTypes.func,
  onHighSeasonFeeAdd: PropTypes.func,
  disabled: PropTypes.bool,
};

export default SimplePriceForm;
