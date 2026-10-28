import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";

import {
  CATEGORY_OPTIONS,
  ROOM_TYPE_OPTIONS,
  BATHROOM_OPTIONS,
  REGIME_OPTIONS,
  CURRENCY_ORDER,
} from "../../constants";
import { CityService } from "services/cityService";
import { SchoolService } from "services/schoolService";
import { CampusService } from "services/campusService";
import { useCurrencySelect } from "context/CurrencyContext";

function BasicInformation({
  formData,
  onInputChange,
  disabled = false,
  schoolId,
  setLoading,
  isLoading,
}) {
  const currencySelect = useCurrencySelect(CURRENCY_ORDER);
  const [cities, setCities] = useState([]);
  const [schools, setSchools] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [isLoadingCampuses, setIsLoadingCampuses] = useState(false);

  useEffect(() => {
    const loadCities = async () => {
      try {
        setLoading("cities", true);
        const citiesData = await CityService.getCities();
        setCities(Array.isArray(citiesData) ? citiesData : []);
      } catch (error) {
        console.error("Error loading cities:", error);
        alert(`Failed to load cities: ${error.message}`);
      } finally {
        setLoading("cities", false);
      }
    };

    const loadSchools = async () => {
      try {
        setIsLoadingSchools(true);
        const schoolsData = await SchoolService.getSchools();
        setSchools(Array.isArray(schoolsData) ? schoolsData : []);
      } catch (error) {
        console.error("Error loading schools:", error);
        alert(`Failed to load schools: ${error.message}`);
      } finally {
        setIsLoadingSchools(false);
      }
    };

    loadCities();
    loadSchools();
  }, [setLoading]);

  useEffect(() => {
    const loadCampuses = async () => {
      try {
        setLoading("campuses", true);
        const allCampuses = await CampusService.getAllCampuses();
        setCampuses(allCampuses);
      } catch (error) {
        console.error("Error loading campuses:", error);
        setCampuses([]);
      } finally {
        setLoading("campuses", false);
      }
    };

    loadCampuses();
  }, [setLoading]);

  useEffect(() => {
    if (
      campuses.length > 0 &&
      formData.campusIds &&
      formData.campusIds.length > 0 &&
      !formData.schoolId
    ) {
      const firstCampusId = formData.campusIds[0];
      const selectedCampus = campuses.find((c) => c.id === firstCampusId);
      if (selectedCampus && selectedCampus.schoolId) {
        onInputChange("schoolId", selectedCampus.schoolId);
      }
    }
  }, [campuses, formData.campusIds, formData.schoolId, onInputChange]);

  const cityOptions = cities.map((city) => ({
    value: city.id,
    label: city.name,
  }));

  const schoolOptions = schools.map((school) => ({
    value: school.id,
    label: school.name,
  }));

  const handleCampusChange = (selectedOptions) => {
    const campusIds = selectedOptions ? selectedOptions.map((option) => option.value) : [];
    onInputChange("campusIds", campusIds);

    if (campusIds.length > 0) {
      const firstCampusId = campusIds[0];
      const selectedCampus = campuses.find((c) => c.id === firstCampusId);
      if (selectedCampus && selectedCampus.schoolId) {
        onInputChange("schoolId", selectedCampus.schoolId);
      }
    } else if (campusIds.length === 0) {
      if (!schoolId) {
        onInputChange("schoolId", "");
      }
    }
  };

  const getSelectedCampuses = () => {
    if (!formData.campusIds || formData.campusIds.length === 0) return [];

    return formData.campusIds
      .filter((campusId) => campuses.some((campus) => campus.id === campusId))
      .map((campusId) => {
        const campus = campuses.find((c) => c.id === campusId);
        const city = cities.find((c) => c.id === campus.cityId);
        const cityName = city ? city.name : "Unknown City";

        return {
          value: campus.id,
          label: `${campus.name} (${cityName})`,
        };
      });
  };

  const getCampusOptions = () => {
    if (!formData.cityId) {
      return [];
    }

    return campuses
      .filter((campus) => campus.cityId === formData.cityId)
      .map((campus) => {
        const city = cities.find((c) => c.id === campus.cityId);
        const cityName = city ? city.name : "Unknown City";

        return {
          value: campus.id,
          label: `${campus.name} (${cityName})`,
        };
      });
  };

  return (
    <>
      <SoftBox mb={2}>
        <SoftTypography variant="h6" fontWeight="medium">
          Basic Information
        </SoftTypography>
      </SoftBox>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SoftBox mb={2} display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <SoftBox flex="1" minWidth={120}>
              <SoftTypography component="label" variant="caption" fontWeight="bold">
                Name *
              </SoftTypography>
              <SoftInput
                placeholder="Accommodation name"
                value={formData.name}
                onChange={(e) => onInputChange("name", e.target.value)}
                disabled={disabled}
              />
            </SoftBox>
            <SoftBox display="flex" alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive !== undefined ? formData.isActive : true}
                    onChange={(e) => onInputChange("isActive", e.target.checked)}
                    disabled={disabled}
                  />
                }
                label={
                  <SoftTypography variant="button" fontWeight="regular" sx={{}}>
                    Active
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
              City *
            </SoftTypography>
            <SoftSelect
              value={cityOptions.find((option) => option.value === formData.cityId) || null}
              onChange={(selectedOption) => onInputChange("cityId", selectedOption?.value || "")}
              options={cityOptions}
              isDisabled={disabled || isLoadingCities}
              placeholder={isLoadingCities ? "Loading cities..." : "Select city"}
            />
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Locations
            </SoftTypography>
            <SoftSelect
              value={getSelectedCampuses()}
              onChange={handleCampusChange}
              options={getCampusOptions()}
              isMulti
              isDisabled={disabled || isLoadingCampuses || !formData.cityId}
              placeholder={
                !formData.cityId
                  ? "Please select a city first"
                  : isLoadingCampuses
                  ? "Loading locations..."
                  : getCampusOptions().length === 0
                  ? "No locations available for this city"
                  : "Select locations (multiple selection)"
              }
              noOptionsMessage={() =>
                !formData.cityId
                  ? "Please select a city first"
                  : isLoadingCampuses
                  ? "Loading..."
                  : "No locations available for this city"
              }
            />
            <SoftTypography variant="caption" color="text" sx={{ mt: 1, display: "block" }}>
              {!formData.cityId
                ? "Select a city to see available locations."
                : "Choose locations from the selected city. Previously selected locations from other cities will be preserved."}
            </SoftTypography>
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Address *
            </SoftTypography>
            <SoftInput
              placeholder="Full address"
              value={formData.address}
              onChange={(e) => onInputChange("address", e.target.value)}
              disabled={disabled}
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
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Category *
            </SoftTypography>
            <SoftSelect
              value={CATEGORY_OPTIONS.find((option) => option.value === formData.category) || null}
              onChange={(selectedOption) =>
                onInputChange("category", selectedOption?.value || selectedOption)
              }
              options={CATEGORY_OPTIONS}
              isDisabled={disabled}
            />
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Room Type *
            </SoftTypography>
            <SoftSelect
              value={ROOM_TYPE_OPTIONS.find((option) => option.value === formData.roomType) || null}
              onChange={(selectedOption) =>
                onInputChange("roomType", selectedOption?.value || selectedOption)
              }
              options={ROOM_TYPE_OPTIONS}
              isDisabled={disabled}
            />
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Bathroom *
            </SoftTypography>
            <SoftSelect
              value={BATHROOM_OPTIONS.find((option) => option.value === formData.bathroom) || null}
              onChange={(selectedOption) =>
                onInputChange("bathroom", selectedOption?.value || selectedOption)
              }
              options={BATHROOM_OPTIONS}
              isDisabled={disabled}
            />
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Regime *
            </SoftTypography>
            <SoftSelect
              value={REGIME_OPTIONS.find((option) => option.value === formData.regime) || null}
              onChange={(selectedOption) =>
                onInputChange("regime", selectedOption?.value || selectedOption)
              }
              options={REGIME_OPTIONS}
              isDisabled={disabled}
            />
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              YouTube URL
            </SoftTypography>
            <SoftInput
              placeholder="YouTube video URL"
              value={formData.youtubeUrl}
              onChange={(e) => onInputChange("youtubeUrl", e.target.value)}
              disabled={disabled}
            />
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Age Limit (Min)
            </SoftTypography>
            <SoftInput
              type="number"
              placeholder="Min age"
              value={formData.ageLimitMin}
              onChange={(e) => onInputChange("ageLimitMin", e.target.value)}
              disabled={disabled}
            />
          </SoftBox>
        </Grid>

        <Grid item xs={12} md={6}>
          <SoftBox mb={2}>
            <SoftTypography component="label" variant="caption" fontWeight="bold">
              Age Limit (Max)
            </SoftTypography>
            <SoftInput
              type="number"
              placeholder="Max age"
              value={formData.ageLimitMax}
              onChange={(e) => onInputChange("ageLimitMax", e.target.value)}
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
  schoolId: PropTypes.string,
  setLoading: PropTypes.func,
  isLoading: PropTypes.func,
};

export default BasicInformation;
