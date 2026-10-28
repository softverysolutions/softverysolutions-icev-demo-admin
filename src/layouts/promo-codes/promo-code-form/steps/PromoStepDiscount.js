import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";

import { formRadioGroupSx } from "./formFieldSx";
import { sanitizeDiscountInput } from "../../utils/promoNumericInput";

function PromoStepDiscount({ form, onInputChange, readOnly = false }) {
  const valueLabel = form.discountType === "percent" ? "Value (%)" : "Amount (€)";

  return (
    <>
      <RadioGroup
        row
        value={form.discountType}
        onChange={(e) => {
          const next = e.target.value;
          onInputChange("discountType", next);
          onInputChange("discountValue", sanitizeDiscountInput(form.discountValue, next));
        }}
        sx={formRadioGroupSx}
      >
        <FormControlLabel
          value="percent"
          control={<Radio color="primary" disabled={readOnly} />}
          label="Percentage (%)"
        />
        <FormControlLabel
          value="fixed"
          control={<Radio color="primary" disabled={readOnly} />}
          label="Fixed amount"
        />
      </RadioGroup>
      <Grid container spacing={2} mt={0.5}>
        <Grid item xs={12} md={6}>
          <SoftBox mb={0}>
            <SoftTypography component="label" variant="caption" fontWeight="bold" display="block" mb={0.5}>
              {valueLabel} *
            </SoftTypography>
            <SoftInput
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder={form.discountType === "percent" ? "e.g. 10" : "e.g. 50"}
              value={form.discountValue}
              onChange={(e) =>
                onInputChange("discountValue", sanitizeDiscountInput(e.target.value, form.discountType))
              }
              fullWidth
              disabled={readOnly}
            />
          </SoftBox>
        </Grid>
      </Grid>
    </>
  );
}

PromoStepDiscount.propTypes = {
  form: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
};

export default PromoStepDiscount;
