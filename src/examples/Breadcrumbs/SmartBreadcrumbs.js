import { useMemo } from "react";
import { Link } from "react-router-dom";
import PropTypes from "prop-types";
import { Breadcrumbs as MuiBreadcrumbs } from "@mui/material";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import { useBreadcrumbData } from "./hooks/useBreadcrumbData";
import { createBreadcrumbItems, getDisplayTitle } from "./utils/breadcrumbHelpers";
import { markIdSegments } from "./utils/breadcrumbUtils";
import BreadcrumbItem from "./components/BreadcrumbItem";

function SmartBreadcrumbs({ icon, title, route, light = false }) {
  const memoizedRoute = useMemo(() => {
    markIdSegments(route);
    return route;
  }, [route.join("/")]);
  const { breadcrumbData, isLoading } = useBreadcrumbData(memoizedRoute);

  const hasRealNames = Object.values(breadcrumbData).some((name) => name && name.length < 20);

  if (!hasRealNames && isLoading) {
    return null;
  }

  if (isLoading) {
    return null;
  }

  const displayTitle = getDisplayTitle(title, isLoading, breadcrumbData);
  const breadcrumbItems = createBreadcrumbItems(memoizedRoute, breadcrumbData, isLoading);
  const lastItemName = breadcrumbItems.length > 0 ? breadcrumbItems[breadcrumbItems.length - 1].displayName : null;
  const showDisplayTitle = displayTitle && displayTitle !== lastItemName;

  return (
    <SoftBox
      mr={{ xs: 0, xl: 8 }}
      sx={{
        minWidth: 0,
        flex: 1,
        overflow: "visible",
        display: "flex",
        alignItems: "center",
      }}
    >
      <MuiBreadcrumbs
        sx={{
          "& .MuiBreadcrumbs-separator": {
            color: ({ palette: { white, grey } }) => (light ? white.main : grey[600]),
            mx: 1,
          },
          "& .MuiBreadcrumbs-ol": {
            flexWrap: "nowrap",
            overflow: "visible",
            alignItems: "center",
            margin: 0,
            padding: 0,
          },
          "& .MuiBreadcrumbs-li": {
            minWidth: 0,
            flexShrink: 0,
            whiteSpace: "nowrap",
            overflow: "visible",
            display: "flex",
            alignItems: "center",
            margin: 0,
            padding: 0,
          },
        }}
        maxItems={20}
        itemsBeforeCollapse={8}
        itemsAfterCollapse={4}
      >
        <Link to="/home/analytics">
          <SoftTypography
            component="span"
            variant="body2"
            color={light ? "white" : "dark"}
            opacity={light ? 0.8 : 0.5}
            sx={{
              lineHeight: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Icon>{icon}</Icon>
          </SoftTypography>
        </Link>
        {breadcrumbItems.map((item) => (
          <BreadcrumbItem key={item.key} item={item} light={light} />
        ))}
      </MuiBreadcrumbs>
      {showDisplayTitle && (
        <SoftTypography
          variant="h6"
          fontWeight="medium"
          color={light ? "white" : "dark"}
          opacity={light ? 0.8 : 0.5}
          sx={{
            lineHeight: 0,
            mt: 1,
          }}
        >
          {displayTitle}
        </SoftTypography>
      )}
    </SoftBox>
  );
}

SmartBreadcrumbs.propTypes = {
  icon: PropTypes.node.isRequired,
  title: PropTypes.string,
  route: PropTypes.oneOfType([PropTypes.string, PropTypes.array]).isRequired,
  light: PropTypes.bool,
};

export default SmartBreadcrumbs;
