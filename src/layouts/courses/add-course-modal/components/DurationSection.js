import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import Chip from "@mui/material/Chip";
import ErrorIcon from "@mui/icons-material/Error";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";
import SoftButton from "components/SoftButton";
import FormFieldError from "components/FormFieldError";

import { DURATION_PERIODS } from "../constants";

function DurationSection({
  formData,
  onInputChange,
  disabled = false,
  errors = {},
  clearFieldErrorOnChange,
}) {
  const handleAddDuration = () => {
    if (formData.duration && formData.durationPeriod) {
      const newEntry = {
        id: Date.now(),
        duration: formData.duration,
        period: formData.durationPeriod,
        type: formData.durationType,
      };
      onInputChange("durationEntries", [newEntry]);
      onInputChange("duration", "");
      onInputChange("durationPeriod", "");
      clearFieldErrorOnChange?.("duration");
    }
  };

  const handleRemoveDuration = (id) => {
    const newEntries = formData.durationEntries.filter((entry) => entry.id !== id);
    onInputChange("durationEntries", newEntries);
  };

  const getPeriodLabel = (periodValue) => {
    const period = DURATION_PERIODS.find((p) => p.value === periodValue);
    if (!period) return periodValue;

    switch (period.value) {
      case "per-week":
        return "Per week";
      case "per-month":
        return "Per month";
      case "per-day":
        return "Per day";
      case "per-semester":
        return "Per semester";
      case "per-year":
        return "Per year";
      default:
        return period.label;
    }
  };

  return (
    <>
      <SoftBox display="flex" alignItems="center" mb={2}>
        <SoftTypography variant="h6" fontWeight="medium">
          HOURS PER WEEK
        </SoftTypography>
        {(() => {
          const hasEntries = formData.durationEntries && formData.durationEntries.length > 0;
          const shouldShowError = errors.duration && !hasEntries;

          return shouldShowError ? (
            <>
              <ErrorIcon color="error" sx={{ ml: 1, fontSize: 20 }} />
              <FormFieldError error={errors.duration[0]} sx={{ ml: 1, mb: 0 }} />
            </>
          ) : null;
        })()}
      </SoftBox>

      <SoftBox display="flex" gap={2} alignItems="center" mb={2}>
        <SoftBox flex={1}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Hours *
          </SoftTypography>
          <SoftInput
            type="number"
            placeholder="e.g., 40"
            value={formData.duration || ""}
            onChange={(e) => {
              onInputChange("duration", e.target.value);
              clearFieldErrorOnChange?.("duration");
            }}
            disabled={disabled}
            error={
              Boolean(errors.duration) &&
              !(formData.durationEntries && formData.durationEntries.length > 0)
            }
          />
          <FormFieldError
            error={
              errors.duration?.[0] &&
              !(formData.durationEntries && formData.durationEntries.length > 0)
                ? errors.duration[0]
                : null
            }
          />
        </SoftBox>
        <SoftBox flex={1}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            Per *
          </SoftTypography>
          <SoftSelect
            value={
              DURATION_PERIODS.find((option) => option.value === formData.durationPeriod) || null
            }
            onChange={(selectedOption) => {
              onInputChange("durationPeriod", selectedOption?.value || selectedOption);
              clearFieldErrorOnChange?.("duration");
            }}
            options={DURATION_PERIODS}
            isDisabled={disabled}
            placeholder="Select period"
          />
          <FormFieldError
            error={
              errors.duration?.[0] &&
              !(formData.durationEntries && formData.durationEntries.length > 0)
                ? " "
                : null
            }
            sx={{
              minHeight:
                errors.duration?.[0] &&
                !(formData.durationEntries && formData.durationEntries.length > 0)
                  ? "20px"
                  : "0px",
              visibility: "hidden",
            }}
          />
        </SoftBox>
        <SoftBox display="flex" alignItems="center" sx={{ mt: 3 }}>
          <SoftButton
            variant="gradient"
            color="info"
            size="small"
            onClick={handleAddDuration}
            disabled={disabled || !formData.duration || !formData.durationPeriod}
            startIcon={<Icon>add</Icon>}
          >
            ADD
          </SoftButton>
        </SoftBox>
      </SoftBox>

      {(formData.durationEntries || []).length > 0 && (
        <SoftBox>
          <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
            Added Durations:
          </SoftTypography>
          <SoftBox display="flex" gap={1} flexWrap="wrap">
            {formData.durationEntries.map((entry) => (
              <Chip
                key={entry.id}
                label={`${entry.duration} ${entry.type} ${getPeriodLabel(entry.period)}`}
                onDelete={() => handleRemoveDuration(entry.id)}
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

DurationSection.propTypes = {
  formData: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  errors: PropTypes.object,
  clearFieldErrorOnChange: PropTypes.func,
};

export default DurationSection;
