import { normalizeRole } from "./role";
import {
  consultantDeniedFeatures,
  consultantHiddenNavKeys,
  consultantBlockedPathPrefixes,
} from "./consultantPolicy";
import { adminDeniedFeatures, adminHiddenNavKeys, adminBlockedPathPrefixes } from "./adminPolicy";

const fullAccess = {
  features: new Set(),
  nav: new Set(),
  paths: [],
};

const byRole = {
  super_admin: fullAccess,
  consultant: {
    features: consultantDeniedFeatures,
    nav: consultantHiddenNavKeys,
    paths: consultantBlockedPathPrefixes,
  },
  admin: {
    features: adminDeniedFeatures,
    nav: adminHiddenNavKeys,
    paths: adminBlockedPathPrefixes,
  },
};

function policy(role) {
  return byRole[normalizeRole(role)] || byRole.consultant;
}

export function homePathForRole(role) {
  return normalizeRole(role) === "consultant" ? "/schools/courses-list" : "/home/analytics";
}

export function can(role, featureKey) {
  return !policy(role).features.has(featureKey);
}

export function navKeyVisible(role, key) {
  if (!key) return true;
  return !policy(role).nav.has(key);
}

export function isPathBlockedForRole(role, pathname) {
  const prefixes = policy(role).paths;
  return prefixes.some((p) => pathname === p || pathname.startsWith(p));
}
