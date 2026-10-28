import PropTypes from "prop-types";
import { Grid } from "@mui/material";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftEditor from "components/SoftEditor";

function DescriptionSection({ description, onDescriptionChange, disabled = false }) {
  return (
    <Grid item xs={12}>
      <SoftBox mb={1} ml={0.5} lineHeight={0} display="inline-block">
        <SoftTypography component="label" variant="caption" fontWeight="bold">
          Location Description&nbsp;&nbsp;
          <SoftTypography variant="caption" fontWeight="regular" color="text">
            (optional)
          </SoftTypography>
        </SoftTypography>
      </SoftBox>
      <SoftBox dir="ltr" sx={{ direction: "ltr", textAlign: "left" }}>
        <SoftEditor value={description || ""} onChange={onDescriptionChange} disabled={disabled} />
      </SoftBox>
    </Grid>
  );
}

DescriptionSection.propTypes = {
  description: PropTypes.string.isRequired,
  onDescriptionChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default DescriptionSection;
