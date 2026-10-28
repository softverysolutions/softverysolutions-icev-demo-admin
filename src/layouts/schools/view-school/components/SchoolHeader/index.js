import PropTypes from "prop-types";
import { formatProviderType } from "utils/courseTypeUtils";
import Stack from "@mui/material/Stack";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftBadge from "components/SoftBadge";

const formatSchoolType = (schoolType) => formatProviderType(schoolType);

function SchoolHeader({ school, onEdit, showEdit }) {
  return (
    <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
      <SoftBox>
        <SoftTypography variant="h4" fontWeight="bold" mb={1}>
          {school.name}
        </SoftTypography>
        <SoftBadge
          variant="contained"
          color="info"
          size="small"
          badgeContent={formatSchoolType(school.schoolType)}
          container
        />
      </SoftBox>
      {showEdit ? (
        <Stack spacing={1} direction="row">
          <SoftButton
            variant="outlined"
            color="info"
            size="small"
            startIcon={<Icon>edit</Icon>}
            onClick={onEdit}
          >
            Edit
          </SoftButton>
        </Stack>
      ) : null}
    </SoftBox>
  );
}

SchoolHeader.propTypes = {
  school: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  showEdit: PropTypes.bool,
};

export default SchoolHeader;
