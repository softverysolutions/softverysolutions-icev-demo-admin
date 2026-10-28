import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";
import SoftEditor from "components/SoftEditor";

import { SERVICE_TYPES, CURRENCY_ORDER } from "../constants";
import ServiceDetailContentSection from "./ServiceDetailContentSection";
import { validateServiceDetail } from "../serviceDetailFields";
import { useCurrencySelect } from "context/CurrencyContext";

function BasicInformation({ formData, onInputChange, disabled = false, mode = "add" }) {
  const currencySelect = useCurrencySelect(CURRENCY_ORDER);
  const showActiveToggle = mode !== "view";
  const detailErrors = validateServiceDetail(formData);

  return (
    <>
      <SoftBox mb={2}>
        <SoftTypography variant="h6" fontWeight="medium">
          Basic Information
        </SoftTypography>
      </SoftBox>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Extra type *
            </SoftTypography>
            <SoftSelect
              value={SERVICE_TYPES.find((option) => option.value === formData.type) || null}
              onChange={(selectedOption) =>
                onInputChange("type", selectedOption ? selectedOption.value : "")
              }
              isDisabled={disabled}
              options={SERVICE_TYPES}
              placeholder="Select extra type"
              isClearable={false}
            />
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={4}>
          <SoftBox mb={2} display="flex" alignItems="flex-start" gap={2} flexWrap="wrap">
            <SoftBox flex="1" minWidth={120}>
              <SoftTypography component="label" variant="caption" fontWeight="bold">
                Extra name *
              </SoftTypography>
              <SoftInput
                placeholder="e.g. Laptop rental"
                value={formData.name || ""}
                onChange={(e) => onInputChange("name", e.target.value)}
                disabled={disabled}
              />
            </SoftBox>
            {showActiveToggle && (
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
                      Active
                    </SoftTypography>
                  }
                  labelPlacement="start"
                />
              </SoftBox>
            )}
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={4}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Currency *
            </SoftTypography>
            <SoftSelect
              value={currencySelect.toOption(formData.currency)}
              onChange={(selectedOption) =>
                onInputChange("currency", selectedOption?.value || "EUR")
              }
              options={currencySelect.options}
              isLoading={currencySelect.isLoading}
              loadingMessage={currencySelect.loadingMessage}
              onMenuOpen={currencySelect.onMenuOpen}
              isDisabled={disabled}
              placeholder="Select currency"
              isClearable={false}
            />
          </SoftBox>
        </Grid>

        <Grid item xs={12}>
          <SoftBox mb={1} ml={0.5} lineHeight={0} display="inline-block">
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Long description
            </SoftTypography>
          </SoftBox>
          <SoftBox sx={disabled ? { opacity: 0.6, pointerEvents: "none" } : undefined}>
            <SoftEditor
              value={formData.description || ""}
              onChange={(html) => onInputChange("description", html)}
            />
          </SoftBox>
        </Grid>

        <ServiceDetailContentSection
          formData={formData}
          onInputChange={onInputChange}
          errors={detailErrors}
          disabled={disabled}
        />
      </Grid>
    </>
  );
}

BasicInformation.propTypes = {
  formData: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  mode: PropTypes.string,
};

export default BasicInformation;
