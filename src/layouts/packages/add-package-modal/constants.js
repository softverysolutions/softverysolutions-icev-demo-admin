export const INITIAL_FORM_DATA = {
  name: "",
  isActive: true,
  description: "",
  longDescription: "",
  whatsIncluded: [],
  notIncludedItems: [],
  importantInformation: {
    whatToBring: [],
    notAllowed: [],
    goodToKnow: [],
  },
  courseId: null,
  accommodationId: null,
  secondaryAccommodationIds: [],
  discountValue: "",
  discountType: "fixed",
  dates: [{ startDate: "", duration: "", accommodationDuration: "", tag: "", color: "navy" }],
  images: [],
  serviceIds: [],
  selectedExperiences: [],
  selectedSchool: null,
  selectedCampus: null,
};

export const COLOR_OPTIONS = [
  { value: "navy", label: "Navy" },
  { value: "blue", label: "Blue" },
  { value: "green", label: "Green" },
  { value: "orange", label: "Orange" },
  { value: "pink", label: "Pink" },
];
