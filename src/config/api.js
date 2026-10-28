// Base URL of the app, including the sub-path when the build is hosted under one (e.g. GitHub Pages).
export const getAppBaseUrl = () => `${window.location.origin}${process.env.PUBLIC_URL || ""}`;

// Every request goes to the in-browser mock API (src/demo/mocks), served on the same origin.
export const getApiBaseUrl = () => `${getAppBaseUrl()}/demo-api`;

export const API_BASE_URL = getApiBaseUrl();
