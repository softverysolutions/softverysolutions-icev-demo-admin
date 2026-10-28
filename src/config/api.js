// Every request goes to the in-browser mock API (src/demo/mocks), served on the same origin.
export const getApiBaseUrl = () => `${window.location.origin}/demo-api`;

export const API_BASE_URL = getApiBaseUrl();
