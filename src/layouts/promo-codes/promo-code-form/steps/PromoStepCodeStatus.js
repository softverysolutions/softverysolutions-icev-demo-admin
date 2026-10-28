import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";

function PromoStepCodeStatus({ form, onInputChange, readOnly = false }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <SoftBox mb={1.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold" display="block" mb={0.5}>
            Code *
          </SoftTypography>
          <SoftBox display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <SoftBox flex="1" minWidth={200}>
              <SoftInput
                placeholder="e.g. SUMMER25"
                value={form.code}
                onChange={(e) => onInputChange("code", e.target.value.toUpperCase())}
                fullWidth
                disabled={readOnly}
              />
            </SoftBox>
            <FormControlLabel
              sx={{ m: 0, flexShrink: 0 }}
              control={
                <Switch
                  checked={form.status === "active"}
                  onChange={(e) => onInputChange("status", e.target.checked ? "active" : "inactive")}
                  color="primary"
                  disabled={readOnly}
                />
              }
              label={
                <SoftTypography variant="button" fontWeight="regular">
                  Active
                </SoftTypography>
              }
              labelPlacement="start"
            />
          </SoftBox>
        </SoftBox>
      </Grid>

      <Grid item xs={12}>
        <SoftBox mb={0}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Description (optional)
          </SoftTypography>
          <SoftInput
            multiline
            rows={3}
            placeholder="Internal note for admin reference"
            value={form.description}
            onChange={(e) => onInputChange("description", e.target.value)}
            fullWidth
            disabled={readOnly}
          />
        </SoftBox>
      </Grid>
    </Grid>
  );
}

PromoStepCodeStatus.propTypes = {
  form: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
};

export default PromoStepCodeStatus;
