import PropTypes from "prop-types";
import Card from "@mui/material/Card";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftBadge from "components/SoftBadge";
import CampusWebsite from "../CampusWebsite";

function CampusSidebar({ campus }) {
  return (
    <Card>
      <SoftBox p={3}>
        <SoftTypography variant="h6" fontWeight="medium" mb={3}>
          Location Information
        </SoftTypography>

        <SoftBox mb={3}>
          <SoftTypography variant="body2" color="text" fontWeight="medium" mb={1}>
            Location
          </SoftTypography>
          <SoftTypography variant="body2" color="text">
            {campus.address}
          </SoftTypography>
        </SoftBox>

        <SoftBox mb={3}>
          <SoftTypography variant="body2" color="text" fontWeight="medium" mb={1}>
            Currency
          </SoftTypography>
          <SoftBadge
            variant="contained"
            color="info"
            size="small"
            badgeContent={campus.currency || "EUR"}
            container
          />
        </SoftBox>

        <SoftBox mb={3}>
          <SoftTypography variant="body2" color="text" fontWeight="medium" mb={1}>
            Average Participants per Class
          </SoftTypography>
          <SoftTypography variant="body2" color="text">
            {campus.avgStudentsPerClass || 15} participants
          </SoftTypography>
        </SoftBox>

        <SoftBox mb={3}>
          <SoftTypography variant="body2" color="text" fontWeight="medium" mb={1}>
            Number of Participants
          </SoftTypography>
          <SoftTypography variant="body2" color="text">
            {campus.numberOfStudents ?? "—"}
          </SoftTypography>
        </SoftBox>

        {campus.averageRating && (
          <SoftBox mb={3}>
            <SoftTypography variant="body2" color="text" fontWeight="medium" mb={1}>
              Average Rating
            </SoftTypography>
            <SoftTypography variant="body2" color="text">
              ⭐ {parseFloat(campus.averageRating).toFixed(1)} / 5.0
            </SoftTypography>
          </SoftBox>
        )}

        <CampusWebsite websiteUrl={campus.website} />

        <SoftBox>
          <SoftTypography variant="body2" color="text" fontWeight="medium" mb={1}>
            Created
          </SoftTypography>
          <SoftTypography variant="body2" color="text">
            {new Date(campus.createdAt).toLocaleDateString()}
          </SoftTypography>
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

CampusSidebar.propTypes = {
  campus: PropTypes.object.isRequired,
};

export default CampusSidebar;
