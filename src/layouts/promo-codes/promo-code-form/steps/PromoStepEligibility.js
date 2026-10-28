import PropTypes from "prop-types";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";

import { formRadioGroupSx } from "./formFieldSx";

function PromoStepEligibility({ form, onInputChange, readOnly = false }) {
  return (
    <>
      <RadioGroup
        row
        value={form.eligibilityScope}
        onChange={(e) => onInputChange("eligibilityScope", e.target.value)}
        sx={formRadioGroupSx}
      >
        <FormControlLabel
          value="global"
          control={<Radio color="primary" disabled={readOnly} />}
          label="Global — any user can apply"
        />
        <FormControlLabel
          value="user"
          control={<Radio color="primary" disabled={readOnly} />}
          label="User-specific"
        />
      </RadioGroup>
      {form.eligibilityScope === "user" && (
        <SoftBox mt={1.5} maxWidth={480}>
          <SoftTypography component="label" variant="caption" fontWeight="bold" mb={0.5} display="block">
            User email *
          </SoftTypography>
          <SoftInput
            type="email"
            placeholder="user@example.com"
            value={form.userEmail}
            onChange={(e) => onInputChange("userEmail", e.target.value)}
            fullWidth
            disabled={readOnly}
          />
        </SoftBox>
      )}
    </>
  );
}

PromoStepEligibility.propTypes = {
  form: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  readOnly: PropTypes.bool,
};

export default PromoStepEligibility;
