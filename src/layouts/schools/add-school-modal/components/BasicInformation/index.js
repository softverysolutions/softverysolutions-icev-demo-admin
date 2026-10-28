import { useCallback, useState, useEffect } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";
import SoftDropzone from "components/SoftDropzone";
import SoftButton from "components/SoftButton";

import { SCHOOL_TYPE_OPTIONS } from "../../constants";
import { CountryService } from "services/countryService";

function BasicInformation({
  formData,
  onInputChange,
  disabled = false,
  setLoading,
  isLoading: isLoadingState,
}) {
  const [logoError, setLogoError] = useState(false);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    const loadCountries = async () => {
      try {
        setLoading("countries", true);
        const countriesList = await CountryService.getAllCountriesList();
        setCountries(countriesList);
      } catch (error) {
        console.error("Error loading countries:", error);
        alert(`Failed to load countries: ${error.message}`);
      } finally {
        setLoading("countries", false);
      }
    };

    loadCountries();
  }, [setLoading]);

  const countryOptions = countries.map((country) => ({
    value: country.id,
    label: country.name,
  }));

  const handleLogoUpload = useCallback(
    (acceptedFiles) => {
      if (disabled || acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      const preview = URL.createObjectURL(file);
      onInputChange("logo", { file, preview });
      setLogoError(false);
    },
    [disabled, onInputChange]
  );

  const handleLogoError = useCallback(() => {
    setLogoError(true);
  }, []);

  const logoDropzoneOptions = useCallback(
    () => ({
      addRemoveLinks: true,
      maxFiles: 1,
      maxFilesize: 5, // 5MB
      acceptedFiles: "image/*",
      accept: (file, done) => {
        if (disabled) {
          done("Editing is disabled");
          return;
        }
        done();
      },
      addedfile: (file) => {
        handleLogoUpload([file]);
      },
    }),
    [disabled, handleLogoUpload]
  );

  return (
    <>
      <SoftBox mb={2}>
        <SoftTypography variant="h6" fontWeight="medium">
          Basic Information
        </SoftTypography>
      </SoftBox>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Logo *
            </SoftTypography>
            {(() => {
              const shouldShowImage =
                formData.logo &&
                !(typeof formData.logo === "string" && formData.logo.startsWith("blob:")) &&
                (formData.logo.preview || (typeof formData.logo === "string" && formData.logo)) &&
                !logoError;

              return shouldShowImage ? (
                <SoftBox>
                  <img
                    src={formData.logo.preview || formData.logo}
                    alt="Provider logo"
                    style={{
                      maxWidth: "150px",
                      maxHeight: "150px",
                      objectFit: "contain",
                      borderRadius: "8px",
                      marginBottom: "8px",
                    }}
                    onError={handleLogoError}
                  />
                  {!disabled && (
                    <SoftBox>
                      <SoftButton
                        color="error"
                        size="small"
                        onClick={() => onInputChange("logo", "")}
                      >
                        Remove Logo
                      </SoftButton>
                    </SoftBox>
                  )}
                </SoftBox>
              ) : (
                <SoftBox sx={{ height: "200px" }}>
                  <SoftDropzone options={logoDropzoneOptions()} disabled={disabled} />
                </SoftBox>
              );
            })()}
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2} display="flex" alignItems="flex-start" gap={2} flexWrap="wrap">
            <SoftBox flex="1" minWidth={120}>
              <SoftTypography component="label" variant="caption" fontWeight="bold">
                Provider Name *
              </SoftTypography>
              <SoftInput
                placeholder="Provider name"
                value={formData.name}
                onChange={(e) => onInputChange("name", e.target.value)}
                disabled={disabled}
              />
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
                    Active Provider
                  </SoftTypography>
                }
                labelPlacement="start"
              />
            </SoftBox>
          </SoftBox>

          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Type *
            </SoftTypography>
            <SoftSelect
              value={SCHOOL_TYPE_OPTIONS.find((option) => option.value === formData.type) || null}
              onChange={(selectedOption) =>
                onInputChange("type", selectedOption?.value || selectedOption)
              }
              options={SCHOOL_TYPE_OPTIONS}
              isDisabled={disabled}
            />
          </SoftBox>

          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Country *
            </SoftTypography>
            <SoftSelect
              value={countryOptions.find((option) => option.value === formData.countryId) || null}
              onChange={(selectedOption) => onInputChange("countryId", selectedOption?.value || "")}
              options={countryOptions}
              isDisabled={disabled || isLoadingState("countries")}
              placeholder={isLoadingState("countries") ? "Loading countries..." : "Select country"}
            />
          </SoftBox>

          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Contact Email *
            </SoftTypography>
            <SoftInput
              type="email"
              placeholder="hello@provider.example"
              value={formData.contactEmail}
              onChange={(e) => onInputChange("contactEmail", e.target.value)}
              disabled={disabled}
            />
          </SoftBox>

          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Contact Phone *
            </SoftTypography>
            <SoftInput
              type="tel"
              placeholder="+49 30 1234 5678"
              value={formData.contactPhone}
              onChange={(e) => onInputChange("contactPhone", e.target.value)}
              disabled={disabled}
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
  setLoading: PropTypes.func,
  isLoading: PropTypes.func,
};

export default BasicInformation;
