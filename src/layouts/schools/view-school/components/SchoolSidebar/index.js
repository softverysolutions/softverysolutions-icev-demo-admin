import PropTypes from "prop-types";
import { formatProviderType } from "utils/courseTypeUtils";
import Card from "@mui/material/Card";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftBadge from "components/SoftBadge";

const formatSchoolType = (schoolType) => formatProviderType(schoolType);

function SchoolSidebar({ school }) {

  return (
    <Card>
      <SoftBox p={3}>
        <SoftBox mb={3}>
          <SoftTypography variant="h6" fontWeight="medium" mb={2}>
            Logo
          </SoftTypography>
          <SoftBox
            component="img"
            src={school.logo}
            alt={`${school.name} logo`}
            borderRadius="lg"
            shadow="md"
            width="100%"
            height="200px"
            sx={{ objectFit: "cover" }}
          />
        </SoftBox>

        <SoftBox mb={3}>
          <SoftTypography variant="body2" color="text" fontWeight="medium" mb={1}>
            Type
          </SoftTypography>
          <SoftTypography variant="body2" color="text" mb={3}>
            {formatSchoolType(school.schoolType)}
          </SoftTypography>
        </SoftBox>

      </SoftBox>
    </Card>
  );
}

SchoolSidebar.propTypes = {
  school: PropTypes.object.isRequired,
};

export default SchoolSidebar;
