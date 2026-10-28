import PropTypes from "prop-types";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

function PromoCodesListHeader({ onCreateClick }) {
  return (
    <SoftBox
      display="flex"
      flexDirection={{ xs: "column", sm: "row" }}
      alignItems={{ xs: "stretch", sm: "flex-start" }}
      justifyContent="space-between"
      gap={2}
      p={3}
      pb={2}
    >
      <SoftBox lineHeight={1} sx={{ flex: "1 1 auto", minWidth: 0 }}>
        <SoftTypography variant="h5" fontWeight="medium">
          Promo Codes
        </SoftTypography>
      </SoftBox>

      <SoftBox sx={{ flex: "0 0 auto", alignSelf: { xs: "stretch", sm: "flex-start" } }}>
        <SoftButton
          variant="gradient"
          color="info"
          onClick={onCreateClick}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          + Create Promo Code
        </SoftButton>
      </SoftBox>
    </SoftBox>
  );
}

PromoCodesListHeader.propTypes = {
  onCreateClick: PropTypes.func.isRequired,
};

export default PromoCodesListHeader;
