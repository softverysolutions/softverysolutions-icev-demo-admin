import { useCallback } from "react";
import PropTypes from "prop-types";
import AsyncSelect from "react-select/async";
import Grid from "@mui/material/Grid";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";
import softSelectStyles from "components/SoftSelect/styles";
import colors from "assets/theme/base/colors";
import { ServiceService } from "services/serviceService";

import { applyingScopeHint } from "../constants";
import { applyingScopeRadioGroupSx } from "./formFieldSx";

function PromoStepScope({
  form,
  onInputChange,
  countryOptions,
  schoolOptions,
  programOptions,
  campusOptions,
  accommodationCampusOptions,
  accommodationSelectOptions,
  accommodationSelectLoading = false,
  accommodationBulkLoading = false,
  programOptionsLoading = false,
  tuitionSchoolsLoading = false,
  tuitionCampusesLoading = false,
  accCampusesLoading = false,
  fetchTuitionSchoolsCatalog,
  fetchTuitionCampusesCatalog,
  fetchTuitionCoursesCatalog,
  countryLoadingMore = false,
  tuitionSchoolsLoadingMore = false,
  tuitionCampusesLoadingMore = false,
  tuitionCoursesLoadingMore = false,
  accCampusesLoadingMore = false,
  accommodationSelectLoadingMore = false,
  loadMoreCountries,
  loadMoreTuitionSchools,
  loadMoreTuitionCampuses,
  loadMoreTuitionCourses,
  loadMoreAccCampuses,
  loadMoreAccommodationSelect,
  readOnly = false,
  hideApplyingTitle = false,
}) {
  const { light } = colors;

  const isTuitionScope = form.applyingScope === "tuition_only" || form.applyingScope === "tuition_mandatory";
  const isAccommodationScope = form.applyingScope === "accommodation";
  const isServicesScope = form.applyingScope === "services";

  const handleTuitionCountriesChange = (nextCountries) => {
    const next = nextCountries || [];
    const nextCountryIds = new Set(next.map((c) => c.value));
    const prevCountryIds = new Set((form.countries || []).map((c) => c.value));
    const removedCountryIds = new Set(
      [...prevCountryIds].filter((id) => !nextCountryIds.has(id))
    );

    if (nextCountryIds.size === 0) {
      onInputChange("countries", []);
      onInputChange("schools", []);
      onInputChange("campuses", []);
      onInputChange("programs", []);
      return;
    }

    let schools = form.schools || [];
    let campuses = form.campuses || [];
    let programs = form.programs || [];

    if (removedCountryIds.size > 0) {
      schools = schools.filter((s) => !s.countryId || !removedCountryIds.has(s.countryId));
      const schoolIds = new Set(schools.map((s) => s.value));
      campuses = campuses.filter((c) => {
        if (c.countryId && removedCountryIds.has(c.countryId)) return false;
        if (c.schoolId && !schoolIds.has(c.schoolId)) return false;
        return true;
      });
      const campusIds = new Set(campuses.map((c) => c.value));
      programs = programs.filter((p) => !p.campusId || campusIds.has(p.campusId));
    }

    onInputChange("countries", next);
    onInputChange("schools", schools);
    onInputChange("campuses", campuses);
    onInputChange("programs", programs);
  };

  const handleTuitionSchoolsChange = (nextSchools) => {
    const next = nextSchools || [];
    const nextSchoolIds = new Set(next.map((s) => s.value));

    if (nextSchoolIds.size === 0) {
      onInputChange("schools", []);
      onInputChange("campuses", []);
      onInputChange("programs", []);
      return;
    }

    const prevSchoolIds = new Set((form.schools || []).map((s) => s.value));
    const removedSchoolIds = new Set(
      [...prevSchoolIds].filter((id) => !nextSchoolIds.has(id))
    );

    let campuses = form.campuses || [];
    let programs = form.programs || [];

    if (removedSchoolIds.size > 0) {
      campuses = campuses.filter((c) => !c.schoolId || nextSchoolIds.has(c.schoolId));
      const campusIds = new Set(campuses.map((c) => c.value));
      programs = programs.filter((p) => !p.campusId || campusIds.has(p.campusId));
    }

    onInputChange("schools", next);
    onInputChange("campuses", campuses);
    onInputChange("programs", programs);
  };

  const handleTuitionCampusesChange = (nextCampuses) => {
    const next = nextCampuses || [];
    const nextCampusIds = new Set(next.map((c) => c.value));

    if (nextCampusIds.size === 0) {
      onInputChange("campuses", []);
      onInputChange("programs", []);
      return;
    }

    const prevCampusIds = new Set((form.campuses || []).map((c) => c.value));
    const removedCampusIds = new Set(
      [...prevCampusIds].filter((id) => !nextCampusIds.has(id))
    );

    let programs = form.programs || [];
    if (removedCampusIds.size > 0) {
      programs = programs.filter((p) => !p.campusId || nextCampusIds.has(p.campusId));
    }

    onInputChange("campuses", next);
    onInputChange("programs", programs);
  };

  const loadServiceOptions = useCallback(async (inputValue) => {
    const res = await ServiceService.searchServices({
      search: (inputValue || "").trim(),
      limit: 100,
      page: 1,
    });
    return (res.data || []).map((s) => ({
      value: s.id,
      label: s.name || s.id,
    }));
  }, []);

  const handleAccommodationCountryChange = (v) => {
    onInputChange("accommodationGlobalAll", false);
    onInputChange("accommodationCountryFilter", v);
    onInputChange("accommodationCampusFilter", null);
    onInputChange("selectedAccommodations", []);
    onInputChange("accommodationAllInCampus", false);
  };

  const handleApplyingScopeChange = (e) => {
    const v = e.target.value;
    onInputChange("applyingScope", v);
    if (v !== "accommodation") {
      onInputChange("accommodationGlobalAll", false);
    }
  };

  return (
    <>
      {!hideApplyingTitle && (
        <SoftBox mb={1}>
          <SoftTypography variant="h6" fontWeight="medium">
            Applying scope
          </SoftTypography>
        </SoftBox>
      )}

      <RadioGroup
        value={form.applyingScope}
        onChange={handleApplyingScopeChange}
        sx={applyingScopeRadioGroupSx}
      >
        {[
          { value: "tuition_only", label: "Programme fee only" },
          { value: "tuition_mandatory", label: "Programme fee + mandatory extras" },
          { value: "accommodation", label: "Accommodation" },
          { value: "services", label: "Extras" },
        ].map((opt) => (
          <FormControlLabel
            key={opt.value}
            value={opt.value}
            control={<Radio color="primary" disabled={readOnly} />}
            label={opt.label}
          />
        ))}
      </RadioGroup>
      <SoftTypography variant="caption" display="block" mt={1} fontWeight="medium" sx={{ color: "info.main" }}>
        {applyingScopeHint(form.applyingScope)}
      </SoftTypography>

      {isServicesScope && (
        <SoftBox mt={1.5}>
          <SoftTypography component="label" variant="caption" fontWeight="bold" display="block" mb={0.75}>
            Select extras *
          </SoftTypography>
          <AsyncSelect
            isMulti
            cacheOptions
            defaultOptions
            loadOptions={loadServiceOptions}
            filterOption={() => true}
            value={form.selectedServices}
            onChange={(v) => onInputChange("selectedServices", v || [])}
            placeholder="Select extras..."
            isDisabled={readOnly}
            styles={softSelectStyles("medium", false, false)}
            menuPortalTarget={typeof document !== "undefined" ? document.body : null}
            menuPosition="fixed"
            theme={(theme) => ({
              ...theme,
              colors: {
                ...theme.colors,
                primary25: light.main,
                primary: light.main,
              },
            })}
          />
          <SoftTypography variant="caption" color="text" display="block" mt={1}>
            Discount applies only to the selected extras.
          </SoftTypography>
        </SoftBox>
      )}

      {isAccommodationScope && (
        <>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2} mt={0.5}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={Boolean(form.accommodationGlobalAll)}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      onInputChange("accommodationGlobalAll", checked);
                      if (checked) {
                        onInputChange("accommodationCountryFilter", null);
                        onInputChange("accommodationCampusFilter", null);
                        onInputChange("selectedAccommodations", []);
                        onInputChange("accommodationAllInCampus", false);
                      }
                    }}
                    disabled={readOnly}
                    color="primary"
                  />
                }
                label="All accommodations"
                sx={{
                  m: 0,
                  mx: 0,
                  alignItems: "flex-start",
                  "& .MuiCheckbox-root": { py: 0.25, pl: 0, pr: 1 },
                  "& .MuiFormControlLabel-label": { fontSize: "0.875rem", pl: 0 },
                }}
              />
            </Grid>
            {!form.accommodationGlobalAll && (
              <>
                <Grid item xs={12} md={6}>
                  <SoftBox mb={1.5}>
                    <SoftTypography component="label" variant="caption" fontWeight="bold">
                      Filter by country
                    </SoftTypography>
                    <SoftSelect
                      options={countryOptions}
                      value={form.accommodationCountryFilter}
                      onChange={handleAccommodationCountryChange}
                      placeholder="Select country..."
                      isClearable
                      isDisabled={readOnly}
                      isLoading={countryLoadingMore}
                      onMenuScrollToBottom={() => loadMoreCountries?.()}
                      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                      menuPosition="fixed"
                    />
                  </SoftBox>
                </Grid>
                <Grid item xs={12} md={6}>
                  <SoftBox mb={1.5}>
                    <SoftTypography component="label" variant="caption" fontWeight="bold">
                      Filter by location
                    </SoftTypography>
                    <SoftSelect
                      options={accommodationCampusOptions}
                      value={form.accommodationCampusFilter}
                      onChange={(v) => {
                        onInputChange("accommodationGlobalAll", false);
                        onInputChange("accommodationCampusFilter", v);
                        onInputChange("selectedAccommodations", []);
                        if (!v) onInputChange("accommodationAllInCampus", false);
                      }}
                      placeholder={
                        form.accommodationCountryFilter ? "Select location..." : "Select country first"
                      }
                      isClearable
                      isLoading={accCampusesLoading || accCampusesLoadingMore}
                      onMenuScrollToBottom={() => loadMoreAccCampuses?.()}
                      isDisabled={readOnly || !form.accommodationCountryFilter}
                      menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                      menuPosition="fixed"
                    />
                  </SoftBox>
                </Grid>
                <Grid item xs={12} sx={{ mt: 0.5 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(form.accommodationAllInCampus)}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          onInputChange("accommodationAllInCampus", checked);
                          if (!checked) onInputChange("selectedAccommodations", []);
                        }}
                        disabled={readOnly || !form.accommodationCampusFilter}
                        color="primary"
                      />
                    }
                    label="Apply this promo to all accommodation at the selected location"
                    sx={{
                      m: 0,
                      mx: 0,
                      alignItems: "flex-start",
                      "& .MuiCheckbox-root": { py: 0.25, pl: 0, pr: 1 },
                      "& .MuiFormControlLabel-label": { fontSize: "0.875rem", pl: 0 },
                    }}
                  />
                </Grid>
                {form.accommodationAllInCampus && (
                  <Grid item xs={12}>
                    <SoftBox mb={0} mt={0.5}>
                      <SoftTypography component="label" variant="caption" fontWeight="bold" display="block" mb={0.75}>
                        Accommodations included
                      </SoftTypography>
                      <SoftSelect
                        isMulti
                        isLoading={accommodationBulkLoading}
                        options={form.selectedAccommodations || []}
                        value={form.selectedAccommodations || []}
                        isDisabled
                        placeholder={
                          accommodationBulkLoading
                            ? "Loading accommodations..."
                            : "No accommodation for this location"
                        }
                        menuIsOpen={false}
                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                        menuPosition="fixed"
                      />
                    </SoftBox>
                  </Grid>
                )}
                {!form.accommodationAllInCampus && (
                  <Grid item xs={12}>
                    <SoftBox mb={0} mt={0.5}>
                      <SoftTypography component="label" variant="caption" fontWeight="bold" display="block" mb={0.75}>
                        Select accommodation *
                      </SoftTypography>
                      <SoftSelect
                        isMulti
                        options={accommodationSelectOptions}
                        value={form.selectedAccommodations}
                        onChange={(v) => onInputChange("selectedAccommodations", v || [])}
                        placeholder={
                          !form.accommodationCountryFilter
                            ? "Select country first"
                            : !form.accommodationCampusFilter
                              ? "Select location first"
                              : "Select accommodations..."
                        }
                        isLoading={accommodationSelectLoading || accommodationSelectLoadingMore}
                        onMenuScrollToBottom={() => loadMoreAccommodationSelect?.()}
                        isDisabled={readOnly || !form.accommodationCountryFilter || !form.accommodationCampusFilter}
                        menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                        menuPosition="fixed"
                      />
                    </SoftBox>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </>
      )}

      {isTuitionScope && (
        <>
          <Divider sx={{ my: 2 }} />
          <SoftBox mb={1}>
            <SoftTypography variant="h6" fontWeight="medium">
              Eligibility rules (optional)
            </SoftTypography>
            <SoftTypography variant="caption" color="text" display="block" mt={0.25}>
              All configured rules must be satisfied (AND logic). Leave empty for no restriction.
            </SoftTypography>
          </SoftBox>

          <SoftTypography variant="button" fontWeight="bold" display="block" mb={0.75}>
            For programmes
          </SoftTypography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <SoftBox mb={1.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Valid countries
                </SoftTypography>
                <SoftSelect
                  isMulti
                  options={countryOptions}
                  value={form.countries}
                  onChange={(v) => handleTuitionCountriesChange(v)}
                  placeholder="Select countries..."
                  isDisabled={readOnly}
                  isLoading={countryLoadingMore}
                  onMenuScrollToBottom={() => loadMoreCountries?.()}
                  menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                  menuPosition="fixed"
                />
              </SoftBox>
            </Grid>
            <Grid item xs={12}>
              <SoftBox mb={1.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Specific providers
                </SoftTypography>
                <SoftSelect
                  isMulti
                  options={schoolOptions}
                  value={form.schools}
                  onChange={(v) => handleTuitionSchoolsChange(v)}
                  onMenuOpen={() => fetchTuitionSchoolsCatalog?.()}
                  onMenuScrollToBottom={() => loadMoreTuitionSchools?.()}
                  placeholder={
                    (form.countries || []).length ? "Select providers..." : "Select countries first"
                  }
                  isLoading={tuitionSchoolsLoading || tuitionSchoolsLoadingMore}
                  isDisabled={readOnly || !(form.countries || []).length || tuitionSchoolsLoading}
                  menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                  menuPosition="fixed"
                />
              </SoftBox>
            </Grid>
            <Grid item xs={12}>
              <SoftBox mb={1.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Specific locations
                </SoftTypography>
                <SoftBox
                  sx={{
                    position: "relative",
                    zIndex: 1,
                    "& .react-select__menu": { zIndex: 9999 },
                  }}
                >
                  <SoftSelect
                    isMulti
                    options={campusOptions}
                    value={form.campuses}
                    onChange={(v) => handleTuitionCampusesChange(v)}
                    onMenuOpen={() => fetchTuitionCampusesCatalog?.()}
                    onMenuScrollToBottom={() => loadMoreTuitionCampuses?.()}
                    placeholder={
                      !(form.countries || []).length
                        ? "Select countries first"
                        : (form.schools || []).length
                          ? "Select locations..."
                          : "Select providers first"
                    }
                    isLoading={tuitionCampusesLoading || tuitionCampusesLoadingMore}
                    isDisabled={
                      readOnly ||
                      !(form.countries || []).length ||
                      !(form.schools || []).length ||
                      tuitionCampusesLoading
                    }
                    menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                    menuPosition="fixed"
                  />
                </SoftBox>
              </SoftBox>
            </Grid>
            <Grid item xs={12}>
              <SoftBox mb={1.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Specific programmes
                </SoftTypography>
                <SoftSelect
                  isMulti
                  options={programOptions}
                  value={form.programs}
                  onChange={(v) => onInputChange("programs", v || [])}
                  onMenuOpen={() => fetchTuitionCoursesCatalog?.()}
                  onMenuScrollToBottom={() => loadMoreTuitionCourses?.()}
                  placeholder={
                    !(form.countries || []).length
                      ? "Select countries first"
                      : !(form.schools || []).length
                        ? "Select providers first"
                        : !(form.campuses || []).length
                          ? "Select locations first to load programmes"
                          : programOptionsLoading
                            ? "Loading programmes..."
                            : "Select programmes..."
                  }
                  isLoading={programOptionsLoading || tuitionCoursesLoadingMore}
                  isDisabled={
                    readOnly ||
                    !(form.countries || []).length ||
                    !(form.schools || []).length ||
                    !(form.campuses || []).length
                  }
                  menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                  menuPosition="fixed"
                />
              </SoftBox>
            </Grid>
            <Grid item xs={12} md={6}>
              <SoftBox mb={1.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Minimum programme duration (weeks)
                </SoftTypography>
                <SoftInput
                  type="number"
                  placeholder="No minimum"
                  value={form.minWeeks}
                  onChange={(e) => onInputChange("minWeeks", e.target.value)}
                  fullWidth
                  disabled={readOnly}
                />
              </SoftBox>
            </Grid>
            <Grid item xs={12} md={6}>
              <SoftBox mb={1.5}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Maximum programme duration (weeks)
                </SoftTypography>
                <SoftInput
                  type="number"
                  placeholder="No maximum"
                  value={form.maxWeeks}
                  onChange={(e) => onInputChange("maxWeeks", e.target.value)}
                  fullWidth
                  disabled={readOnly}
                />
              </SoftBox>
            </Grid>
          </Grid>
        </>
      )}
    </>
  );
}

PromoStepScope.propTypes = {
  form: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  countryOptions: PropTypes.array.isRequired,
  schoolOptions: PropTypes.array.isRequired,
  programOptions: PropTypes.array.isRequired,
  campusOptions: PropTypes.array.isRequired,
  accommodationCampusOptions: PropTypes.array.isRequired,
  accommodationSelectOptions: PropTypes.array.isRequired,
  accommodationSelectLoading: PropTypes.bool,
  accommodationBulkLoading: PropTypes.bool,
  programOptionsLoading: PropTypes.bool,
  tuitionSchoolsLoading: PropTypes.bool,
  tuitionCampusesLoading: PropTypes.bool,
  accCampusesLoading: PropTypes.bool,
  fetchTuitionSchoolsCatalog: PropTypes.func,
  fetchTuitionCampusesCatalog: PropTypes.func,
  fetchTuitionCoursesCatalog: PropTypes.func,
  countryLoadingMore: PropTypes.bool,
  tuitionSchoolsLoadingMore: PropTypes.bool,
  tuitionCampusesLoadingMore: PropTypes.bool,
  tuitionCoursesLoadingMore: PropTypes.bool,
  accCampusesLoadingMore: PropTypes.bool,
  accommodationSelectLoadingMore: PropTypes.bool,
  loadMoreCountries: PropTypes.func,
  loadMoreTuitionSchools: PropTypes.func,
  loadMoreTuitionCampuses: PropTypes.func,
  loadMoreTuitionCourses: PropTypes.func,
  loadMoreAccCampuses: PropTypes.func,
  loadMoreAccommodationSelect: PropTypes.func,
  readOnly: PropTypes.bool,
  hideApplyingTitle: PropTypes.bool,
};

export default PromoStepScope;
