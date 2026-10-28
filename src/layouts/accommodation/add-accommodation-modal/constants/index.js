export const CATEGORY_OPTIONS = [
  { value: "sharedApartment", label: "Shared apartment" },
  { value: "apartment", label: "Apartment" },
  { value: "campusResidence", label: "Campus residence" },
  { value: "residence", label: "Residence" },
  { value: "surfHouse", label: "Surf house" },
  { value: "hostel", label: "Hostel" },
  { value: "chalet", label: "Chalet" },
  { value: "loft", label: "Loft" },
  { value: "hotel", label: "Hotel" },
  { value: "homestay", label: "Homestay" },
];

export const ROOM_TYPE_OPTIONS = [
  { value: "Private", label: "Private" },
  { value: "Double", label: "Double" },
  { value: "Twin", label: "Twin" },
  { value: "Triple", label: "Triple" },
  { value: "Quadruple", label: "Quadruple" },
  { value: "Shared", label: "Shared" },
  { value: "Studio", label: "Studio" },
];

export const BATHROOM_OPTIONS = [
  { value: "Ensuite", label: "Ensuite" },
  { value: "Shared", label: "Shared" },
];

export const REGIME_OPTIONS = [
  { value: "NoMeals", label: "No Meals" },
  { value: "HalfBoard", label: "Half Board" },
  { value: "FullBoard", label: "Full Board" },
  { value: "BB", label: "B&B" },
];

export const CURRENCY_ORDER = ["EUR"];

export const UNIT_OPTIONS = [{ value: "week", label: "Week" }];

export const PRICE_TYPE_OPTIONS = [
  { value: "simple", label: "Simple" },
  { value: "flexible", label: "Flexible Duration" },
  { value: "fixed", label: "Fixed Duration" },
];

export const INITIAL_FORM_DATA = {
  name: "",
  cityId: "",
  schoolId: "",
  address: "",
  currency: "EUR",
  category: "",
  roomType: "",
  bathroom: "",
  description: "",
  regime: "",
  ageLimitMin: "",
  ageLimitMax: "",
  school: "",
  facilities: [],
  youtubeUrl: "",
  images: [],
  campusIds: [],
  isActive: true,
  accommodationInstructions: "",
  accommodationInstructionsNote: "",
  accommodationContactType: "",
  accommodationContactName: "",
  hostPhone: "",
  hostWhatsapp: "",
  hostEmail: "",
  houseRules: "",
};

export const INITIAL_PRICE_RANGE = {
  type: "simple",
  simple: {
    price: 0,
    unit: "week",
  },
  flexible: [],
  fixed: [],
  highSeasonFees: [],
  mandatoryServices: [],
};

export const ROOM_TYPE_TO_BACKEND_MAP = {
  Private: "Private",
  Double: "Double",
  Twin: "Twin",
  Triple: "Triple",
  Quadruple: "Quadruple",
  Shared: "Shared",
  Studio: "Studio",
};

// Amenities offered for stays (the rest of the facility catalogue is for provider locations).
export const ACCOMMODATION_FACILITIES = [
  "Wi-Fi",
  "Kitchen",
  "Kitchenette",
  "Laundry",
  "Air conditioning",
  "Balcony",
  "Terrace",
  "Rooftop",
  "Garden",
  "Gym",
  "Pool",
  "Sauna",
  "Coworking",
  "Study rooms",
  "Study lounge",
  "24/7 study space",
  "Board storage",
  "Ski room",
  "Ski locker",
  "Bike rental",
  "Breakfast",
  "Half board",
  "Private Bathroom",
  "Shared Bathroom",
];
