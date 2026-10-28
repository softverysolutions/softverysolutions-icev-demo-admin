import PropTypes from "prop-types";
import Card from "@mui/material/Card";

import SoftBox from "components/SoftBox";

import SchoolHeader from "../SchoolHeader";
import SchoolInfo from "../SchoolInfo";
import SchoolDescription from "../SchoolDescription";
import SchoolAwards from "../SchoolAwards";

function SchoolContent({ school, onEdit, showEdit }) {
  const schoolInfo = {
    contactEmail: school.contactEmail || "N/A",
    contactPhone: school.contactPhone || "N/A",
  };

  return (
    <Card>
      <SoftBox p={3}>
        <SoftBox mb={4}>
          <SchoolHeader school={school} onEdit={onEdit} showEdit={showEdit} />
          <SchoolInfo info={schoolInfo} />
          <SchoolDescription description={school.description || "No description available."} />
          <SchoolAwards schoolId={school?.id} />
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

SchoolContent.propTypes = {
  school: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
  showEdit: PropTypes.bool,
};

export default SchoolContent;
