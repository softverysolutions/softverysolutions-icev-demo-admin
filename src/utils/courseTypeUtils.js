// Programme categories and types, matching the Softvery Demo app catalogue.
export const PROGRAMME_CATEGORIES = [
  { value: "tech", label: "Tech" },
  { value: "sport", label: "Sport" },
];

export const PROGRAMME_TYPES = {
  tech: [
    { value: "webDevelopment", label: "Web Development" },
    { value: "dataScience", label: "Data Science & AI" },
    { value: "uxUi", label: "UX/UI Design" },
    { value: "cybersecurity", label: "Cybersecurity" },
    { value: "mobileDevelopment", label: "Mobile Development" },
  ],
  sport: [
    { value: "surf", label: "Surf" },
    { value: "football", label: "Football" },
    { value: "tennis", label: "Tennis" },
    { value: "yogaFitness", label: "Yoga & Fitness" },
    { value: "skiSnowboard", label: "Ski & Snowboard" },
  ],
};

export const ALL_PROGRAMME_TYPES = [...PROGRAMME_TYPES.tech, ...PROGRAMME_TYPES.sport];

export const SKILL_LEVEL_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

export const PROVIDER_TYPE_OPTIONS = PROGRAMME_CATEGORIES;

const LABELS = Object.fromEntries(
  [...PROGRAMME_CATEGORIES, ...ALL_PROGRAMME_TYPES, ...SKILL_LEVEL_OPTIONS].map((o) => [
    o.value,
    o.label,
  ])
);

export const formatProviderType = (type) => LABELS[type] || type || "—";

export const formatSkillLevel = (level) => LABELS[level] || level || "";

export const categoryOfProgrammeType = (programType) =>
  PROGRAMME_TYPES.sport.some((t) => t.value === programType) ? "sport" : "tech";

export const formatCourseType = (type) => {
  if (!type) return "";
  const normalized = typeof type === "string" ? type.trim() : "";
  if (!normalized) return "";
  return LABELS[normalized] || normalized;
};

export const getCourseTypeDisplay = (course) => {
  if (!course) return null;
  if (course.types && course.types.length > 0) {
    const parts = course.types
      .flatMap((t) => t.programTypes?.map((pt) => pt?.name).filter(Boolean) || [])
      .map((name) => formatCourseType(name))
      .filter(Boolean);
    if (parts.length > 0) return parts.join(", ");
  }
  const single = course.programType || course.type;
  if (single) return formatCourseType(single);
  return null;
};

// API `types` ([{ name: "tech", programTypes: [{ name }] }]) → editor form `courseTypes`.
export const courseTypesToForm = (course) =>
  (course?.types || []).map((type) => ({
    type: type.name === "sport" ? "sport" : "tech",
    programTypes: (type.programTypes || []).map((pt) => pt.name).filter(Boolean),
  }));
