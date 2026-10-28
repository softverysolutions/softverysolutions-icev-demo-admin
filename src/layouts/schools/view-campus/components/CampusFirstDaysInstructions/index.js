import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Divider from "@mui/material/Divider";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { isEmptyRichText } from "utils/richtextUtils";

function FieldValue({ label, value, isHtml = false }) {
  const isEmpty = isHtml ? isEmptyRichText(value) : !String(value || "").trim();

  return (
    <SoftBox>
      <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
        {label}
      </SoftTypography>
      {isEmpty ? (
        <SoftTypography variant="body2" color="text">
          —
        </SoftTypography>
      ) : isHtml ? (
        <SoftTypography
          variant="body2"
          color="text"
          dangerouslySetInnerHTML={{ __html: value }}
        />
      ) : (
        <SoftTypography variant="body2" color="text">
          {value}
        </SoftTypography>
      )}
    </SoftBox>
  );
}

FieldValue.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string,
  isHtml: PropTypes.bool,
};

function CampusFirstDaysInstructions({ campus }) {
  const instructions = {
    arriveByTime: campus.arriveByTime || "",
    arriveByText: campus.arriveByText || "",
    whatToBring: campus.whatToBring || "",
  };

  return (
    <SoftBox mt={3}>
      <Divider sx={{ mb: 3 }} />
      <SoftTypography variant="h6" fontWeight="medium" mb={1}>
        First days instructions
      </SoftTypography>
      <SoftTypography variant="caption" color="text" display="block" mb={2}>
        Shown inside the programme modal in the mobile app for participants at this location.
      </SoftTypography>

      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <FieldValue label="Arrive by time" value={instructions.arriveByTime} />
        </Grid>
        <Grid item xs={12} md={8}>
          <FieldValue label="Arrive by text" value={instructions.arriveByText} />
        </Grid>
        <Grid item xs={12}>
          <FieldValue label="What to bring" value={instructions.whatToBring} isHtml />
        </Grid>
      </Grid>
    </SoftBox>
  );
}

CampusFirstDaysInstructions.propTypes = {
  campus: PropTypes.object.isRequired,
};

export default CampusFirstDaysInstructions;
