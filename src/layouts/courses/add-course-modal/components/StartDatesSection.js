import PropTypes from "prop-types";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Checkbox from "@mui/material/Checkbox";
import Icon from "@mui/material/Icon";
import ErrorIcon from "@mui/icons-material/Error";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";
import SoftButton from "components/SoftButton";
import SoftDatePicker from "components/SoftDatePicker";
import FormFieldError from "components/FormFieldError";

import {
  START_DATES_TYPES,
  START_DATES_PATTERN_OPTIONS,
  DAYS_OF_WEEK,
  suggestedCohortDates,
} from "../constants";
import { formatDateToUTC } from "utils/dateUtils";

function StartDatesSection({
  formData,
  onInputChange,
  disabled = false,
  errors = {},
  clearFieldErrorOnChange,
}) {
  const handleAddManualDate = () => {
    const newDates = [...(formData.manualDates || []), ""];
    onInputChange("manualDates", newDates);
  };

  const handleRemoveManualDate = (index) => {
    const newDates = formData.manualDates.filter((_, i) => i !== index);
    onInputChange("manualDates", newDates);
  };

  const handleManualDateChange = (index, selectedDates) => {
    const newDates = [...(formData.manualDates || [])];
    if (selectedDates && selectedDates.length > 0) {
      const selectedDate = selectedDates[0];
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const localDateString = `${year}-${month}-${day}`;

      newDates[index] = localDateString;
    } else {
      newDates[index] = "";
    }
    onInputChange("manualDates", newDates);
  };

  const handleDaysOfWeekChange = (day, checked) => {
    const currentDays = formData.selectedDaysOfWeek || [];
    let newDays;

    if (checked) {
      newDays = [...currentDays, day];
    } else {
      newDays = currentDays.filter((d) => d !== day);
    }

    onInputChange("selectedDaysOfWeek", newDays);
  };

  const handlePatternStartDateChange = (selectedDates) => {
    if (selectedDates && selectedDates.length > 0) {
      const selectedDate = selectedDates[0];
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
      const day = String(selectedDate.getDate()).padStart(2, "0");
      const localDateString = `${year}-${month}-${day}`;

      onInputChange("coursePatternStartDate", localDateString);
    } else {
      onInputChange("coursePatternStartDate", "");
    }
  };

  const getPlaceholder = () => {
    if (formData.startDatesPattern === "days-of-week") {
      return "Enter the day(s) a participant can start in a week: (separate by comma if there are more than one)";
    }
    return "";
  };

  return (
    <>
      <SoftBox display="flex" alignItems="center" mb={2}>
        <SoftTypography variant="h6" fontWeight="medium">
          START DATES
        </SoftTypography>
        {errors.startDatesPattern && (
          <>
            <ErrorIcon color="error" sx={{ ml: 1, fontSize: 20 }} />
            <FormFieldError error={errors.startDatesPattern?.[0]} sx={{ ml: 1, mb: 0 }} />
          </>
        )}
      </SoftBox>

      <SoftBox mb={3}>
        <RadioGroup
          value={formData.startDates}
          onChange={(e) => {
            onInputChange("startDates", e.target.value);
            clearFieldErrorOnChange?.("startDatesPattern");
          }}
          row
          sx={{ gap: 4 }}
        >
          {START_DATES_TYPES.map((type) => (
            <FormControlLabel
              key={type.value}
              value={type.value}
              control={<Radio disabled={disabled} />}
              label={type.label}
              sx={{
                margin: 0,
                "&:not(:last-child)": {
                  marginRight: 4,
                },
              }}
            />
          ))}
        </RadioGroup>
      </SoftBox>

      {formData.startDates === "Manually" && (
        <SoftBox>
          <SoftBox display="flex" alignItems="center" gap={2} mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Cohort start dates
            </SoftTypography>
            <SoftButton
              variant="outlined"
              color="info"
              size="small"
              onClick={() => onInputChange("manualDates", suggestedCohortDates())}
              disabled={disabled}
              startIcon={<Icon>event_repeat</Icon>}
            >
              EVERY 6 WEEKS
            </SoftButton>
            <SoftButton
              variant="gradient"
              color="info"
              size="small"
              onClick={handleAddManualDate}
              disabled={disabled}
              startIcon={<Icon>add</Icon>}
            >
              ADD DATE
            </SoftButton>
          </SoftBox>

          {(formData.manualDates || []).map((date, index) => (
            <SoftBox key={index} display="flex" gap={2} mb={2} alignItems="flex-end">
              <SoftBox flex={1}>
                <SoftDatePicker
                  value={date}
                  onChange={(value) => handleManualDateChange(index, value)}
                  disabled={disabled}
                  placeholder="Select start date"
                  options={{
                    dateFormat: "Y-m-d",
                    enableTime: false,
                  }}
                />
              </SoftBox>
              <SoftButton
                variant="gradient"
                color="error"
                size="small"
                onClick={() => handleRemoveManualDate(index)}
                disabled={disabled}
                startIcon={<Icon>remove</Icon>}
              >
                Remove
              </SoftButton>
            </SoftBox>
          ))}
        </SoftBox>
      )}

      {formData.startDates === "Pattern" && (
        <SoftBox>
          <SoftBox mb={3}>
            <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
              Set start dates by:
            </SoftTypography>
            <SoftSelect
              value={
                START_DATES_PATTERN_OPTIONS.find(
                  (option) => option.value === formData.startDatesPattern
                ) || null
              }
              onChange={(selectedOption) => {
                onInputChange("startDatesPattern", selectedOption?.value);
                clearFieldErrorOnChange?.("startDatesPattern");
              }}
              options={START_DATES_PATTERN_OPTIONS}
              isDisabled={disabled}
              placeholder="Select pattern type"
            />
          </SoftBox>

          {formData.startDatesPattern === "days-of-week" && (
            <SoftBox>
              <SoftTypography component="label" variant="caption" fontWeight="bold" mb={2}>
                Days of the Week
              </SoftTypography>
              <SoftBox display="flex" gap={3} flexWrap="wrap">
                {DAYS_OF_WEEK.map((day) => (
                  <FormControlLabel
                    key={day.value}
                    control={
                      <Checkbox
                        checked={(formData.selectedDaysOfWeek || []).includes(day.value)}
                        onChange={(e) => handleDaysOfWeekChange(day.value, e.target.checked)}
                        disabled={disabled}
                      />
                    }
                    label={day.label}
                    sx={{ margin: 0, marginRight: 1 }}
                  />
                ))}
              </SoftBox>

              <SoftBox mt={3}>
                <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                  Repeat every:
                </SoftTypography>
                <SoftBox display="flex" alignItems="center" gap={1}>
                  <SoftInput
                    placeholder="Enter number of weeks"
                    value={formData.repeatEveryWeeks || ""}
                    onChange={(e) => onInputChange("repeatEveryWeeks", e.target.value)}
                    disabled={disabled}
                    type="number"
                    min="1"
                    sx={{ width: "200px" }}
                  />
                  <SoftTypography component="span" variant="caption" fontWeight="bold">
                    weeks
                  </SoftTypography>
                </SoftBox>
              </SoftBox>

              <SoftBox mt={3}>
                <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
                  Pattern Start Date *
                </SoftTypography>
                <SoftDatePicker
                  value={formData.coursePatternStartDate ? formData.coursePatternStartDate : null}
                  onChange={(date) => {
                    handlePatternStartDateChange(date);
                    clearFieldErrorOnChange?.("coursePatternStartDate");
                  }}
                  disabled={disabled}
                  placeholder="Select pattern start date"
                  error={Boolean(errors.coursePatternStartDate)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&.Mui-error": {
                        borderColor: "error.main",
                      },
                    },
                  }}
                  options={{
                    dateFormat: "Y-m-d",
                    enableTime: false,
                  }}
                />
                <FormFieldError error={errors.coursePatternStartDate?.[0]} />
              </SoftBox>
            </SoftBox>
          )}
        </SoftBox>
      )}
    </>
  );
}

StartDatesSection.propTypes = {
  formData: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  errors: PropTypes.object,
  clearFieldErrorOnChange: PropTypes.func,
};

export default StartDatesSection;
