import PropTypes from "prop-types";
import { IconButton, Icon } from "@mui/material";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SoftDatePicker from "components/SoftDatePicker";
import SoftSelect from "components/SoftSelect";
import { COLOR_OPTIONS } from "../constants";

function DatesSection({
  dates,
  isViewMode,
  canEdit,
  isSubmitting,
  onDateChange,
  onAddDate,
  onRemoveDate,
  error,
}) {
  return (
    <SoftBox mb={3}>
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <SoftTypography variant="h6" fontWeight="medium">
          Package Dates*
        </SoftTypography>
        {!isViewMode && (
          <SoftButton variant="outlined" color="info" size="small" onClick={onAddDate}>
            + Add Date
          </SoftButton>
        )}
      </SoftBox>

      {dates.map((date, index) => (
        <SoftBox key={index} mb={2} p={2} bgcolor="grey.50" borderRadius="lg">
          <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <SoftTypography variant="caption" fontWeight="bold">
              Date #{index + 1}
            </SoftTypography>
            {!isViewMode && dates.length > 1 && (
              <IconButton size="small" onClick={() => onRemoveDate(index)}>
                <Icon fontSize="small">delete</Icon>
              </IconButton>
            )}
          </SoftBox>

          <SoftBox display="flex" gap={2} flexWrap="wrap">
            <SoftBox flex={1} minWidth="150px">
              <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                Start Date*
              </SoftTypography>
              <SoftDatePicker
                value={date.startDate}
                onChange={(d) => onDateChange(index, "startDate", d[0])}
                disabled={isViewMode || !canEdit || isSubmitting}
                options={{ dateFormat: "Y-m-d" }}
                input={{ placeholder: "Select date" }}
              />
            </SoftBox>

            <SoftBox flex={1} minWidth="150px">
              <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                Duration (weeks)*
              </SoftTypography>
              <SoftInput
                type="number"
                value={date.duration}
                onChange={(e) => onDateChange(index, "duration", e.target.value)}
                disabled={isViewMode || !canEdit || isSubmitting}
                placeholder="Weeks"
              />
            </SoftBox>

            <SoftBox flex={1} minWidth="150px">
              <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                Accommodation (weeks)
              </SoftTypography>
              <SoftInput
                type="number"
                value={date.accommodationDuration || ""}
                onChange={(e) => onDateChange(index, "accommodationDuration", e.target.value)}
                disabled={isViewMode || !canEdit || isSubmitting}
                placeholder="Defaults to package duration"
                inputProps={{ min: 1, step: 1 }}
              />
            </SoftBox>

            <SoftBox flex={1} minWidth="150px">
              <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                Tag
              </SoftTypography>
              <SoftInput
                value={date.tag}
                onChange={(e) => onDateChange(index, "tag", e.target.value)}
                disabled={isViewMode || !canEdit || isSubmitting}
                placeholder="e.g., Summer Start"
              />
            </SoftBox>

            <SoftBox flex={1} minWidth="150px">
              <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                Color
              </SoftTypography>
              <SoftSelect
                value={COLOR_OPTIONS.find((c) => c.value === date.color)}
                onChange={(option) => onDateChange(index, "color", option?.value || "navy")}
                options={COLOR_OPTIONS}
                isDisabled={isViewMode || !canEdit || isSubmitting}
              />
            </SoftBox>
          </SoftBox>
        </SoftBox>
      ))}

      {error && (
        <SoftTypography variant="caption" color="error" sx={{ mt: 1, ml: 2, display: "block" }}>
          {error}
        </SoftTypography>
      )}
    </SoftBox>
  );
}

DatesSection.propTypes = {
  dates: PropTypes.array.isRequired,
  isViewMode: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onDateChange: PropTypes.func.isRequired,
  onAddDate: PropTypes.func.isRequired,
  onRemoveDate: PropTypes.func.isRequired,
  error: PropTypes.string,
};

export default DatesSection;
