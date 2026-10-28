import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { formatExperienceType } from "utils/experienceTypeUtils";

function ExperiencesSection({ experiences }) {
  const items = Array.isArray(experiences) ? experiences : [];
  if (items.length === 0) return null;

  return (
    <Card
      sx={{
        height: "100%",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        overflow: "hidden",
      }}
    >
      <SoftBox p={3}>
        <SoftBox
          mb={3}
          sx={{
            paddingBottom: "16px",
            borderBottom: "2px solid #f5f5f5",
          }}
        >
          <SoftTypography
            variant="h6"
            fontWeight="600"
            sx={{
              fontSize: "18px",
              color: "#212121",
            }}
          >
            Experiences
          </SoftTypography>
          <SoftTypography variant="caption" color="text.secondary" display="block" mt={0.5}>
            Included in the booked package (read-only)
          </SoftTypography>
        </SoftBox>

        <SoftBox display="flex" flexDirection="column" gap={1.5}>
          {items.map((item) => (
            <SoftBox
              key={item.travelExperienceId || item.id}
              p={1.5}
              borderRadius="lg"
              border="1px solid"
              borderColor="grey.300"
              bgcolor="background.paper"
            >
              <SoftTypography variant="button" fontWeight="medium" display="block">
                {item.name}
              </SoftTypography>
              <SoftBox display="flex" flexWrap="wrap" gap={0.5} mt={0.5}>
                {item.type && (
                  <Chip label={formatExperienceType(item.type)} size="small" variant="outlined" />
                )}
                {item.duration && <Chip label={item.duration} size="small" variant="outlined" />}
                {item.location && <Chip label={item.location} size="small" variant="outlined" />}
              </SoftBox>
            </SoftBox>
          ))}
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

ExperiencesSection.propTypes = {
  experiences: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      travelExperienceId: PropTypes.string,
      name: PropTypes.string,
      type: PropTypes.string,
      duration: PropTypes.string,
      location: PropTypes.string,
    })
  ),
};

export default ExperiencesSection;
