import PropTypes from "prop-types";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";

import SoftTypography from "components/SoftTypography";

import PromoFormSectionCard from "./PromoFormSectionCard";
import PromoStepCodeStatus from "../steps/PromoStepCodeStatus";
import PromoStepEligibility from "../steps/PromoStepEligibility";
import PromoStepUsageLimitsOnly from "../steps/PromoStepUsageLimitsOnly";
import PromoStepDiscount from "../steps/PromoStepDiscount";
import PromoStepScope from "../steps/PromoStepScope";
import PromoStepCombinable from "../steps/PromoStepCombinable";
import PromoStepActivePeriod from "../steps/PromoStepActivePeriod";

function PromoFormStepBody({
  form,
  onInputChange,
  countryOptions,
  schoolOptions,
  programOptions,
  campusOptions,
  accommodationCampusOptions,
  accommodationSelectOptions,
  accommodationSelectLoading,
  accommodationBulkLoading,
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
  dateError = "",
  readOnly = false,
}) {
  return (
    <Stack spacing={2}>
      <PromoFormSectionCard title="Code & status">
        <PromoStepCodeStatus form={form} onInputChange={onInputChange} readOnly={readOnly} />
      </PromoFormSectionCard>

      <PromoFormSectionCard title="Eligibility scope">
        <PromoStepEligibility form={form} onInputChange={onInputChange} readOnly={readOnly} />
      </PromoFormSectionCard>

      <PromoFormSectionCard title="Usage limits">
        <PromoStepUsageLimitsOnly form={form} onInputChange={onInputChange} readOnly={readOnly} />
      </PromoFormSectionCard>

      <PromoFormSectionCard title="Discount type">
        <PromoStepDiscount form={form} onInputChange={onInputChange} readOnly={readOnly} />
      </PromoFormSectionCard>

      <PromoFormSectionCard
        title="Applying scope"
        subtitle="Defines which part of the order the discount is applied to."
      >
        <PromoStepScope
          form={form}
          onInputChange={onInputChange}
          countryOptions={countryOptions}
          schoolOptions={schoolOptions}
          programOptions={programOptions}
          campusOptions={campusOptions}
          accommodationCampusOptions={accommodationCampusOptions}
          accommodationSelectOptions={accommodationSelectOptions}
          accommodationSelectLoading={accommodationSelectLoading}
          accommodationBulkLoading={accommodationBulkLoading}
          programOptionsLoading={programOptionsLoading}
          tuitionSchoolsLoading={tuitionSchoolsLoading}
          tuitionCampusesLoading={tuitionCampusesLoading}
          accCampusesLoading={accCampusesLoading}
          fetchTuitionSchoolsCatalog={fetchTuitionSchoolsCatalog}
          fetchTuitionCampusesCatalog={fetchTuitionCampusesCatalog}
          fetchTuitionCoursesCatalog={fetchTuitionCoursesCatalog}
          countryLoadingMore={countryLoadingMore}
          tuitionSchoolsLoadingMore={tuitionSchoolsLoadingMore}
          tuitionCampusesLoadingMore={tuitionCampusesLoadingMore}
          tuitionCoursesLoadingMore={tuitionCoursesLoadingMore}
          accCampusesLoadingMore={accCampusesLoadingMore}
          accommodationSelectLoadingMore={accommodationSelectLoadingMore}
          loadMoreCountries={loadMoreCountries}
          loadMoreTuitionSchools={loadMoreTuitionSchools}
          loadMoreTuitionCampuses={loadMoreTuitionCampuses}
          loadMoreTuitionCourses={loadMoreTuitionCourses}
          loadMoreAccCampuses={loadMoreAccCampuses}
          loadMoreAccommodationSelect={loadMoreAccommodationSelect}
          readOnly={readOnly}
          hideApplyingTitle
        />
      </PromoFormSectionCard>

      <PromoFormSectionCard
        title="Combinable with provider discount"
        headerRight={
          <Stack direction="row" alignItems="center" spacing={1}>
            <SoftTypography variant="button" color="text">
              {form.combinableWithSchool ? "Yes" : "No"}
            </SoftTypography>
            <Switch
              checked={form.combinableWithSchool}
              onChange={(e) => onInputChange("combinableWithSchool", e.target.checked)}
              color="primary"
              disabled={readOnly}
            />
          </Stack>
        }
      >
        <PromoStepCombinable />
      </PromoFormSectionCard>

      <PromoFormSectionCard title="Active period">
        <PromoStepActivePeriod
          form={form}
          onInputChange={onInputChange}
          dateError={dateError}
          readOnly={readOnly}
        />
      </PromoFormSectionCard>
    </Stack>
  );
}

PromoFormStepBody.propTypes = {
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
  dateError: PropTypes.string,
  readOnly: PropTypes.bool,
};

export default PromoFormStepBody;
