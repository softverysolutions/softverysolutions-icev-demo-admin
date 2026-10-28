export const formatServiceType = (type) => {
  switch (type) {
    case "equipment":
      return "Equipment rental";
    case "exam":
      return "Certification exam";
    case "coaching":
      return "Coaching";
    case "insurance":
      return "Insurance";
    case "transfer":
      return "Transfer";
    case "simCard":
      return "SIM card";
    case "serviceFee":
      return "Service fee";
    case "other":
      return "Other";
    default:
      return type;
  }
};
