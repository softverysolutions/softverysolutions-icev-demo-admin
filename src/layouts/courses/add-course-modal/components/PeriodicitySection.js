import PropTypes from "prop-types";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function PeriodicitySection({ formData, onInputChange, disabled = false }) {
  const periodicityOptions = [
    { value: "full-time", label: "Full time" },
    { value: "morning", label: "Morning" },
    { value: "afternoon", label: "Afternoon" },
    { value: "evening", label: "Evening" },
  ];

  const handlePeriodicityChange = (option, checked) => {
    const currentOptions = formData.periodicityOptions || [];
    let newOptions;

    if (checked) {
      newOptions = [...currentOptions, option];
    } else {
      newOptions = currentOptions.filter((opt) => opt !== option);
    }

    onInputChange("periodicityOptions", newOptions);
  };

  return (
    <>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        PERIODICITY (full time, part time)
      </SoftTypography>

      <SoftBox display="flex" gap={3} flexWrap="wrap">
        {periodicityOptions.map((option) => (
          <FormControlLabel
            key={option.value}
            control={
              <Checkbox
                checked={(formData.periodicityOptions || []).includes(option.value)}
                onChange={(e) => handlePeriodicityChange(option.value, e.target.checked)}
                disabled={disabled}
              />
            }
            label={option.label}
            sx={{ margin: 0, marginRight: 1 }}
          />
        ))}
      </SoftBox>
    </>
  );
}

PeriodicitySection.propTypes = {
  formData: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default PeriodicitySection;
