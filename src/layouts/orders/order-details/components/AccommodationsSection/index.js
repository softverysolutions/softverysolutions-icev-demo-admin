import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftSelect from "components/SoftSelect";
import SoftInput from "components/SoftInput";
import SoftDatePicker from "components/SoftDatePicker";
import Grid from "@mui/material/Grid";
import { formatDateOnly } from "utils/dateUtils";
import { formatMoney } from "services/currencyService";

function AccommodationsSection({
  accommodation,
  accommodations = [],
  isLoadingAccommodations = false,
  isEditMode = false,
  onAccommodationChange,
  onAddAccommodation,
  courseStartDate,
  courseDurationWeeks,
  currency = "EUR",
}) {
  const hasAccommodation = accommodation && accommodation.name && accommodation.name !== "No accommodation";
  const minStartDate = courseStartDate ? new Date(courseStartDate) : null;
  const maxDuration = courseDurationWeeks != null && courseDurationWeeks !== "" ? Number(courseDurationWeeks) : null;

  return (
    <Card>
      <SoftBox p={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <SoftTypography variant="h6" fontWeight="medium">
            Accommodation
          </SoftTypography>
          {isEditMode && !hasAccommodation && (
            <SoftButton
              variant="gradient"
              color="info"
              size="small"
              startIcon={<Icon>add</Icon>}
              onClick={onAddAccommodation}
            >
              Add Accommodation
            </SoftButton>
          )}
        </SoftBox>

        {!hasAccommodation ? (
          <SoftBox
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              padding: "24px",
              backgroundColor: "#F7F6FB",
              borderRadius: "8px",
              border: "1px dashed #dee2e6",
            }}
          >
            <SoftTypography variant="body2" color="text.secondary">
              No accommodations added
            </SoftTypography>
          </SoftBox>
        ) : (
          <SoftBox>
            {isEditMode ? (
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <SoftBox mb={2}>
                    <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1} display="block">
                      Change Accommodation
                    </SoftTypography>
                    <SoftSelect
                      value={accommodations.find((a) => a.value === accommodation?.accommodationId) || null}
                      onChange={(option) =>
                        onAccommodationChange && onAccommodationChange("accommodationId", option?.value || null)
                      }
                      options={accommodations}
                      placeholder={isLoadingAccommodations ? "Loading accommodations..." : "Select accommodation"}
                      isClearable
                      isLoading={isLoadingAccommodations}
                    />
                  </SoftBox>
                </Grid>

                <Grid item xs={12} md={6}>
                  <SoftBox mb={2}>
                    <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1} display="block">
                      Start Date
                    </SoftTypography>
                    <SoftDatePicker
                      value={accommodation.startDate ? new Date(accommodation.startDate) : null}
                      onChange={(date) => {
                        if (date && date[0]) {
                          const d = date[0];
                          const year = d.getFullYear();
                          const month = String(d.getMonth() + 1).padStart(2, "0");
                          const day = String(d.getDate()).padStart(2, "0");
                          const dateValue = `${year}-${month}-${day}`;
                          onAccommodationChange && onAccommodationChange("startDate", dateValue);
                        } else {
                          onAccommodationChange && onAccommodationChange("startDate", "");
                        }
                      }}
                      options={{
                        dateFormat: "Y-m-d",
                        altInput: true,
                        altFormat: "F j, Y",
                        locale: "en",
                        ...(minStartDate && !isNaN(minStartDate.getTime()) ? { minDate: minStartDate } : {}),
                      }}
                      input={{
                        placeholder: "Select start date",
                      }}
                    />
                  </SoftBox>
                </Grid>

                <Grid item xs={12} md={6}>
                  <SoftBox mb={2}>
                    <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1} display="block">
                      Duration (weeks)
                    </SoftTypography>
                    <SoftInput
                      type="number"
                      value={accommodation.duration?.replace(" weeks", "") || accommodation.duration || ""}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (maxDuration != null && val !== "" && Number(val) > maxDuration) {
                          val = String(maxDuration);
                        }
                        onAccommodationChange && onAccommodationChange("duration", `${val} weeks`);
                      }}
                      placeholder={maxDuration != null ? `Max ${maxDuration} weeks (course duration)` : "Enter duration in weeks"}
                      inputProps={{ min: 1, max: maxDuration ?? undefined }}
                    />
                  </SoftBox>
                </Grid>
              </Grid>
            ) : (
              <SoftBox display="flex" flexDirection="column" gap={2}>
                <SoftBox>
                  <SoftTypography variant="body2" color="text">
                    {accommodation.name}
                  </SoftTypography>
                  {accommodation.address && (
                    <SoftTypography variant="caption" color="text.secondary">
                      {accommodation.address}
                    </SoftTypography>
                  )}
                </SoftBox>

                {accommodation.cost != null && accommodation.cost !== "" && (
                  <SoftBox>
                    <SoftTypography
                      variant="body2"
                      color="dark"
                      fontWeight="bold"
                      sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
                    >
                      Price:
                    </SoftTypography>
                    <SoftTypography
                      variant="body2"
                      color="text.secondary"
                      sx={{ fontSize: "0.875rem", fontWeight: "400" }}
                    >
                      {formatMoney(accommodation.cost, currency || "EUR")}
                    </SoftTypography>
                  </SoftBox>
                )}

                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <SoftBox>
                      <SoftTypography
                        variant="body2"
                        color="dark"
                        fontWeight="bold"
                        sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
                      >
                        Start Date:
                      </SoftTypography>
                      <SoftTypography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.875rem", fontWeight: "400" }}
                      >
                        {accommodation.startDate ? formatDateOnly(accommodation.startDate) : "Text"}
                      </SoftTypography>
                    </SoftBox>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <SoftBox>
                      <SoftTypography
                        variant="body2"
                        color="dark"
                        fontWeight="bold"
                        sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
                      >
                        Duration (weeks):
                      </SoftTypography>
                      <SoftTypography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.875rem", fontWeight: "400" }}
                      >
                        {accommodation.duration || "Text"}
                      </SoftTypography>
                    </SoftBox>
                  </Grid>
                </Grid>
              </SoftBox>
            )}
          </SoftBox>
        )}
      </SoftBox>
    </Card>
  );
}

AccommodationsSection.propTypes = {
  accommodation: PropTypes.object,
  accommodations: PropTypes.array,
  isLoadingAccommodations: PropTypes.bool,
  isEditMode: PropTypes.bool,
  onAccommodationChange: PropTypes.func,
  onAddAccommodation: PropTypes.func,
  courseStartDate: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  courseDurationWeeks: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  currency: PropTypes.string,
};

export default AccommodationsSection;
