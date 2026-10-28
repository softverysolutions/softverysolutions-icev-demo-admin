import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import Chip from "@mui/material/Chip";
import ErrorIcon from "@mui/icons-material/Error";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftTimePicker from "components/SoftTimePicker";
import SoftButton from "components/SoftButton";
import FormFieldError from "components/FormFieldError";

function ScheduleSection({
  formData,
  onInputChange,
  disabled = false,
  errors = {},
  clearFieldErrorOnChange,
}) {
  const handleAddSchedule = () => {
    if (formData.schedule?.startTime && formData.schedule?.endTime) {
      const newEntry = {
        id: Date.now(),
        startTime: formData.schedule.startTime,
        endTime: formData.schedule.endTime,
      };
      onInputChange("scheduleEntries", [newEntry]);
      onInputChange("schedule", { startTime: "", endTime: "" });
      clearFieldErrorOnChange?.("schedule");
    }
  };

  const handleRemoveSchedule = (id) => {
    const newEntries = formData.scheduleEntries.filter((entry) => entry.id !== id);
    onInputChange("scheduleEntries", newEntries);
    clearFieldErrorOnChange?.("schedule");
  };

  return (
    <>
      <SoftBox display="flex" alignItems="center" mb={2}>
        <SoftTypography variant="h6" fontWeight="medium">
          CLASS SCHEDULE (start time / end time)
        </SoftTypography>
        {(() => {
          const hasEntries = formData.scheduleEntries && formData.scheduleEntries.length > 0;
          const hasFieldData = formData.schedule?.startTime && formData.schedule?.endTime;
          const shouldShowError = errors.schedule && (!hasEntries || (hasFieldData && !hasEntries));

          return shouldShowError ? (
            <>
              <ErrorIcon color="error" sx={{ ml: 1, fontSize: 20 }} />
              <FormFieldError error={errors.schedule[0]} sx={{ ml: 1, mb: 0 }} />
            </>
          ) : null;
        })()}
      </SoftBox>

      <SoftBox display="flex" gap={2} alignItems="center" mb={2}>
        <SoftBox flex={1}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Start Time *
          </SoftTypography>
          <SoftTimePicker
            value={formData.schedule?.startTime || ""}
            onChange={(e) =>
              onInputChange("schedule", {
                ...formData.schedule,
                startTime: e.target.value,
              })
            }
            disabled={disabled}
            placeholder="Select start time"
          />
        </SoftBox>
        <SoftBox flex={1}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            End Time *
          </SoftTypography>
          <SoftTimePicker
            value={formData.schedule?.endTime || ""}
            onChange={(e) =>
              onInputChange("schedule", {
                ...formData.schedule,
                endTime: e.target.value,
              })
            }
            disabled={disabled}
            placeholder="Select end time"
          />
        </SoftBox>
        <SoftBox display="flex" alignItems="center" sx={{ mt: 3 }}>
          <SoftButton
            variant="gradient"
            color="info"
            size="small"
            onClick={handleAddSchedule}
            disabled={disabled || !formData.schedule?.startTime || !formData.schedule?.endTime}
            startIcon={<Icon>add</Icon>}
          >
            ADD
          </SoftButton>
        </SoftBox>
      </SoftBox>

      {(formData.scheduleEntries || []).length > 0 && (
        <SoftBox>
          <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
            Added Schedules:
          </SoftTypography>
          <SoftBox display="flex" gap={1} flexWrap="wrap">
            {formData.scheduleEntries.map((entry) => (
              <Chip
                key={entry.id}
                label={`${entry.startTime} - ${entry.endTime}`}
                onDelete={() => handleRemoveSchedule(entry.id)}
                color="info"
                variant="outlined"
                sx={{ mb: 1 }}
              />
            ))}
          </SoftBox>
        </SoftBox>
      )}
    </>
  );
}

ScheduleSection.propTypes = {
  formData: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  errors: PropTypes.object,
  clearFieldErrorOnChange: PropTypes.func,
};

export default ScheduleSection;
