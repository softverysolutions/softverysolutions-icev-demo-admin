import PropTypes from "prop-types";
import FormControlLabel from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftSelect from "components/SoftSelect";
import FormFieldError from "components/FormFieldError";

import { COURSE_TYPES, PROGRAMME_TYPES } from "../constants";

// One category (Tech or Sport) per programme, with one or more programme types inside it.
function CourseType({
  formData,
  onInputChange,
  disabled = false,
  errors = {},
  clearFieldErrorOnChange,
}) {
  const current = (formData.courseTypes || [])[0] || null;
  const category = current?.type || "";
  const options = PROGRAMME_TYPES[category] || [];
  const selected = options.filter((opt) => (current?.programTypes || []).includes(opt.value));

  const setCategory = (value) => {
    onInputChange("courseTypes", [{ type: value, programTypes: [] }]);
    clearFieldErrorOnChange?.("courseTypes");
  };

  const setProgrammeTypes = (selectedOptions) => {
    const values = Array.isArray(selectedOptions)
      ? selectedOptions.map((opt) => opt.value || opt)
      : selectedOptions?.value
      ? [selectedOptions.value]
      : [];
    onInputChange("courseTypes", [{ type: category, programTypes: values }]);
    clearFieldErrorOnChange?.("courseTypes");
  };

  return (
    <>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        PROGRAMME TYPE
      </SoftTypography>

      <SoftBox mb={3}>
        <RadioGroup row value={category} onChange={(e) => setCategory(e.target.value)}>
          {COURSE_TYPES.map((type) => (
            <FormControlLabel
              key={type.value}
              value={type.value}
              control={<Radio disabled={disabled} />}
              label={type.label}
              sx={{ margin: 0, mr: 4 }}
            />
          ))}
        </RadioGroup>
        <FormFieldError error={errors.courseTypes?.[0]} />
      </SoftBox>

      {category && (
        <SoftBox mb={2}>
          <SoftTypography component="label" variant="caption" fontWeight="bold">
            {category === "sport" ? "Sport" : "Tech track"} *
          </SoftTypography>
          <SoftSelect
            isMulti
            value={selected}
            onChange={setProgrammeTypes}
            options={options}
            isDisabled={disabled}
            placeholder="Select programme types"
            noOptionsMessage={() => "No programme types available"}
            error={Boolean(errors.courseTypes)}
          />
          <SoftTypography variant="caption" color="text" sx={{ mt: 1, display: "block" }}>
            {category === "sport"
              ? "Camps and coaching: surf, football, tennis, yoga & fitness, ski & snowboard."
              : "Bootcamps and courses: web, data & AI, UX/UI, cybersecurity, mobile."}
          </SoftTypography>
        </SoftBox>
      )}
    </>
  );
}

CourseType.propTypes = {
  formData: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  errors: PropTypes.object,
  clearFieldErrorOnChange: PropTypes.func,
};

export default CourseType;
