import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftSelect from "components/SoftSelect";
import SelectMenuListWithScroll from "./SelectMenuListWithScroll";

const PACKAGE_SELECT_MAX_MENU_HEIGHT = 360;

function CourseSelectionSection({
  formData,
  schools,
  campuses,
  courses,
  isViewMode,
  canEdit,
  isSubmitting,
  isLoading,
  schoolsSelectLoading,
  campusesSelectLoading,
  coursesSelectLoading,
  onSchoolInputChange,
  onSchoolMenuScrollToBottom,
  onCampusMenuScrollToBottom,
  onCourseMenuScrollToBottom,
  getSelectPlaceholder,
  onInputChange,
  onCampusChange,
  onClearCampus,
  errors,
}) {
  return (
    <SoftBox mb={3}>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Programme
      </SoftTypography>

      <SoftBox mb={2}>
        <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
          Provider*
        </SoftTypography>
        <SoftSelect
          value={formData.selectedSchool}
          onChange={(option) => onInputChange("selectedSchool", option)}
          onInputChange={onSchoolInputChange}
          onMenuScrollToBottom={onSchoolMenuScrollToBottom}
          maxMenuHeight={PACKAGE_SELECT_MAX_MENU_HEIGHT}
          components={{ MenuList: SelectMenuListWithScroll }}
          filterOption={() => true}
          options={schools}
          isDisabled={isViewMode || !canEdit || isSubmitting || isLoading("schools")}
          isSearchable={!isViewMode}
          isLoading={schoolsSelectLoading}
          placeholder={getSelectPlaceholder("schools", "Select provider")}
          isClearable
          fullWidth
        />
      </SoftBox>

      <SoftBox mb={2}>
        <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
          Location*
        </SoftTypography>
        <SoftBox display="flex" alignItems="flex-start" gap={1}>
          <SoftBox sx={{ flex: 1, minWidth: 0 }}>
            <SoftSelect
              value={formData.selectedCampus}
              onChange={onCampusChange}
              onMenuScrollToBottom={onCampusMenuScrollToBottom}
              maxMenuHeight={PACKAGE_SELECT_MAX_MENU_HEIGHT}
              components={{ MenuList: SelectMenuListWithScroll }}
              options={campuses}
              isDisabled={isViewMode || !canEdit || isSubmitting || isLoading("campuses") || !formData.selectedSchool}
              isLoading={campusesSelectLoading}
              placeholder={
                !formData.selectedSchool ? "Select provider first" : getSelectPlaceholder("campuses", "Select location")
              }
              isClearable={false}
            />
          </SoftBox>
          {formData.selectedCampus && !isViewMode && canEdit && (
            <IconButton
              size="small"
              color="error"
              onClick={onClearCampus}
              disabled={isSubmitting}
              title="Clear location"
              sx={{ mt: 0.5, flexShrink: 0 }}
            >
              <Icon fontSize="small">close</Icon>
            </IconButton>
          )}
        </SoftBox>
      </SoftBox>

      <SoftBox mb={2}>
        <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1}>
          Programme*
        </SoftTypography>
        <SoftSelect
          value={courses.find(c => c.value === formData.courseId) || null}
          onChange={(option) => onInputChange("courseId", option?.value || null)}
          onMenuScrollToBottom={onCourseMenuScrollToBottom}
          maxMenuHeight={PACKAGE_SELECT_MAX_MENU_HEIGHT}
          components={{ MenuList: SelectMenuListWithScroll }}
          options={courses}
          isDisabled={isViewMode || !canEdit || isSubmitting || isLoading("courses") || !formData.selectedCampus}
          isLoading={coursesSelectLoading}
          placeholder={!formData.selectedCampus ? "Select location first" : getSelectPlaceholder("courses", "Select programme")}
          isClearable
        />
        {errors.courseId && (
          <SoftTypography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
            {errors.courseId}
          </SoftTypography>
        )}
      </SoftBox>
    </SoftBox>
  );
}

CourseSelectionSection.propTypes = {
  formData: PropTypes.object.isRequired,
  schools: PropTypes.array.isRequired,
  campuses: PropTypes.array.isRequired,
  courses: PropTypes.array.isRequired,
  isViewMode: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  isLoading: PropTypes.func.isRequired,
  schoolsSelectLoading: PropTypes.bool.isRequired,
  campusesSelectLoading: PropTypes.bool.isRequired,
  coursesSelectLoading: PropTypes.bool.isRequired,
  onSchoolInputChange: PropTypes.func.isRequired,
  onSchoolMenuScrollToBottom: PropTypes.func.isRequired,
  onCampusMenuScrollToBottom: PropTypes.func.isRequired,
  onCourseMenuScrollToBottom: PropTypes.func.isRequired,
  getSelectPlaceholder: PropTypes.func.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onCampusChange: PropTypes.func.isRequired,
  onClearCampus: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
};

export default CourseSelectionSection;
