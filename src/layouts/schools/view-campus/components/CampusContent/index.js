import PropTypes from "prop-types";
import Card from "@mui/material/Card";

import SoftBox from "components/SoftBox";

import CampusHeader from "../CampusHeader";
import CampusTabs from "../CampusTabs";

function CampusContent({ campus, onEditCampus, showEdit }) {
  return (
    <Card>
      <SoftBox p={3}>
        <CampusHeader campus={campus} onEditCampus={onEditCampus} showEdit={showEdit} />
        <CampusTabs campus={campus} />
      </SoftBox>
    </Card>
  );
}

CampusContent.propTypes = {
  campus: PropTypes.object.isRequired,
  onEditCampus: PropTypes.func.isRequired,
  showEdit: PropTypes.bool,
};

export default CampusContent;
