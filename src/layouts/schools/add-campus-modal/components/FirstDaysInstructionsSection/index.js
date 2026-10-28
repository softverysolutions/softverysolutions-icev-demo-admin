import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftEditor from "components/SoftEditor";

function FieldLabel({ children }) {
  return (
    <SoftBox mb={1} ml={0.5} lineHeight={0} display="inline-block">
      <SoftTypography component="label" variant="caption" fontWeight="bold">
        {children}
      </SoftTypography>
    </SoftBox>
  );
}

FieldLabel.propTypes = {
  children: PropTypes.node.isRequired,
};

function FirstDaysInstructionsSection({
  arriveByTime,
  arriveByText,
  whatToBring,
  onFieldChange,
  disabled = false,
}) {
  return (
    <SoftBox>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        First days instructions
      </SoftTypography>
      <SoftTypography variant="caption" color="text" display="block" mb={2}>
        Shown inside the programme modal in the mobile app for participants at this location.
      </SoftTypography>

      <Grid container spacing={2} alignItems="flex-end">
        <Grid item xs={12} md={4}>
          <FieldLabel>Arrive by time</FieldLabel>
          <SoftInput
            type="time"
            value={arriveByTime || ""}
            onChange={(event) => onFieldChange("arriveByTime", event.target.value)}
            disabled={disabled}
            inputProps={{ step: 300 }}
          />
        </Grid>

        <Grid item xs={12} md={8}>
          <FieldLabel>Arrive by text</FieldLabel>
          <SoftInput
            value={arriveByText || ""}
            onChange={(event) => onFieldChange("arriveByText", event.target.value)}
            placeholder="Reception is on the ground floor. Welcome session starts at 09:00."
            disabled={disabled}
          />
        </Grid>

        <Grid item xs={12}>
          <FieldLabel>What to bring</FieldLabel>
          <SoftBox dir="ltr" sx={{ direction: "ltr", textAlign: "left" }}>
            <SoftEditor
              value={whatToBring || ""}
              onChange={(value) => onFieldChange("whatToBring", value)}
              disabled={disabled}
              inModal
            />
          </SoftBox>
        </Grid>
      </Grid>
    </SoftBox>
  );
}

FirstDaysInstructionsSection.propTypes = {
  arriveByTime: PropTypes.string,
  arriveByText: PropTypes.string,
  whatToBring: PropTypes.string,
  onFieldChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default FirstDaysInstructionsSection;
