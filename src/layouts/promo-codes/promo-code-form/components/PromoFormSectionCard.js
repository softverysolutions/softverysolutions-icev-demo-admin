import PropTypes from "prop-types";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function PromoFormSectionCard({ title, subtitle, headerRight, children }) {
  return (
    <SoftBox
      sx={{
        borderRadius: 2,
        border: 1,
        borderStyle: "solid",
        borderColor: "grey.300",
        bgcolor: "grey.50",
        p: { xs: 2, sm: 2.5 },
      }}
    >
      <SoftBox display="flex" alignItems="flex-start" justifyContent="space-between" gap={2} mb={subtitle ? 0.5 : 1.5}>
        <SoftTypography variant="h6" fontWeight="bold" display="block" sx={{ flex: "1 1 auto" }}>
          {title}
        </SoftTypography>
        {headerRight ? <SoftBox flexShrink={0}>{headerRight}</SoftBox> : null}
      </SoftBox>
      {subtitle ? (
        <SoftTypography variant="caption" color="text" display="block" mb={2}>
          {subtitle}
        </SoftTypography>
      ) : null}
      {children}
    </SoftBox>
  );
}

PromoFormSectionCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  headerRight: PropTypes.node,
  children: PropTypes.node,
};

export default PromoFormSectionCard;
