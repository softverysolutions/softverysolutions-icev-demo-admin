export const INITIAL_FORM_DATA = {
  type: "equipment",
  name: "",
  description: "",
  isActive: true,
  currency: "EUR",
  courseAssignments: [],
  coverImageUrl: "",
  highlight: "",
  includedItems: [],
  complementaryInfo: "",
  warningNote: "",
};

export const SERVICE_TYPES = [
  { value: "equipment", label: "Equipment rental" },
  { value: "exam", label: "Certification exam" },
  { value: "transfer", label: "Transfer" },
  { value: "insurance", label: "Insurance" },
  { value: "simCard", label: "SIM card" },
  { value: "coaching", label: "Coaching" },
  { value: "serviceFee", label: "Service fee" },
  { value: "other", label: "Other" },
];

export const PERIODICITY_OPTIONS = [
  { value: "day", label: "Per Day" },
  { value: "week", label: "Per Week" },
  { value: "month", label: "Per Month" },
  { value: "year", label: "Per Year" },
];

export const CURRENCY_ORDER = ["EUR"];

export const PRICE_TYPE_OPTIONS = [
  { value: "per_week", label: "Per Week" },
  { value: "fixed", label: "Fixed" },
];

export const STEPPER_STEPS = [
  { label: "Extra details", description: "Basic information" },
  { label: "Programme assignment", description: "Assign & set pricing" },
];
