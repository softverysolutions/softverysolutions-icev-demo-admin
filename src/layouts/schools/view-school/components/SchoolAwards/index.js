import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Collapse from "@mui/material/Collapse";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import { SchoolAwardsService } from "services/schoolAwardsService";
import { formatImageUrl } from "utils/imageUtils";

function SchoolAwards({ awards: initialAwards, schoolId }) {
  const [awards, setAwards] = useState(initialAwards || []);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (schoolId) {
      loadSchoolAwards();
    }
  }, [schoolId]);

  const loadSchoolAwards = async () => {
    setIsLoading(true);
    try {
      const awardsData = await SchoolAwardsService.getSchoolAwards(schoolId);
      setAwards(awardsData);
    } catch (error) {
      console.error("Failed to load provider awards:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <SoftBox mb={3}>
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <SoftTypography variant="h6" fontWeight="medium">
          Awards and Accreditations
        </SoftTypography>
        {awards.length > 0 && (
          <SoftButton
            variant="text"
            color="info"
            size="small"
            endIcon={<Icon>{isExpanded ? "expand_less" : "expand_more"}</Icon>}
            onClick={toggleExpanded}
          >
            {isExpanded ? "SHOW LESS" : "SHOW MORE"}
          </SoftButton>
        )}
      </SoftBox>

      <Collapse in={isExpanded} timeout={300}>
        <Grid container spacing={2}>
          {isLoading ? (
            <Grid item xs={12}>
              <SoftTypography variant="body2" color="text">
                Loading awards...
              </SoftTypography>
            </Grid>
          ) : awards.length === 0 ? (
            <Grid item xs={12}>
              <SoftTypography variant="body2" color="text">
                No awards available for this provider.
              </SoftTypography>
            </Grid>
          ) : (
            awards.map((award) => (
              <Grid item xs={12} md={6} key={award.id}>
                <Card>
                  <SoftBox p={2}>
                    <SoftBox display="flex" alignItems="flex-start" gap={2}>
                      {(() => {
                        const imageUrl = formatImageUrl(award.imageUrl);
                        return (
                          imageUrl && (
                            <SoftBox
                              component="img"
                              src={imageUrl}
                              alt={award.caption}
                              width="80px"
                              height="60px"
                              borderRadius="md"
                              sx={{ objectFit: "cover" }}
                            />
                          )
                        );
                      })()}
                      <SoftBox flex={1}>
                        <SoftTypography variant="body2" color="text">
                          {award.caption}
                        </SoftTypography>
                      </SoftBox>
                    </SoftBox>
                  </SoftBox>
                </Card>
              </Grid>
            ))
          )}
        </Grid>
      </Collapse>
    </SoftBox>
  );
}

SchoolAwards.propTypes = {
  awards: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      caption: PropTypes.string.isRequired,
      imageUrl: PropTypes.string,
    })
  ),
  schoolId: PropTypes.string,
};

export default SchoolAwards;
