import { useState } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Collapse from "@mui/material/Collapse";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import CampusFacilities from "../CampusFacilities";
import CampusNationalityMix from "../CampusNationalityMix";

function CampusDetails({ campus }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <Card>
      <SoftBox p={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <SoftTypography variant="h6" fontWeight="medium">
            Location Details
          </SoftTypography>
          <SoftButton
            variant="text"
            color="info"
            size="small"
            endIcon={<Icon>{isExpanded ? "expand_less" : "expand_more"}</Icon>}
            onClick={toggleExpanded}
          >
            {isExpanded ? "SHOW LESS" : "SHOW MORE"}
          </SoftButton>
        </SoftBox>

        <Collapse in={isExpanded} timeout={300} unmountOnExit>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <SoftBox>
                <CampusFacilities facilities={campus.amenities} />
              </SoftBox>
            </Grid>

            <Grid item xs={12} md={8}>
              <SoftBox>
                <SoftTypography variant="h6" fontWeight="medium" mb={2}>
                  Participants from
                </SoftTypography>
                <CampusNationalityMix
                  nationalityMix={campus.nationalityMix}
                  nationalities={campus.nationalities}
                />
              </SoftBox>
            </Grid>
          </Grid>
        </Collapse>
      </SoftBox>
    </Card>
  );
}

CampusDetails.propTypes = {
  campus: PropTypes.object.isRequired,
};

export default CampusDetails;
