export const CAMPUS_FACILITIES_OPTIONS = [
  { value: "wifi", label: "Wi-Fi" },
  { value: "computer_room", label: "Computer Room" },
  { value: "test_center", label: "Test Center" },
  { value: "kitchen", label: "Kitchen" },
  { value: "cafeteria", label: "Cafeteria" },
  { value: "student_lounge", label: "Participant Lounge" },
  { value: "library", label: "Library" },
  { value: "prayer_room", label: "Prayer Room" },
  { value: "free_coffee_tea", label: "Free Coffee and Tea" },
  { value: "wheelchair_access", label: "Wheelchair Access" },
  { value: "vending_machines", label: "Vending Machines" },
  { value: "ping_pong_table", label: "Ping Pong Table" },
];

export const NATIONALITY_GROUPS = [
  { value: "european", label: "European" },
  { value: "asian", label: "Asian" },
  { value: "african", label: "African" },
  { value: "north_american", label: "North American" },
  { value: "south_american", label: "South American" },
  { value: "middle_eastern", label: "Middle Eastern" },
  { value: "oceanian", label: "Oceanian" },
  { value: "international", label: "International" },
  { value: "local", label: "Local" },
  { value: "mixed", label: "Mixed" },
];

export const CURRENCY_ORDER = ["EUR"];

export const SCHOOL_FACILITIES = [
  "Computer Room",
  "Library",
  "Test Center",
  "Cafeteria",
  "Participant Lounge",
  "Prayer Room",
  "Free Coffee and Tea",
  "Wheelchair Access",
  "Vending Machines",
  "Ping Pong Table",
  "Wi-Fi",
  "Kitchen",
];

export const INITIAL_CAMPUS_DATA = {
  name: "",
  schoolId: "",
  cityId: "",
  countryId: "",
  currency: "EUR",
  address: "",
  avgStudentsPerClass: "",
  numberOfStudents: "",
  averageRating: "",
  website: "",
  videoUrl: "",
  lat: "",
  lon: "",
  highlights: [],
  images: [],
  nationalities: [],
  amenities: [],
  description: "",
  isActive: true,
  firstDaysInstructions: {
    arriveByTime: "",
    arriveByText: "",
    whatToBring: "",
  },
};
