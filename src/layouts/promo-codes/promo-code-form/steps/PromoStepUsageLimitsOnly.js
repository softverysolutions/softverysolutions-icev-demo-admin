import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";

import { sanitizeUsageLimitInput } from "../../utils/promoNumericInput";

function PromoStepUsageLimitsOnly({ form, onInputChange, readOnly = false }) {
  return (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <SoftBox mb={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold" display="block" mb={0.5}>
            Total usage limit
          </SoftTypography>
          <SoftInput
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Unlimited"
            value={form.totalLimit}
            onChange={(e) => onInputChange("totalLimit", sanitizeUsageLimitInput(e.target.value))}
            fullWidth
            disabled={readOnly}
          />
          <SoftTypography variant="caption" color="text" display="block" mt={0.5}>
            Leave empty for unlimited
          </SoftTypography>
        </SoftBox>
      </Grid>
      <Grid item xs={12} md={6}>
        <SoftBox mb={0.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold" display="block" mb={0.5}>
            Per user limit
          </SoftTypography>
          <SoftInput
            type="text"
            inputMode="numeric"
            autoComplete="off"
            placeholder="Unlimited"
            value={form.perUserLimit}
            onChange={(e) => onInputChange("perUserLimit", sanitizeUsageLimitInput(e.target.value))}
            fullWidth
            disabled={readOnly}
          />
          <SoftTypography variant="caption" color="text" display="block" mt={0.5}>
            Leave empty for unlimited
          </SoftTypography>
        </SoftBox>
      </Grid>
    </Grid>
  );
}

PromoStepUsageLimitsOnly.propTypes = {
  form: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
};

export default PromoStepUsageLimitsOnly;
