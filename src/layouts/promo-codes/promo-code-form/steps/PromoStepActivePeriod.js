import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftDatePicker from "components/SoftDatePicker";

function PromoStepActivePeriod({ form, onInputChange, dateError = "", readOnly = false }) {
  return (
    <>
      <Grid container spacing={2}>
        <Grid item xs={12} md={6}>
          <SoftBox mb={1}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Start date *
            </SoftTypography>
            <SoftDatePicker
              value={form.startAt}
              onChange={(dates) => onInputChange("startAt", dates[0])}
              options={{
                enableTime: true,
                dateFormat: "Y-m-d H:i",
                time_24hr: true,
                clickOpens: !readOnly,
              }}
              input={{
                placeholder: "Pick a date",
                icon: { component: <Icon>event</Icon>, direction: "left" },
                disabled: readOnly,
              }}
            />
          </SoftBox>
        </Grid>
        <Grid item xs={12} md={6}>
          <SoftBox mb={1}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              End date *
            </SoftTypography>
            <SoftDatePicker
              value={form.endAt}
              onChange={(dates) => onInputChange("endAt", dates[0])}
              options={{
                enableTime: true,
                dateFormat: "Y-m-d H:i",
                time_24hr: true,
                clickOpens: !readOnly,
              }}
              input={{
                placeholder: "Pick a date",
                icon: { component: <Icon>event</Icon>, direction: "left" },
                disabled: readOnly,
              }}
            />
          </SoftBox>
        </Grid>
      </Grid>
      <SoftTypography variant="caption" color="text" display="block" mt={1}>
        After the end date, the code is automatically expired and rejected at checkout.
      </SoftTypography>
      {dateError ? (
        <SoftTypography variant="caption" color="error" display="block" mt={1}>
          {dateError}
        </SoftTypography>
      ) : null}
    </>
  );
}

PromoStepActivePeriod.propTypes = {
  form: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  dateError: PropTypes.string,
  readOnly: PropTypes.bool,
};

export default PromoStepActivePeriod;
