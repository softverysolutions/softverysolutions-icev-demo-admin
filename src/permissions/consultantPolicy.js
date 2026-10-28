import { F } from "./features";

export const consultantDeniedFeatures = new Set([
  F.ORDERS_PRICE_DIFF_STATUS,
  F.SCHOOLS_ADD,
  F.SCHOOLS_ROW_MUTATE,
  F.SCHOOL_PAGE_EDIT,
  F.SCHOOL_PAGE_ADD_CAMPUS,
  F.SCHOOL_PAGE_CAMPUS_ROW_MUTATE,
  F.CAMPUS_PAGE_EDIT,
  F.CAMPUS_PAGE_ADD_COURSE,
  F.CAMPUS_PAGE_ADD_ACCOMMODATION,
  F.CAMPUS_PAGE_COURSE_ROW_MUTATE,
  F.PACKAGES_ROW_MUTATE,
  F.ACCOMMODATIONS_ROW_MUTATE,
  F.ACCOMMODATIONS_ADD,
  F.DISCOUNTS_ROW_MUTATE,
  F.DISCOUNTS_CREATE,
  F.SERVICES_ROW_MUTATE,
  F.SERVICES_VIEW_PRICING,
  F.SERVICES_CREATE,
  F.MANAGERS_STAFF_ACTIONS,
  F.ORDERS_EDIT_CANCEL,
]);

export const consultantHiddenNavKeys = new Set([
  "analytics",
  "destinations-list",
  "destinations-country-new",
  "destinations-country-edit",
  "destinations-city-new",
  "destinations-city-edit",
  "users-list",
  "managers-list",
  "course-plans",
]);

export const consultantBlockedPathPrefixes = [
  "/home/analytics",
  "/orders/destinations",
  "/users/",
  "/learning/",
];
