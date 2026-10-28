import PropTypes from "prop-types";
import IconButton from "@mui/material/IconButton";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";

import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import CurrencyInput from "../CurrencyInput";
import SoftTypography from "components/SoftTypography";
import HighSeasonFeesList from "../HighSeasonFeesList";

import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";

function FlexiblePriceTable({
  flexible,
  currency,
  onUpdateRow,
  onRemoveRow,
  onAddRow,
  highSeasonFees = [],
  onHighSeasonFeeUpdate,
  onHighSeasonFeeRemove,
  onHighSeasonFeeAdd,
  disabled = false,
}) {
  const handleMaxWeeksBlur = (index, value) => {
    let cleanValue = value.trim();

    const lowerValue = cleanValue.toLowerCase().replace(/\s+/g, " ");
    if (
      lowerValue === "no max" ||
      lowerValue === "nomax" ||
      lowerValue === "no maximum" ||
      lowerValue === "unlimited" ||
      lowerValue === "no limit" ||
      lowerValue === "infinity" ||
      lowerValue === "∞" ||
      cleanValue === ""
    ) {
      cleanValue = "No max";
    }

    onUpdateRow(index, "max", cleanValue);
  };

  return (
    <>
      <Paper variant="outlined" sx={{ p: 2 }}>
        {/* Headers */}
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={3}>
            <SoftTypography variant="caption" fontWeight="bold">
              Min (Weeks)
            </SoftTypography>
          </Grid>
          <Grid item xs={3}>
            <SoftTypography variant="caption" fontWeight="bold">
              Max (Weeks)
            </SoftTypography>
          </Grid>
          <Grid item xs={4.5}>
            <SoftTypography variant="caption" fontWeight="bold">
              Price Per Week
            </SoftTypography>
          </Grid>
          <Grid item xs={1.5}>
            <SoftTypography variant="caption" fontWeight="bold">
              Actions
            </SoftTypography>
          </Grid>
        </Grid>

        {/* Rows */}
        {flexible.map((row, index) => (
          <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: "center" }}>
            <Grid item xs={3}>
              <SoftInput
                placeholder="Min weeks"
                value={row.min}
                onChange={(e) => {
                  const value = e.target.value.replace(/[^0-9]/g, "");
                  onUpdateRow(index, "min", value);
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={3}>
              <SoftInput
                placeholder="4, 4+, or No max"
                value={row.max}
                onChange={(e) => {
                  onUpdateRow(index, "max", e.target.value);
                }}
                onBlur={(e) => {
                  handleMaxWeeksBlur(index, e.target.value);
                }}
                fullWidth
              />
            </Grid>
            <Grid item xs={4.5}>
              <CurrencyInput
                value={row.price}
                onChange={(e) => {
                  const value = e.target.value.replace(/^0+/, "") || "0";
                  onUpdateRow(index, "price", value);
                }}
                currency={currency}
              />
            </Grid>
            <Grid item xs={1.5} sx={{ display: "flex", alignItems: "flex-start", paddingTop: 1 }}>
              <IconButton onClick={() => onRemoveRow(index)}>
                <DeleteIcon />
              </IconButton>
            </Grid>
          </Grid>
        ))}
      </Paper>
      <SoftBox mt={2} display="flex" gap={2}>
        <SoftButton variant="outlined" color="info" startIcon={<AddIcon />} onClick={onAddRow}>
          Add Another Row
        </SoftButton>
      </SoftBox>

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

FlexiblePriceTable.propTypes = {
  flexible: PropTypes.array.isRequired,
  currency: PropTypes.string.isRequired,
  onUpdateRow: PropTypes.func.isRequired,
  onRemoveRow: PropTypes.func.isRequired,
  onAddRow: PropTypes.func.isRequired,
  highSeasonFees: PropTypes.array,
  onHighSeasonFeeUpdate: PropTypes.func,
  onHighSeasonFeeRemove: PropTypes.func,
  onHighSeasonFeeAdd: PropTypes.func,
  disabled: PropTypes.bool,
};

export default FlexiblePriceTable;
