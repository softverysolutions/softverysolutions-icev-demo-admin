import PropTypes from "prop-types";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import SoftBox from "components/SoftBox";
import SoftButton from "components/SoftButton";
import CurrencyInput from "../CurrencyInput";
import SoftTypography from "components/SoftTypography";
import SoftDatePicker from "components/SoftDatePicker";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

function HighSeasonFeesList({
  highSeasonFees,
  currency,
  onUpdateRow,
  onRemoveRow,
  onAddRow,
  disabled = false,
}) {
  return (
    <>
      <SoftBox mt={3}>
        <SoftTypography
          component="label"
          variant="caption"
          fontWeight="bold"
          mb={2}
          display="block"
        >
          High Season Fees
        </SoftTypography>

        {highSeasonFees.length > 0 && (
          <Paper variant="outlined" sx={{ p: 2 }}>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={3}>
                <SoftTypography variant="caption" fontWeight="bold">
                  Start Date
                </SoftTypography>
              </Grid>
              <Grid item xs={3}>
                <SoftTypography variant="caption" fontWeight="bold">
                  End Date
                </SoftTypography>
              </Grid>
              <Grid item xs={3}>
                <SoftTypography variant="caption" fontWeight="bold">
                  Price Per Week
                </SoftTypography>
              </Grid>
              <Grid item xs={2}>
                <SoftTypography variant="caption" fontWeight="bold">
                  Active
                </SoftTypography>
              </Grid>
              <Grid item xs={1}>
                <SoftTypography variant="caption" fontWeight="bold">
                  Actions
                </SoftTypography>
              </Grid>
            </Grid>

            {highSeasonFees.map((row, index) => (
              <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: "center" }}>
                <Grid item xs={3}>
                  <SoftDatePicker
                    value={row.startDate || null}
                    onChange={(date) => {
                      onUpdateRow(index, "startDate", date && date.length > 0 ? date[0] : null);
                    }}
                    options={{
                      dateFormat: "Y-m-d",
                      altInput: true,
                      altFormat: "F j, Y",
                    }}
                    disabled={disabled}
                  />
                </Grid>
                <Grid item xs={3}>
                  <SoftDatePicker
                    value={row.endDate || null}
                    onChange={(date) => {
                      onUpdateRow(index, "endDate", date && date.length > 0 ? date[0] : null);
                    }}
                    options={{
                      dateFormat: "Y-m-d",
                      altInput: true,
                      altFormat: "F j, Y",
                      minDate: row.startDate || null,
                    }}
                    disabled={disabled}
                  />
                  {row.startDate &&
                    row.endDate &&
                    new Date(row.endDate) < new Date(row.startDate) && (
                      <SoftTypography variant="caption" color="error">
                        End date must be after start date
                      </SoftTypography>
                    )}
                </Grid>
                <Grid item xs={3}>
                  <CurrencyInput
                    value={row.pricePerWeek || "0"}
                    onChange={(e) => {
                      const value = e.target.value.replace(/^0+/, "") || "0";
                      onUpdateRow(index, "pricePerWeek", value);
                    }}
                    currency={currency}
                    disabled={disabled}
                  />
                </Grid>
                <Grid
                  item
                  xs={1.5}
                  sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={row.active !== false}
                        onChange={(e) => {
                          onUpdateRow(index, "active", e.target.checked);
                        }}
                        disabled={disabled}
                      />
                    }
                    label=""
                  />
                </Grid>
                <Grid
                  item
                  xs={1.5}
                  sx={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <IconButton onClick={() => onRemoveRow(index)} disabled={disabled}>
                    <DeleteIcon />
                  </IconButton>
                </Grid>
              </Grid>
            ))}
          </Paper>
        )}
      </SoftBox>

      {!disabled && (
        <SoftBox mt={2} display="flex" gap={2}>
          <SoftButton variant="outlined" color="info" startIcon={<AddIcon />} onClick={onAddRow}>
            Add High Season Fee
          </SoftButton>
        </SoftBox>
      )}
    </>
  );
}

HighSeasonFeesList.propTypes = {
  highSeasonFees: PropTypes.array.isRequired,
  currency: PropTypes.string.isRequired,
  onUpdateRow: PropTypes.func.isRequired,
  onRemoveRow: PropTypes.func.isRequired,
  onAddRow: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default HighSeasonFeesList;
