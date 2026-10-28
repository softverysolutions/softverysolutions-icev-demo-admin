import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Switch from "@mui/material/Switch";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";
import FormFieldError from "components/FormFieldError";
import { SKILL_LEVEL_OPTIONS } from "utils/courseTypeUtils";

function BasicInformation({
  formData,
  onInputChange,
  disabled = false,
  errors = {},
  clearFieldErrorOnChange,
}) {
  return (
    <>
      <SoftBox mb={2}>
        <SoftTypography variant="h6" fontWeight="medium">
          Basic Information
        </SoftTypography>
      </SoftBox>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <SoftBox mb={2} display="flex" alignItems="flex-start" gap={2} flexWrap="wrap">
            <SoftBox flex="1" minWidth={120}>
              <SoftTypography component="label" variant="caption" fontWeight="bold">
                Programme Name *
              </SoftTypography>
              <SoftInput
                placeholder="Enter programme name"
                value={formData.name}
                onChange={(e) => {
                  onInputChange("name", e.target.value);
                  clearFieldErrorOnChange?.("name");
                }}
                disabled={disabled}
                error={Boolean(errors.name)}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    "&.Mui-error": {
                      borderColor: "error.main",
                    },
                  },
                }}
              />
              <FormFieldError error={errors.name?.[0]} />
            </SoftBox>
            <SoftBox display="flex" alignItems="center" pt={1.5}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive !== undefined ? formData.isActive : true}
                    onChange={(e) => onInputChange("isActive", e.target.checked)}
                    disabled={disabled}
                  />
                }
                label={
                  <SoftTypography variant="button" fontWeight="regular">
                    Active Programme
                  </SoftTypography>
                }
                labelPlacement="start"
              />
            </SoftBox>
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Minimum Age *
            </SoftTypography>
            <SoftInput
              type="number"
              min="0"
              placeholder="Min age (e.g., 16)"
              value={formData.minAge}
              onChange={(e) => {
                onInputChange("minAge", e.target.value);
                clearFieldErrorOnChange?.("minAge");
              }}
              disabled={disabled}
              error={Boolean(errors.minAge)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "&.Mui-error": {
                    borderColor: "error.main",
                  },
                },
              }}
            />
            <FormFieldError error={errors.minAge?.[0]} />
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Average Rating
            </SoftTypography>
            <SoftInput
              type="number"
              placeholder="Average rating (0-5)"
              value={formData.averageRating}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  onInputChange("averageRating", "");
                } else {
                  const numValue = parseFloat(value);
                  if (numValue >= 0 && numValue <= 5) {
                    onInputChange("averageRating", numValue);
                  }
                }
                clearFieldErrorOnChange?.("averageRating");
              }}
              inputProps={{
                min: 0,
                max: 5,
                step: 0.1,
              }}
              disabled={disabled}
              error={Boolean(errors.averageRating)}
            />
            <FormFieldError error={errors.averageRating?.[0]} />
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Skill level
            </SoftTypography>
            <SoftSelect
              value={SKILL_LEVEL_OPTIONS.find((o) => o.value === formData.recommendedLevel) || null}
              onChange={(option) => onInputChange("recommendedLevel", option?.value || "")}
              options={SKILL_LEVEL_OPTIONS}
              isDisabled={disabled}
              placeholder="Select skill level"
              isClearable
            />
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Class Size
            </SoftTypography>
            <SoftInput
              placeholder="e.g., 10-15 participants"
              value={formData.classSize || ""}
              onChange={(e) => {
                onInputChange("classSize", e.target.value);
                clearFieldErrorOnChange?.("classSize");
              }}
              disabled={disabled}
              error={Boolean(errors.classSize)}
            />
            <FormFieldError error={errors.classSize?.[0]} />
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Recommended For
            </SoftTypography>
            <SoftInput
              placeholder="e.g., Career changers who want a portfolio"
              value={formData.recommendedFor || ""}
              onChange={(e) => {
                onInputChange("recommendedFor", e.target.value);
                clearFieldErrorOnChange?.("recommendedFor");
              }}
              disabled={disabled}
              error={Boolean(errors.recommendedFor)}
            />
            <FormFieldError error={errors.recommendedFor?.[0]} />
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Not Recommended For
            </SoftTypography>
            <SoftInput
              placeholder="e.g., Experienced developers"
              value={formData.notRecommendedFor || ""}
              onChange={(e) => {
                onInputChange("notRecommendedFor", e.target.value);
                clearFieldErrorOnChange?.("notRecommendedFor");
              }}
              disabled={disabled}
              error={Boolean(errors.notRecommendedFor)}
            />
            <FormFieldError error={errors.notRecommendedFor?.[0]} />
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Equipment
            </SoftTypography>
            <SoftInput
              multiline
              rows={2}
              placeholder="e.g., Own laptop (8 GB RAM); board and wetsuit included"
              value={formData.equipment || ""}
              onChange={(e) => onInputChange("equipment", e.target.value)}
              disabled={disabled}
            />
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Certificate
            </SoftTypography>
            <SoftInput
              multiline
              rows={2}
              placeholder="e.g., Certificate of completion and portfolio review"
              value={formData.certificate || ""}
              onChange={(e) => onInputChange("certificate", e.target.value)}
              disabled={disabled}
            />
          </SoftBox>
        </Grid>

        <Grid item xs={12}>
          <SoftBox mb={2} ml={1.5} display="flex" gap={3}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.bestSeller || false}
                  onChange={(e) => onInputChange("bestSeller", e.target.checked)}
                  disabled={disabled}
                />
              }
              label="Best Seller"
            />
            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.isFeatured || false}
                  onChange={(e) => onInputChange("isFeatured", e.target.checked)}
                  disabled={disabled}
                />
              }
              label="Is Featured"
            />
          </SoftBox>
        </Grid>
      </Grid>
    </>
  );
}

BasicInformation.propTypes = {
  formData: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  errors: PropTypes.object,
  clearFieldErrorOnChange: PropTypes.func,
};

export default BasicInformation;
