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

import { useState, useEffect } from "react";

// react-router components
import { useLocation, useNavigate } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui core components
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import SmartBreadcrumbs from "examples/Breadcrumbs/SmartBreadcrumbs";

import {
  navbar,
  navbarContainer,
  navbarRow,
  navbarIconButton,
  navbarDesktopMenu,
  navbarMobileMenu,
} from "examples/Navbars/DashboardNavbar/styles";

import { useSoftUIController, setTransparentNavbar, setMiniSidenav } from "context";
import { useAuth } from "context/AuthContext";
import { DEMO_ROLES } from "demo/session";
import { resetDemo } from "demo/reset";

const roleLabel = (role) => DEMO_ROLES.find((r) => r.value === role)?.label || "Consultant";

function DashboardNavbar({ absolute = false, light = false, isMini = false }) {
  const [navbarType, setNavbarType] = useState();
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, fixedNavbar, transparentNavbar } = controller;
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, signOut } = useAuth();
  const route = location.pathname.split("/").slice(1);
  const isCampusPage = location.pathname.includes("/campus/");

  useEffect(() => {
    if (fixedNavbar) {
      setNavbarType("sticky");
    } else {
      setNavbarType("static");
    }

    function handleTransparentNavbar() {
      setTransparentNavbar(dispatch, (fixedNavbar && window.scrollY === 0) || !fixedNavbar);
    }

    window.addEventListener("scroll", handleTransparentNavbar);

    handleTransparentNavbar();

    return () => window.removeEventListener("scroll", handleTransparentNavbar);
  }, [dispatch, fixedNavbar]);

  const handleMiniSidenav = () => setMiniSidenav(dispatch, !miniSidenav);
  const closeMenu = () => setMenuAnchor(null);

  const name =
    [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(" ") ||
    userProfile?.email ||
    "Demo operator";

  const handleSwitchRole = () => {
    closeMenu();
    navigate("/authentication/sign-in/basic");
  };

  const handleSignOut = async () => {
    closeMenu();
    await signOut();
    navigate("/authentication/sign-in/basic");
  };

  const handleReset = async () => {
    setResetting(true);
    await resetDemo();
  };

  const textColor = light ? "white" : "dark";

  return (
    <AppBar
      position={absolute ? "absolute" : navbarType}
      color="inherit"
      sx={(theme) => navbar(theme, { transparentNavbar, absolute, light })}
    >
      <Toolbar sx={(theme) => navbarContainer(theme)}>
        <SoftBox color="inherit" mb={{ xs: 1, md: 0 }} sx={(theme) => navbarRow(theme, { isMini })}>
          {!isCampusPage && (
            <SmartBreadcrumbs
              icon="home"
              title={route[route.length - 1]}
              route={route}
              light={light}
            />
          )}
          <Icon fontSize="medium" sx={navbarDesktopMenu} onClick={handleMiniSidenav}>
            {miniSidenav ? "menu_open" : "menu"}
          </Icon>
        </SoftBox>
        {isMini ? null : (
          <SoftBox sx={(theme) => navbarRow(theme, { isMini })}>
            <SoftBox color={light ? "white" : "inherit"} display="flex" alignItems="center">
              <IconButton
                sx={navbarIconButton}
                size="small"
                aria-controls="user-menu"
                aria-haspopup="true"
                data-testid="user-menu-button"
                onClick={(event) => setMenuAnchor(event.currentTarget)}
              >
                <Icon sx={({ palette: { dark, white } }) => ({ color: light ? white.main : dark.main })}>
                  account_circle
                </Icon>
                <SoftBox display="flex" flexDirection="column" alignItems="flex-start" ml={0.5}>
                  <SoftTypography variant="button" fontWeight="medium" color={textColor} lineHeight={1.2}>
                    {name}
                  </SoftTypography>
                  <SoftTypography variant="caption" color="text" lineHeight={1.2}>
                    {roleLabel(userProfile?.role)}
                  </SoftTypography>
                </SoftBox>
                <Icon fontSize="small" sx={{ ml: 0.5 }}>
                  expand_more
                </Icon>
              </IconButton>
              <IconButton
                size="small"
                color="inherit"
                sx={navbarMobileMenu}
                onClick={handleMiniSidenav}
              >
                <Icon className={light ? "text-white" : "text-dark"}>
                  {miniSidenav ? "menu_open" : "menu"}
                </Icon>
              </IconButton>
              <Menu
                id="user-menu"
                anchorEl={menuAnchor}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                open={Boolean(menuAnchor)}
                onClose={closeMenu}
                sx={{ mt: 1 }}
              >
                <SoftBox px={2} py={1}>
                  <SoftTypography variant="caption" color="text" display="block">
                    Signed in as
                  </SoftTypography>
                  <SoftTypography variant="button" fontWeight="bold" display="block">
                    {userProfile?.email}
                  </SoftTypography>
                </SoftBox>
                <Divider sx={{ my: 0.5 }} />
                <MenuItem onClick={handleSwitchRole}>
                  <Icon fontSize="small" sx={{ mr: 1 }}>
                    switch_account
                  </Icon>
                  Switch role
                </MenuItem>
                <MenuItem
                  data-testid="reset-demo"
                  onClick={() => {
                    closeMenu();
                    setConfirmReset(true);
                  }}
                >
                  <Icon fontSize="small" sx={{ mr: 1 }}>
                    restart_alt
                  </Icon>
                  Reset demo
                </MenuItem>
                <MenuItem onClick={handleSignOut}>
                  <Icon fontSize="small" sx={{ mr: 1 }}>
                    logout
                  </Icon>
                  Sign out
                </MenuItem>
              </Menu>
            </SoftBox>
          </SoftBox>
        )}
      </Toolbar>
      <Dialog open={confirmReset} onClose={() => !resetting && setConfirmReset(false)}>
        <DialogTitle>Reset demo?</DialogTitle>
        <DialogContent>
          <SoftTypography variant="body2" color="text">
            Every change made in this browser (programmes, packages, orders, promo codes,
            moderation and uploads) is discarded and the original sample data comes back.
          </SoftTypography>
        </DialogContent>
        <DialogActions>
          <SoftButton variant="text" color="dark" disabled={resetting} onClick={() => setConfirmReset(false)}>
            Cancel
          </SoftButton>
          <SoftButton variant="gradient" color="info" disabled={resetting} onClick={handleReset}>
            {resetting ? "Resetting…" : "Reset demo"}
          </SoftButton>
        </DialogActions>
      </Dialog>
    </AppBar>
  );
}

DashboardNavbar.propTypes = {
  absolute: PropTypes.bool,
  light: PropTypes.bool,
  isMini: PropTypes.bool,
};

export default DashboardNavbar;
