import { cohortStartDates, firstWeeklyStartDate } from "utils/courseStartDateUtils";

export const INITIAL_FORM_DATA = {
  name: "",
  courseTypes: [],
  fees: [],
  services: [],
  pricingRules: [],
  startDates: "Pattern",
  startDatesPattern: "days-of-week",
  coursePatternStartDate: firstWeeklyStartDate(),
  manualDates: [],
  selectedDaysOfWeek: ["mon"],
  daysOfMonth: "",
  repeatEveryWeeks: "1",
  periodicityOptions: ["full-time"],
  durationType: "hours",
  duration: "",
  durationPeriod: "per-week",
  durationEntries: [],
  schedule: {
    startTime: "",
    endTime: "",
  },
  scheduleEntries: [{ id: "default-schedule", startTime: "9:00 AM", endTime: "5:00 PM" }],
  description: "",
  projectDescription: "",
  minAge: "16",
  averageRating: "",
  currency: "EUR",
  bestSeller: false,
  isFeatured: false,
  isActive: true,
  recommendedLevel: "",
  classSize: "",
  recommendedFor: "",
  notRecommendedFor: "",
  workload: "",
  equipment: "",
  certificate: "",
  courseHighlights: [{ text: "" }],
};

export {
  PROGRAMME_CATEGORIES as COURSE_TYPES,
  PROGRAMME_TYPES,
  ALL_PROGRAMME_TYPES,
  SKILL_LEVEL_OPTIONS,
} from "utils/courseTypeUtils";

export const START_DATES_TYPES = [
  { value: "Pattern", label: "Weekly starts" },
  { value: "Manually", label: "Cohorts (fixed dates)" },
];

export const suggestedCohortDates = () => cohortStartDates(6);

export const START_DATES_PATTERN_OPTIONS = [
  { value: "days-of-week", label: "Days of the week (Monday, Tuesday, etc.)" },
];

export const DAYS_OF_WEEK = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

export const PERIODICITY_TYPES = [
  { value: "full-time", label: "Full time" },
  { value: "part-time", label: "Part time" },
];

export const FULL_TIME_OPTIONS = [
  { value: "morning", label: "Morning" },
  { value: "afternoon", label: "Afternoon" },
  { value: "evening", label: "Evening" },
];

export const DURATION_TYPES = [
  { value: "hours", label: "Hours" },
  { value: "lessons", label: "Lessons" },
];

export const DURATION_PERIODS = [{ value: "per-week", label: "week" }];
