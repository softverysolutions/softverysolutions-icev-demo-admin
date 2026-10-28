import { isIdSegment, routeMapping, specialSegments, segmentDisplayNames } from "./breadcrumbUtils";

export const getDisplayName = (segment, isLoading, breadcrumbData) => {
  if (isLoading) {
    return segment;
  }

  if (segmentDisplayNames[segment]) {
    return segmentDisplayNames[segment];
  }

  if (isIdSegment(segment) && breadcrumbData[segment]) {
    return breadcrumbData[segment];
  }

  if (isIdSegment(segment)) {
    return null;
  }

  return segment;
};

export const shouldShowSegment = (segment, isLoading, breadcrumbData) => {
  if (isLoading) return true;

  if (specialSegments.includes(segment)) {
    return false;
  }

  if (isIdSegment(segment) && !breadcrumbData[segment]) {
    return false;
  }

  return true;
};

export const getDisplayTitle = (title, isLoading, breadcrumbData) => {
  if (isLoading) return title;

  if (segmentDisplayNames[title]) {
    return segmentDisplayNames[title];
  }

  if (isIdSegment(title) && breadcrumbData[title]) {
    return breadcrumbData[title];
  }

  if (isIdSegment(title)) {
    return null;
  }

  return title;
};

export const buildBreadcrumbUrl = (segmentIndex, memoizedRoute) => {
  const segments = memoizedRoute.slice(0, segmentIndex + 1);

  if (segments.length === 1) {
    const firstSegment = segments[0];
    if (routeMapping[firstSegment]) {
      return routeMapping[firstSegment];
    }
  }

  if (segments.includes("schools") && segments.includes("view")) {
    if (segments.includes("campus")) {
      const schoolIdIndex = segments.findIndex((s) => isIdSegment(s));
      const campusIdIndex = segments.findIndex((s, i) => i > schoolIdIndex && isIdSegment(s));

      if (schoolIdIndex !== -1 && campusIdIndex !== -1) {
        return `/schools/view/${segments[schoolIdIndex]}/campus/${segments[campusIdIndex]}`;
      }
    } else {
      const schoolIdIndex = segments.findIndex((s) => isIdSegment(s));
      if (schoolIdIndex !== -1) {
        return `/schools/view/${segments[schoolIdIndex]}`;
      }
    }
  }

  if (segments.includes("orders") && segments.includes("view")) {
    const orderIdIndex = segments.findIndex((s) => isIdSegment(s));
    if (orderIdIndex !== -1) {
      return `/orders/view/${segments[orderIdIndex]}`;
    }
  }

  for (let i = segments.length - 1; i >= 0; i--) {
    const segment = segments[i];

    if (specialSegments.includes(segment)) {
      continue;
    }

    if (isIdSegment(segment)) {
      if (segments.includes("schools")) {
        if (segments.includes("campus")) {
          const schoolIdIndex = segments.findIndex((s) => isIdSegment(s) && s !== segment);
          if (schoolIdIndex !== -1) {
            return `/schools/view/${segments[schoolIdIndex]}`;
          }
        } else {
          return "/schools/schools-list";
        }
      } else if (segments.includes("orders")) {
        return "/orders/orders-list";
      }
    }

    if (routeMapping[segment]) {
      return routeMapping[segment];
    }
  }

  return "/home/analytics";
};

export const createBreadcrumbItems = (memoizedRoute, breadcrumbData, isLoading) => {
  const items = [];

  if (memoizedRoute.includes("schools") && memoizedRoute.includes("campus")) {
    items.push({
      key: "schools",
      displayName: "Providers",
      url: "/schools/schools-list",
      isClickable: true,
    });

    const schoolIdIndex = memoizedRoute.findIndex((s) => isIdSegment(s));
    const campusIdIndex = memoizedRoute.findIndex((s, i) => i > schoolIdIndex && isIdSegment(s));

    if (schoolIdIndex !== -1) {
      const schoolId = memoizedRoute[schoolIdIndex];
      const schoolName = breadcrumbData[schoolId];

      items.push({
        key: schoolId,
        displayName: schoolName || (isLoading ? "Loading..." : "Provider"),
        url: `/schools/view/${schoolId}`,
        isClickable: true,
      });
    }

    if (campusIdIndex !== -1) {
      const campusId = memoizedRoute[campusIdIndex];
      const campusName = breadcrumbData[campusId];

      items.push({
        key: campusId,
        displayName: campusName || (isLoading ? "Loading..." : "Location"),
        url: null,
        isClickable: false,
      });
    }
  } else {
    const routes = memoizedRoute.slice(0, -1);

    routes
      .filter((el) => shouldShowSegment(el, isLoading, breadcrumbData))
      .forEach((el, index) => {
        const displayName = getDisplayName(el, isLoading, breadcrumbData);
        if (!displayName) return;

        const breadcrumbUrl = buildBreadcrumbUrl(index, memoizedRoute);

        items.push({
          key: el,
          displayName: displayName,
          url: breadcrumbUrl,
          isClickable: true,
        });
      });

    const lastSegment = memoizedRoute[memoizedRoute.length - 1];
    const displayName = getDisplayName(lastSegment, isLoading, breadcrumbData);

    if (shouldShowSegment(lastSegment, isLoading, breadcrumbData) && displayName) {
      items.push({
        key: lastSegment,
        displayName: displayName,
        url: null,
        isClickable: false,
      });
    }
  }

  return items;
};
