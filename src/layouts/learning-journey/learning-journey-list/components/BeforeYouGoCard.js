import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// The app adds these steps before week 1 of every booking; they are not editable here.
function BeforeYouGoCard({ steps }) {
  return (
    <Card sx={{ mb: 2 }}>
      <SoftBox p={2.5}>
        <SoftBox display="flex" alignItems="center" gap={1} mb={1.5}>
          <Icon sx={{ color: "#0B7A5A" }}>luggage</Icon>
          <SoftTypography variant="h6" fontWeight="bold">
            Before you go
          </SoftTypography>
          <SoftTypography variant="caption" color="secondary">
            added automatically to every booking, before week 1
          </SoftTypography>
        </SoftBox>
        <SoftBox
          display="grid"
          gap={1.5}
          sx={{ gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", xl: "repeat(4, 1fr)" } }}
        >
          {steps.map((step) => (
            <SoftBox
              key={step.title}
              display="flex"
              gap={1}
              p={1.5}
              borderRadius="lg"
              sx={{ backgroundColor: "#E6FBF4", border: "1px solid #B5F3DE" }}
            >
              <Icon fontSize="small" sx={{ color: "#0B7A5A", mt: 0.25 }}>
                {step.icon}
              </Icon>
              <SoftBox>
                <SoftTypography variant="button" fontWeight="bold" display="block">
                  {step.title}
                </SoftTypography>
                <SoftTypography variant="caption" color="text">
                  {step.subtitle}
                </SoftTypography>
              </SoftBox>
            </SoftBox>
          ))}
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

BeforeYouGoCard.propTypes = {
  steps: PropTypes.arrayOf(
    PropTypes.shape({ icon: PropTypes.string, title: PropTypes.string, subtitle: PropTypes.string })
  ).isRequired,
};

export default BeforeYouGoCard;
