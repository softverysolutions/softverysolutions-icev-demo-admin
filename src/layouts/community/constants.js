import { POST_STATUS } from "services/communityService";

export { POST_STATUS };

export const STATUS_TABS = [
  { value: POST_STATUS.FLAGGED, label: "Flagged" },
  { value: POST_STATUS.PUBLISHED, label: "Published" },
  { value: POST_STATUS.HIDDEN, label: "Hidden" },
];

export const STATUS_COLOR = {
  [POST_STATUS.FLAGGED]: "warning",
  [POST_STATUS.PUBLISHED]: "success",
  [POST_STATUS.HIDDEN]: "secondary",
};

export const STATUS_LABEL = {
  [POST_STATUS.FLAGGED]: "Flagged",
  [POST_STATUS.PUBLISHED]: "Published",
  [POST_STATUS.HIDDEN]: "Hidden",
};

// Same tags as the Community tab in the app.
export const TAG_LABEL = {
  study: "Study",
  training: "Training",
  projects: "Projects",
  careers: "Careers",
  events: "Events",
  lifestyle: "Lifestyle",
  food: "Food",
  accommodation: "Accommodation",
  tips: "Tips",
  travel: "Travel",
  gear: "Gear",
};

export const tagLabel = (tag) => TAG_LABEL[tag] || tag || "—";
