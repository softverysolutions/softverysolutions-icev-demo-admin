export const EXPERIENCE_TYPES = [
  { value: "cultural", label: "Cultural" },
  { value: "nature", label: "Nature" },
  { value: "sport", label: "Sport" },
  { value: "adventure", label: "Adventure" },
  { value: "other", label: "Other" },
];

export const formatExperienceType = (type) => {
  const match = EXPERIENCE_TYPES.find((t) => t.value === type);
  if (match) return match.label;
  if (!type) return "—";
  return String(type)
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (s) => s.toUpperCase())
    .trim();
};
