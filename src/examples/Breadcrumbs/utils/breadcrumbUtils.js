const breadcrumbCache = new Map();

const isUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Demo ids are short slugs ("codeforge-berlin"), so ids are also recognised by position:
// the segment after "view", "campus", "edit", "country" or "city" (see markIdSegments).
const knownIdSegments = new Set();

const ID_PARENTS = ["view", "campus", "add-course", "edit", "country", "city"];

const markIdSegments = (route = []) => {
  route.forEach((segment, i) => {
    if (i > 0 && ID_PARENTS.includes(route[i - 1]) && segment !== "new") {
      knownIdSegments.add(segment);
    }
    if (route[i + 1] === "pricing" || route[i + 1] === "bulk-result") knownIdSegments.add(segment);
  });
};

const isIdSegment = (segment) => {
  return isUUID(segment) || segment.length > 20 || knownIdSegments.has(segment);
};

const routeMapping = {
  schools: "/schools/schools-list",
  packages: "/packages/packages-list",
  "promo-codes": "/promo-codes",
  discounts: "/discounts/discounts-list",
  users: "/users/users-list",
  learning: "/learning/course-plans",
  community: "/community/moderation",
  destinations: "/orders/destinations",
  accommodation: "/accommodation/accommodations-list",
  services: "/services/services-list",
  orders: "/orders/orders-list",
  home: "/home/analytics",
};

const specialSegments = ["view", "campus", "add-course"];

const segmentDisplayNames = {
  home: "Dashboard",
  analytics: "Analytics",
  schools: "Catalogue",
  "schools-list": "Providers",
  "courses-list": "Programmes",
  "amenities-list": "Facilities",
  accommodation: "Accommodation",
  "accommodations-list": "All accommodation",
  services: "Extras",
  "services-list": "All extras",
  pricing: "Pricing",
  "bulk-result": "Bulk assign result",
  packages: "Packages",
  "packages-list": "All packages",
  "experiences-list": "Experiences",
  orders: "Sales",
  "orders-list": "Orders",
  destinations: "Destinations",
  country: "Country",
  city: "City",
  new: "New",
  edit: "Edit",
  discounts: "Discounts",
  "discounts-list": "All discounts",
  "promo-codes": "Promo codes",
  learning: "Learning",
  "course-plans": "Course plans",
  reviews: "Reviews",
  community: "Community",
  moderation: "Moderation",
  users: "Team",
  "users-list": "Customers",
  "managers-list": "Team and roles",
};

export { breadcrumbCache, isUUID, isIdSegment, markIdSegments, routeMapping, specialSegments, segmentDisplayNames };
