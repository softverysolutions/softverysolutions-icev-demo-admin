import { Link } from "react-router-dom";

import PropTypes from "prop-types";

import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import colors from "assets/theme/base/colors";
import typography from "assets/theme/base/typography";

function ProfileInfoCard({ title, description, info, social, action }) {
  const labels = [];
  const values = [];
  const { socialMediaColors } = colors;
  const { size } = typography;

  Object.keys(info).forEach((el) => {
    if (el.match(/[A-Z\s]+/)) {
      const uppercaseLetter = Array.from(el).find((i) => i.match(/[A-Z]+/));
      const newElement = el.replace(uppercaseLetter, ` ${uppercaseLetter.toLowerCase()}`);

      labels.push(newElement);
    } else {
      labels.push(el);
    }
  });

  Object.values(info).forEach((el) => values.push(el));

  const renderItems = labels.map((label, key) => {
    const value = values[key];
    const isPhoneNumber =
      label.toLowerCase().includes("phone") ||
      label.toLowerCase().includes("mobile") ||
      label.toLowerCase().includes("number");

    return (
      <SoftBox key={label} display="flex" py={1} pr={2} alignItems="center">
        <SoftTypography variant="button" fontWeight="bold" textTransform="capitalize">
          {label}: &nbsp;
        </SoftTypography>
        <SoftTypography variant="button" fontWeight="regular" color="text">
          &nbsp;{value}
        </SoftTypography>
        {isPhoneNumber && value && (
          <SoftBox ml={1}>
            <Tooltip title="Chat on WhatsApp" placement="top">
              <SoftBox
                component="a"
                href={`https://wa.me/${value.replace(/\D/g, "")}`}
                target="_blank"
                rel="noreferrer"
                sx={{
                  color: "#25D366",
                  fontSize: "1.2rem",
                  cursor: "pointer",
                  "&:hover": {
                    opacity: 0.8,
                  },
                }}
              >
                <Icon sx={{ fontSize: "1.2rem" }}>chat</Icon>
              </SoftBox>
            </Tooltip>
          </SoftBox>
        )}
      </SoftBox>
    );
  });

  const renderSocial = social.map(({ link, icon, color }) => (
    <SoftBox
      key={color}
      component="a"
      href={link}
      target="_blank"
      rel="noreferrer"
      fontSize={size.lg}
      color={socialMediaColors[color].main}
      pr={1}
      pl={0.5}
      lineHeight={1}
    >
      {icon}
    </SoftBox>
  ));

  return (
    <Card sx={{ height: "100%" }}>
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" pt={2} px={2}>
        <SoftTypography variant="h6" fontWeight="medium" textTransform="capitalize">
          {title}
        </SoftTypography>
        {action.tooltip && (
          <SoftTypography component={Link} to={action.route} variant="body2" color="secondary">
            <Tooltip title={action.tooltip} placement="top">
              <Icon>edit</Icon>
            </Tooltip>
          </SoftTypography>
        )}
      </SoftBox>
      <SoftBox p={2}>
        <SoftBox mb={2} lineHeight={1}>
          <SoftTypography variant="button" color="text" fontWeight="regular">
            {description}
          </SoftTypography>
        </SoftBox>
        <SoftBox opacity={0.3}>
          <Divider />
        </SoftBox>
        <SoftBox>
          {renderItems}
          {social && social.length > 0 && (
            <SoftBox display="flex" py={1} pr={2}>
              <SoftTypography variant="button" fontWeight="bold" textTransform="capitalize">
                social: &nbsp;
              </SoftTypography>
              {renderSocial}
            </SoftBox>
          )}
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

ProfileInfoCard.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  info: PropTypes.objectOf(PropTypes.string).isRequired,
  social: PropTypes.arrayOf(PropTypes.object),
  action: PropTypes.shape({
    route: PropTypes.string.isRequired,
    tooltip: PropTypes.string.isRequired,
  }).isRequired,
};

export default ProfileInfoCard;
