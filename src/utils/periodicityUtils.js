export const parseCoursePeriodicity = (periodicity) => {
  switch (periodicity) {
    case "fullTime":
      return "Full Time";
    case "morning":
      return "Morning";
    case "evening":
      return "Evening";
    case "afternoon":
      return "Afternoon";
    default:
      return periodicity;
  }
};
