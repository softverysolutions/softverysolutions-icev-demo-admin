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

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import Collapse from "@mui/material/Collapse";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Icon from "@mui/material/Icon";

// Soft UI Dashboard PRO React components
import SoftBox from "components/SoftBox";

// Custom styles for the SidenavCollapse
import {
  collapseItem,
  collapseIconBox,
  collapseIcon,
  collapseText,
  collapseArrow,
} from "examples/Sidenav/styles/sidenavCollapse";

// Soft UI Dashboard PRO React context
import { useSoftUIController } from "context";

function SidenavCollapse({
  icon,
  name,
  children = false,
  active = false,
  noCollapse = false,
  open = false,
  badgeCount = 0,
  showDot = false,
  ...rest
}) {
  const [controller] = useSoftUIController();
  const { miniSidenav, transparentSidenav, sidenavColor } = controller;

  return (
    <>
      <ListItem component="li">
        <SoftBox {...rest} sx={(theme) => collapseItem(theme, { active, transparentSidenav })}>
          <ListItemIcon
            sx={(theme) => ({
              ...collapseIconBox(theme, { active, transparentSidenav, sidenavColor }),
              position: "relative",
            })}
          >
            {typeof icon === "string" ? (
              <Icon sx={(theme) => collapseIcon(theme, { active })}>{icon}</Icon>
            ) : (
              icon
            )}
            {miniSidenav && (badgeCount > 0 || showDot) && (
              <SoftBox
                sx={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: "error.main",
                  border: "1px solid #fff",
                }}
              />
            )}
          </ListItemIcon>

          <ListItemText
            primary={name}
            sx={(theme) => collapseText(theme, { miniSidenav, transparentSidenav, active })}
          />

          {!miniSidenav && (badgeCount > 0 || showDot) && (
            <SoftBox display="flex" alignItems="center" gap={0.75} mr={1} flexShrink={0}>
              {showDot && (
                <SoftBox
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    backgroundColor: "error.main",
                  }}
                />
              )}
              {badgeCount > 0 && (
                <SoftBox
                  sx={{
                    minWidth: 18,
                    height: 18,
                    px: 0.5,
                    borderRadius: "50%",
                    backgroundColor: "error.main",
                    color: "#fff",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    lineHeight: 1,
                  }}
                >
                  {badgeCount > 99 ? "99+" : badgeCount}
                </SoftBox>
              )}
            </SoftBox>
          )}

          <Icon
            sx={(theme) =>
              collapseArrow(theme, { noCollapse, transparentSidenav, miniSidenav, open })
            }
          >
            expand_less
          </Icon>
        </SoftBox>
      </ListItem>
      {children && (
        <Collapse in={open} unmountOnExit>
          {children}
        </Collapse>
      )}
    </>
  );
}


// Typechecking props for the SidenavCollapse
SidenavCollapse.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  icon: PropTypes.node.isRequired,
  name: PropTypes.string.isRequired,
  children: PropTypes.node,
  active: PropTypes.bool,
  noCollapse: PropTypes.bool,
  open: PropTypes.bool,
  badgeCount: PropTypes.number,
  showDot: PropTypes.bool,
};

export default SidenavCollapse;
