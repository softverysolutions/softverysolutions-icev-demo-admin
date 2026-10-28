import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";

import { CURRENCY_ORDER } from "../../constants";
import { CountryService } from "services/countryService";
import { CityService } from "services/cityService";
import { useCurrencySelect } from "context/CurrencyContext";

function BasicInformation({
  formData,
  onInputChange,
  disabled = false,
  setLoading,
  isLoading: isLoadingState,
}) {
  const currencySelect = useCurrencySelect(CURRENCY_ORDER);
  const [countries, setCountries] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [filteredCities, setFilteredCities] = useState([]);

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

  useEffect(() => {
    const loadAllCities = async () => {
      try {
        setLoading("cities", true);
        const citiesList = await CityService.getAllCities();
        setAllCities(citiesList);
      } catch (error) {
        console.error("Error loading cities:", error);
        alert(`Failed to load cities: ${error.message}`);
      } finally {
        setLoading("cities", false);
      }
    };

    loadAllCities();
  }, [setLoading]);

  useEffect(() => {
    if (formData.countryId && allCities.length > 0) {
      const filtered = allCities.filter((city) => city.country?.id === formData.countryId);
      setFilteredCities(filtered);
    } else {
      setFilteredCities([]);
    }
  }, [formData.countryId, allCities]);

  const countryOptions = countries.map((country) => ({
    value: country.id,
    label: country.name,
  }));

  const cityOptions = filteredCities.map((city) => ({
    value: city.id,
    label: city.name,
  }));

  return (
    <>
      <SoftBox mb={2}>
        <SoftTypography variant="h6" fontWeight="medium">
          Basic Information
        </SoftTypography>
      </SoftBox>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SoftBox mb={2} display="flex" alignItems="flex-start" gap={2} flexWrap="wrap">
            <SoftBox flex="1" minWidth={120}>
              <SoftTypography component="label" variant="caption" fontWeight="bold">
                Location Name *
              </SoftTypography>
              <SoftInput
                placeholder="Location Name"
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
                    Active Location
                  </SoftTypography>
                }
                labelPlacement="start"
              />
            </SoftBox>
          </SoftBox>

          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Country *
            </SoftTypography>
            <SoftSelect
              value={countryOptions.find((option) => option.value === formData.countryId) || null}
              onChange={(selectedOption) => {
                onInputChange("countryId", selectedOption?.value || "");
                onInputChange("cityId", "");
              }}
              options={countryOptions}
              isDisabled={disabled || isLoadingState("countries")}
              placeholder={isLoadingState("countries") ? "Loading countries..." : "Select country"}
            />
          </SoftBox>

          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              City *
            </SoftTypography>
            <SoftSelect
              value={cityOptions.find((option) => option.value === formData.cityId) || null}
              onChange={(selectedOption) => onInputChange("cityId", selectedOption?.value || "")}
              options={cityOptions}
              isDisabled={disabled || isLoadingState("cities") || !formData.countryId}
              placeholder={
                !formData.countryId
                  ? "Select country first"
                  : isLoadingState("cities")
                  ? "Loading cities..."
                  : `Select city (${filteredCities.length} available)`
              }
            />
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Currency *
            </SoftTypography>
            <SoftSelect
              value={currencySelect.toOption(formData.currency)}
              onChange={(selectedOption) =>
                onInputChange("currency", selectedOption?.value || selectedOption)
              }
              options={currencySelect.options}
              isLoading={currencySelect.isLoading}
              loadingMessage={currencySelect.loadingMessage}
              onMenuOpen={currencySelect.onMenuOpen}
              isDisabled={disabled}
            />
          </SoftBox>

          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Address *
            </SoftTypography>
            <SoftInput
              placeholder="Address"
              value={formData.address}
              onChange={(e) => onInputChange("address", e.target.value)}
              disabled={disabled}
            />
          </SoftBox>

          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Average Rating
            </SoftTypography>
            <SoftInput
              type="number"
              placeholder="Average rating (1-5)"
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
              }}
              inputProps={{
                min: 0,
                max: 5,
                step: 0.1,
              }}
              disabled={disabled}
            />
          </SoftBox>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Latitude
            </SoftTypography>
            <SoftInput
              placeholder="Latitude"
              value={formData.lat}
              onChange={(e) => onInputChange("lat", e.target.value)}
              disabled={disabled}
            />
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Longitude
            </SoftTypography>
            <SoftInput
              placeholder="Longitude"
              value={formData.lon}
              onChange={(e) => onInputChange("lon", e.target.value)}
              disabled={disabled}
            />
          </SoftBox>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Website
            </SoftTypography>
            <SoftInput
              placeholder="Website URL"
              value={formData.website}
              onChange={(e) => onInputChange("website", e.target.value)}
              disabled={disabled}
            />
          </SoftBox>
        </Grid>

      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Average Participants per Class *
            </SoftTypography>
            <SoftInput
              type="number"
              placeholder="Average participants per class"
              value={formData.avgStudentsPerClass}
              onChange={(e) =>
                onInputChange(
                  "avgStudentsPerClass",
                  e.target.value === "" ? "" : parseInt(e.target.value)
                )
              }
              disabled={disabled}
            />
          </SoftBox>
        </Grid>
        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Number of Participants
            </SoftTypography>
            <SoftInput
              type="text"
              placeholder="Number of participants"
              value={formData.numberOfStudents ?? ""}
              onChange={(e) => {
                const digitsOnly = String(e.target.value || "").replace(/\D/g, "");
                onInputChange("numberOfStudents", digitsOnly);
              }}
              inputProps={{ inputMode: "numeric", autoComplete: "off" }}
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
