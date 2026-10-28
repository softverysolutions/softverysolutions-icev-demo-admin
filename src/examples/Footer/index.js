/**
=========================================================
* Soft UI Dashboard PRO React - v4.0.3
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-pro-react
* Copyright 2024 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

function Footer() {
  return (
    <SoftBox
      component="footer"
      py={3}
      mt={4}
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      flexWrap="wrap"
      gap={1}
      sx={{ borderTop: "1px solid #E7E5F0" }}
    >
      <SoftTypography variant="button" color="text" fontWeight="regular">
        Demo by <strong>Softvery Solutions</strong>
      </SoftTypography>
      <SoftTypography variant="caption" color="text">
        Offline demo · sample data only
      </SoftTypography>
    </SoftBox>
  );
}

export default Footer;
