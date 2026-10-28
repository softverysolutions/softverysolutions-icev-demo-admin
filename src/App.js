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

import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";

// react-router components
import { Routes, Route, Navigate, useLocation } from "react-router-dom";

// @mui material components
import { ThemeProvider } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";

// Soft UI Dashboard PRO React example components
import Sidenav from "examples/Sidenav";

// Soft UI Dashboard PRO React themes
import theme from "assets/theme";

// Soft UI Dashboard PRO React routes
import routes from "routes";

// Soft UI Dashboard PRO React contexts
import { useSoftUIController, setMiniSidenav } from "context";

// Auth Context
import { AuthProvider, useAuth } from "context/AuthContext";
import { CurrencyProvider } from "context/CurrencyContext";

import { filterRoutesForRole } from "permissions/filterRoutes";
import { homePathForRole } from "permissions/can";

// Images
import brand from "assets/images/softvery-demo-admin-logo.png";

function DashboardChrome({ children, controllerProps }) {
  const { userProfile } = useAuth();
  const navRoutes = useMemo(
    () => filterRoutesForRole(routes, userProfile?.role),
    [userProfile?.role]
  );

  return (
    <>
      {controllerProps.layout === "dashboard" && (
        <Sidenav
          color={controllerProps.sidenavColor}
          brand={brand}
          brandName="Softvery Demo Admin"
          routes={navRoutes}
          onMouseEnter={controllerProps.onMouseEnter}
          onMouseLeave={controllerProps.onMouseLeave}
        />
      )}
      {children}
    </>
  );
}

DashboardChrome.propTypes = {
  children: PropTypes.node,
  controllerProps: PropTypes.shape({
    layout: PropTypes.string,
    sidenavColor: PropTypes.string,
    onMouseEnter: PropTypes.func,
    onMouseLeave: PropTypes.func,
  }).isRequired,
};

function FallbackRedirect() {
  const { currentUser, userProfile } = useAuth();
  if (!currentUser) return <Navigate to="/authentication/sign-in/basic" replace />;
  return <Navigate to={homePathForRole(userProfile?.role)} replace />;
}

export default function App() {
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, layout, sidenavColor } = controller;
  const [onMouseEnter, setOnMouseEnter] = useState(false);
  const { pathname } = useLocation();

  // Open sidenav when mouse enter on mini sidenav
  const handleOnMouseEnter = () => {
    if (miniSidenav && !onMouseEnter) {
      setMiniSidenav(dispatch, false);
      setOnMouseEnter(true);
    }
  };

  // Close sidenav when mouse leave mini sidenav
  const handleOnMouseLeave = () => {
    if (onMouseEnter) {
      setMiniSidenav(dispatch, true);
      setOnMouseEnter(false);
    }
  };

  // Setting page scroll to 0 when changing the route
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.scrollingElement.scrollTop = 0;
  }, [pathname]);

  const getRoutes = (allRoutes) =>
    allRoutes.map((route) => {
      if (route.collapse) {
        return getRoutes(route.collapse);
      }

      if (route.route) {
        return <Route exact path={route.route} element={route.component} key={route.key} />;
      }

      return null;
    });

  const dashboardChromeProps = {
    layout,
    sidenavColor,
    onMouseEnter: handleOnMouseEnter,
    onMouseLeave: handleOnMouseLeave,
  };

  return (
    <CurrencyProvider>
      <AuthProvider>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <DashboardChrome controllerProps={dashboardChromeProps}>
            <Routes>
              {getRoutes(routes)}
              <Route path="*" element={<FallbackRedirect />} />
            </Routes>
          </DashboardChrome>
        </ThemeProvider>
      </AuthProvider>
    </CurrencyProvider>
  );
}
