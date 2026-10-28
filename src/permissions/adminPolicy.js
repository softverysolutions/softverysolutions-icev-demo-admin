import { F } from "./features";

export const adminDeniedFeatures = new Set([F.MANAGERS_STAFF_ACTIONS, F.ORDERS_PRICE_DIFF_STATUS]);

export const adminHiddenNavKeys = new Set(["managers-list"]);

export const adminBlockedPathPrefixes = ["/users/managers-list"];
