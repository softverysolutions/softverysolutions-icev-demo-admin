import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { usePromoCodeForm } from "./hooks/usePromoCodeForm";
import PromoFormStepBody from "./components/PromoFormStepBody";

function PromoCodeFormPage() {
  const {
    isEdit,
    isView,
    loading,
    saving,
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
    tuitionCoursesLoading,
    dateError,
    canSubmit,
    handleCancel,
    handleFinish,
    tuitionSchoolsLoading,
    tuitionCampusesLoading,
    accCampusesLoading,
    fetchTuitionSchoolsCatalog,
    fetchTuitionCampusesCatalog,
    fetchTuitionCoursesCatalog,
    countryLoadingMore,
    tuitionSchoolsLoadingMore,
    tuitionCampusesLoadingMore,
    tuitionCoursesLoadingMore,
    accCampusesLoadingMore,
    accommodationSelectLoadingMore,
    loadMoreCountries,
    loadMoreTuitionSchools,
    loadMoreTuitionCampuses,
    loadMoreTuitionCourses,
    loadMoreAccCampuses,
    loadMoreAccommodationSelect,
  } = usePromoCodeForm();

  const title = (() => {
    if (isView) return "View promo code";
    if (isEdit) return "Edit promo code";
    return "Create promo code";
  })();

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox my={3}>
        <Grid container justifyContent="center">
          <Grid item xs={12} lg={10}>
            <Card>
              <SoftBox display="flex" justifyContent="space-between" alignItems="center" p={3} flexWrap="wrap" gap={2}>
                <SoftBox lineHeight={1}>
                  <SoftTypography variant="h5" fontWeight="medium">
                    {title}
                  </SoftTypography>
                </SoftBox>
                <SoftBox display="flex" gap={2} flexWrap="wrap" alignItems="center">
                  <SoftButton color="light" onClick={handleCancel} disabled={saving}>
                    {isView ? "Close" : "Cancel"}
                  </SoftButton>
                  {!isView && (
                    <SoftButton
                      variant="gradient"
                      color="info"
                      onClick={handleFinish}
                      disabled={!canSubmit || loading}
                    >
                      {saving ? "Saving…" : isEdit ? "Save promo code" : "Create promo code"}
                    </SoftButton>
                  )}
                </SoftBox>
              </SoftBox>

              <SoftBox px={3} pb={3} pt={0} position="relative" minHeight={loading ? 240 : undefined}>
                {loading ? (
                  <SoftBox display="flex" justifyContent="center" alignItems="center" py={6}>
                    <CircularProgress color="info" />
                  </SoftBox>
                ) : (
                  <PromoFormStepBody
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
                    programOptionsLoading={tuitionCoursesLoading}
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
                    dateError={dateError}
                    readOnly={isView}
                  />
                )}
              </SoftBox>
            </Card>
          </Grid>
        </Grid>
      </SoftBox>
    </DashboardLayout>
  );
}

export default PromoCodeFormPage;
