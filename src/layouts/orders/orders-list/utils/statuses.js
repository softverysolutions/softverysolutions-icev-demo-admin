export const TRAVEL_STATUSES = {
  notPaid: { label: "Awaiting payment", color: "warning" },
  registration: { label: "Registration", color: "info" },
  readyForTheStart: { label: "Ready to start", color: "primary" },
  inProgress: { label: "In progress", color: "success" },
  finished: { label: "Finished", color: "secondary" },
  cancelled: { label: "Cancelled", color: "error" },
};

export const PAYMENT_STATUSES = {
  success: { label: "Paid", color: "success" },
  pending: { label: "Pending", color: "warning" },
  failed: { label: "Failed", color: "error" },
  refunded: { label: "Refunded", color: "secondary" },
};

export const TRAVEL_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  ...Object.entries(TRAVEL_STATUSES).map(([value, { label }]) => ({ value, label })),
];

export const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All payment statuses" },
  ...Object.entries(PAYMENT_STATUSES).map(([value, { label }]) => ({ value, label })),
];

export const travelStatusOf = (status) =>
  TRAVEL_STATUSES[status] ||
  TRAVEL_STATUSES[
    Object.keys(TRAVEL_STATUSES).find((k) => k.toLowerCase() === String(status || "").toLowerCase())
  ] || { label: status || "—", color: "secondary" };

export const paymentStatusOf = (status) =>
  PAYMENT_STATUSES[String(status || "").toLowerCase()] || { label: status || "—", color: "secondary" };
