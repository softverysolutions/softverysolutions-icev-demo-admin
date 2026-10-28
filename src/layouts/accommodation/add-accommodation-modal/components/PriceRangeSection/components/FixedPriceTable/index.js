import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";

import SoftInput from "components/SoftInput";
import CurrencyInput from "../CurrencyInput";
import SoftTypography from "components/SoftTypography";
import HighSeasonFeesList from "../HighSeasonFeesList";

function FixedPriceTable({
  fixed,
  currency,
  onUpdateRow,
  highSeasonFees = [],
  onHighSeasonFeeUpdate,
  onHighSeasonFeeRemove,
  onHighSeasonFeeAdd,
  disabled = false,
}) {
  const currentFixed = fixed.length > 0 ? fixed[0] : { duration: "", price: "" };

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={6}>
            <SoftTypography variant="caption" fontWeight="bold">
              Duration (Weeks)
            </SoftTypography>
          </Grid>
          <Grid item xs={6}>
            <SoftTypography variant="caption" fontWeight="bold">
              Price Per Period
            </SoftTypography>
          </Grid>
        </Grid>

        <Grid container spacing={2} sx={{ mb: 2, alignItems: "center" }}>
          <Grid item xs={6}>
            <SoftInput
              placeholder="Weeks"
              value={currentFixed.duration || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, "");
                onUpdateRow(0, "duration", value);
              }}
              fullWidth
            />
          </Grid>
          <Grid item xs={6}>
            <CurrencyInput
              value={currentFixed.price || ""}
              onChange={(e) => {
                const value = e.target.value.replace(/^0+/, "") || "0";
                onUpdateRow(0, "price", value);
              }}
              currency={currency}
            />
          </Grid>
        </Grid>
      </Paper>

      <HighSeasonFeesList
        highSeasonFees={highSeasonFees}
        currency={currency}
        onUpdateRow={onHighSeasonFeeUpdate}
        onRemoveRow={onHighSeasonFeeRemove}
        onAddRow={onHighSeasonFeeAdd}
        disabled={disabled}
      />
    </>
  );
}

FixedPriceTable.propTypes = {
  fixed: PropTypes.array.isRequired,
  currency: PropTypes.string.isRequired,
  onUpdateRow: PropTypes.func.isRequired,
  highSeasonFees: PropTypes.array,
  onHighSeasonFeeUpdate: PropTypes.func,
  onHighSeasonFeeRemove: PropTypes.func,
  onHighSeasonFeeAdd: PropTypes.func,
  disabled: PropTypes.bool,
};

export default FixedPriceTable;
