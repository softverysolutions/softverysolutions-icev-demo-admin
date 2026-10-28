import { useState, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";
import SoftButton from "components/SoftButton";

import { ALL_PROGRAMME_TYPES } from "utils/courseTypeUtils";

const PROGRAM_TYPE_OPTIONS = ALL_PROGRAMME_TYPES;

function CourseFilters({ 
  filters, 
  onFiltersChange, 
  onApplyFilters, 
  onResetFilters,
  availableCountries = [],
  availableSchools = [],
  availableCampuses = [],
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showCampusMessage, setShowCampusMessage] = useState(false);

  const countries = availableCountries;
  const schools = availableSchools
    .filter((school) => {
      if (!filters.countryIds || filters.countryIds.length === 0) {
        return true;
      }
      return school.countryId && filters.countryIds.includes(school.countryId);
    })
    .map((school) => ({
      value: school.id,
      label: school.name,
    }));

  const campuses = availableCampuses
    .filter((campus) => {
      if (!filters.schoolIds || filters.schoolIds.length === 0) {
        return false;
      }
      return campus.schoolId && filters.schoolIds.includes(campus.schoolId);
    })
    .map((campus) => ({
      value: campus.id,
      label: campus.name,
    }));

  const countryOptions = countries.map((country) => ({
    value: country.id,
    label: country.name,
  }));

  const schoolOptions = schools.map((school) => ({
    value: school.value,
    label: school.label,
  }));

  const campusOptions = campuses.map((campus) => ({
    value: campus.value,
    label: campus.label,
  }));

  const programTypeOptions = PROGRAM_TYPE_OPTIONS.map((type) => ({
    value: type.value,
    label: type.label,
  }));

  const handleFilterChange = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <SoftBox mb={3}>
      <SoftBox
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        onClick={() => setIsExpanded(!isExpanded)}
        sx={{ cursor: "pointer" }}
      >
        <SoftTypography variant="h6" fontWeight="medium">
          Filters
        </SoftTypography>
        <IconButton size="small">
          <Icon>{isExpanded ? "expand_less" : "expand_more"}</Icon>
        </IconButton>
      </SoftBox>

      <Collapse in={isExpanded}>
        <SoftBox mt={2}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <SoftBox mb={2}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Country
                </SoftTypography>
                <SoftSelect
                  value={countryOptions.filter((opt) => filters.countryIds?.includes(opt.value))}
                  onChange={(selected) => {
                    const values = selected
                      ? (Array.isArray(selected) ? selected : [selected]).map((s) => s.value)
                      : [];
                    handleFilterChange("countryIds", values);
                  }}
                  options={countryOptions}
                  isMulti
                  isClearable
                  isLoading={false}
                  placeholder="Select countries"
                />
              </SoftBox>
            </Grid>

            <Grid item xs={12} md={6}>
              <SoftBox mb={2}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Provider
                </SoftTypography>
                <SoftSelect
                  value={schoolOptions.filter((opt) => filters.schoolIds?.includes(opt.value))}
                  onChange={(selected) => {
                    const values = selected
                      ? (Array.isArray(selected) ? selected : [selected]).map((s) => s.value)
                      : [];
                    handleFilterChange("schoolIds", values);
                  }}
                  options={schoolOptions}
                  isMulti
                  isClearable
                  isLoading={false}
                  placeholder="Select providers"
                />
              </SoftBox>
            </Grid>

            <Grid item xs={12} md={6}>
              <SoftBox mb={2}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Location
                </SoftTypography>
                <SoftBox
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    "& .react-select__menu": {
                      zIndex: 9999,
                    },
                  }}
                >
                  <SoftSelect
                    value={
                      filters.campusIds && filters.campusIds.length > 0
                        ? campusOptions.filter((opt) => filters.campusIds.includes(opt.value))
                        : null
                    }
                    onChange={(selected) => {
                      const values = selected
                        ? (Array.isArray(selected) ? selected : [selected]).map((s) => s.value)
                        : [];
                      handleFilterChange("campusIds", values);
                    }}
                    onMenuOpen={() => {
                      if (!filters.schoolIds || filters.schoolIds.length === 0) {
                        setShowCampusMessage(true);
                      }
                    }}
                    options={campusOptions}
                    isMulti
                    isClearable
                    isLoading={false}
                    isDisabled={!filters.schoolIds || filters.schoolIds.length === 0}
                    isSearchable={true}
                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                    menuPosition="fixed"
                    menuPlacement="auto"
                    placeholder={
                      !filters.schoolIds || filters.schoolIds.length === 0
                        ? "Select providers first"
                        : campusOptions.length === 0
                        ? "No locations available"
                        : "Select locations"
                    }
                    noOptionsMessage={() => "No locations found"}
                  />
                </SoftBox>
                {showCampusMessage && (!filters.schoolIds || filters.schoolIds.length === 0) ? (
                  <SoftTypography variant="caption" color="info" sx={{ mt: 0.5, display: "block" }}>
                    Please select providers first to enable location selection
                  </SoftTypography>
                ) : campusOptions.length === 0 &&
                  filters.schoolIds &&
                  filters.schoolIds.length > 0 ? (
                  <SoftTypography variant="caption" color="text" sx={{ mt: 0.5, display: "block" }}>
                    No locations available for selected providers
                  </SoftTypography>
                ) : null}
              </SoftBox>
            </Grid>

            <Grid item xs={12} md={6}>
              <SoftBox mb={2}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Programme Type
                </SoftTypography>
                <SoftSelect
                  value={programTypeOptions.filter((opt) =>
                    filters.programTypes?.includes(opt.value)
                  )}
                  onChange={(selected) => {
                    const values = selected
                      ? (Array.isArray(selected) ? selected : [selected]).map((s) => s.value)
                      : [];
                    handleFilterChange("programTypes", values);
                  }}
                  options={programTypeOptions}
                  isMulti
                  isClearable
                  placeholder="Select programme types"
                />
              </SoftBox>
            </Grid>

            <Grid item xs={12} md={3}>
              <SoftBox mb={2}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Min Price
                </SoftTypography>
                <SoftInput
                  type="number"
                  placeholder="Min price"
                  value={filters.minPrice || ""}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                />
              </SoftBox>
            </Grid>

            <Grid item xs={12} md={3}>
              <SoftBox mb={2}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Max Price
                </SoftTypography>
                <SoftInput
                  type="number"
                  placeholder="Max price"
                  value={filters.maxPrice || ""}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                />
              </SoftBox>
            </Grid>

            <Grid item xs={12}>
              <SoftBox display="flex" gap={2}>
                <SoftButton variant="gradient" color="info" onClick={onApplyFilters}>
                  Apply Filters
                </SoftButton>
                <SoftButton variant="outlined" color="secondary" onClick={onResetFilters}>
                  Reset
                </SoftButton>
              </SoftBox>
            </Grid>
          </Grid>
        </SoftBox>
      </Collapse>
    </SoftBox>
  );
}

CourseFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  onFiltersChange: PropTypes.func.isRequired,
  onApplyFilters: PropTypes.func.isRequired,
  onResetFilters: PropTypes.func.isRequired,
  availableCountries: PropTypes.array,
  availableSchools: PropTypes.array,
  availableCampuses: PropTypes.array,
};

export default CourseFilters;
