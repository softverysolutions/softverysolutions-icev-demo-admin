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

import { useEffect, useState } from "react";

// react-router-dom components
import { useLocation, NavLink } from "react-router-dom";

// prop-types is a library for typechecking of props.
import PropTypes from "prop-types";

// @mui material components
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Icon from "@mui/material/Icon";

// Soft UI Dashboard PRO React components
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

// Soft UI Dashboard PRO React example components
import SidenavCollapse from "examples/Sidenav/SidenavCollapse";
import SidenavList from "examples/Sidenav/SidenavList";
import SidenavItem from "examples/Sidenav/SidenavItem";

// Soft UI Dashboard PRO React icons

// Custom styles for the Sidenav
import SidenavRoot from "examples/Sidenav/SidenavRoot";

// Soft UI Dashboard PRO React context
import { useSoftUIController, setMiniSidenav } from "context";

function Sidenav({ color = "info", brand = "", brandName, routes, ...rest }) {
  const [openCollapse, setOpenCollapse] = useState(false);
  const [openNestedCollapse, setOpenNestedCollapse] = useState(false);
  const [controller, dispatch] = useSoftUIController();
  const { miniSidenav, transparentSidenav } = controller;
  const location = useLocation();
  const { pathname } = location;
  const pathSegments = pathname.split("/").filter(Boolean);
  const collapseName = pathSegments[0];
  const itemName = pathSegments[1];

  const isCollapseActive = (key, collapse) => {
    if (collapse?.length) {
      return collapse.some(
        (c) => c.route && (pathname === c.route || pathname.startsWith(`${c.route}/`))
      );
    }
    return key === collapseName;
  };

  // Keep the group that holds the current page expanded.
  useEffect(() => {
    const active = routes.find(
      ({ type, collapse }) => type === "collapse" && isCollapseActive(null, collapse)
    );
    if (active) setOpenCollapse(active.key);
  }, [pathname]);

  const closeSidenav = () => setMiniSidenav(dispatch, true);

  useEffect(() => {
    function handleMiniSidenav() {
      setMiniSidenav(dispatch, window.innerWidth < 1200);
    }

    window.addEventListener("resize", handleMiniSidenav);

    handleMiniSidenav();

    return () => window.removeEventListener("resize", handleMiniSidenav);
  }, [dispatch, location]);

  const renderNestedCollapse = (collapse) => {
    const template = collapse.map(({ name, route, key, href }) =>
      href ? (
        <Link
          key={key}
          href={href}
          target="_blank"
          rel="noreferrer"
          sx={{ textDecoration: "none" }}
        >
          <SidenavItem name={name} nested />
        </Link>
      ) : (
        <NavLink to={route} key={key} sx={{ textDecoration: "none" }}>
          <SidenavItem
            name={name}
            active={route === pathname || (route && pathname.startsWith(`${route}/`))}
            nested
          />
        </NavLink>
      )
    );

    return template;
  };

  const renderCollapse = (collapses) =>
    collapses.map(({ name, collapse, route, href, key }) => {
      let returnValue;

      if (collapse) {
        returnValue = (
          <SidenavItem
            key={key}
            name={name}
            active={key === itemName}
            open={openNestedCollapse === name}
            onClick={() =>
              openNestedCollapse === name
                ? setOpenNestedCollapse(false)
                : setOpenNestedCollapse(name)
            }
          >
            {renderNestedCollapse(collapse)}
          </SidenavItem>
        );
      } else {
        returnValue = href ? (
          <Link
            href={href}
            key={key}
            target="_blank"
            rel="noreferrer"
            sx={{ textDecoration: "none" }}
          >
            <SidenavItem name={name} active={key === itemName} />
          </Link>
        ) : (
          <NavLink to={route} key={key} sx={{ textDecoration: "none" }}>
            <SidenavItem
              name={name}
              active={route === pathname || (route && pathname.startsWith(`${route}/`))}
            />
          </NavLink>
        );
      }
      return <SidenavList key={key}>{returnValue}</SidenavList>;
    });

  // Render all the routes from the routes.js (All the visible items on the Sidenav)
  const renderRoutes = routes.map(
    ({ type, name, icon, title, collapse, noCollapse, key, href, route }) => {
      let returnValue;

      if (type === "collapse") {
        if (href) {
          returnValue = (
            <Link
              href={href}
              key={key}
              target="_blank"
              rel="noreferrer"
              sx={{ textDecoration: "none" }}
            >
              <SidenavCollapse
                name={name}
                icon={icon}
                active={isCollapseActive(key, collapse)}
                noCollapse={noCollapse}
              />
            </Link>
          );
        } else if (noCollapse && route) {
          returnValue = (
            <NavLink to={route} key={key}>
              <SidenavCollapse
                name={name}
                icon={icon}
                noCollapse={noCollapse}
                active={isCollapseActive(key, collapse)}
              >
                {collapse ? renderCollapse(collapse) : null}
              </SidenavCollapse>
            </NavLink>
          );
        } else {
          returnValue = (
            <SidenavCollapse
              key={key}
              name={name}
              icon={icon}
              active={isCollapseActive(key, collapse)}
              open={openCollapse === key}
              onClick={() => (openCollapse === key ? setOpenCollapse(false) : setOpenCollapse(key))}
            >
              {collapse ? renderCollapse(collapse) : null}
            </SidenavCollapse>
          );
        }
      } else if (type === "title") {
        returnValue = (
          <SoftTypography
            key={key}
            display="block"
            variant="caption"
            fontWeight="bold"
            textTransform="uppercase"
            opacity={0.6}
            pl={3}
            mt={2}
            mb={1}
            ml={1}
          >
            {title}
          </SoftTypography>
        );
      } else if (type === "divider") {
        returnValue = <Divider key={key} />;
      }

      return returnValue;
    }
  );

  return (
    <SidenavRoot {...rest} variant="permanent" ownerState={{ transparentSidenav, miniSidenav }}>
      <SoftBox pt={3} pb={1} px={4} textAlign="center">
        <SoftBox
          display={{ xs: "block", xl: "none" }}
          position="absolute"
          top={0}
          right={0}
          p={1.625}
          onClick={closeSidenav}
          sx={{ cursor: "pointer" }}
        >
          <SoftTypography variant="h6" color="secondary">
            <Icon sx={{ fontWeight: "bold" }}>close</Icon>
          </SoftTypography>
        </SoftBox>
        <SoftBox component={NavLink} to="/home/analytics" display="flex" alignItems="center">
          {brand && <SoftBox component="img" src={brand} alt="brand" width="12rem" mr={1} />}
        </SoftBox>
      </SoftBox>
      <Divider />
      <List>{renderRoutes}</List>
    </SidenavRoot>
  );
}

// Typechecking props for the Sidenav
Sidenav.propTypes = {
  color: PropTypes.oneOf(["primary", "secondary", "info", "success", "warning", "error", "dark"]),
  brand: PropTypes.string,
  brandName: PropTypes.string.isRequired,
  routes: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default Sidenav;
