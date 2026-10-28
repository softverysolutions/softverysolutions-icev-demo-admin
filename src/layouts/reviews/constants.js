import { REVIEW_STATUS, REVIEW_TYPE } from "services/reviewsService";

export { REVIEW_STATUS, REVIEW_TYPE };

export const STATUS_TABS = [
  { value: REVIEW_STATUS.PENDING, label: "Pending" },
  { value: REVIEW_STATUS.APPROVED, label: "Approved" },
  { value: REVIEW_STATUS.DECLINED, label: "Declined" },
  { value: REVIEW_STATUS.HIDDEN, label: "Hidden" },
];

export const STATUS_COLOR = {
  [REVIEW_STATUS.PENDING]: "warning",
  [REVIEW_STATUS.APPROVED]: "success",
  [REVIEW_STATUS.DECLINED]: "error",
  [REVIEW_STATUS.HIDDEN]: "secondary",
};

export const STATUS_LABEL = {
  [REVIEW_STATUS.PENDING]: "Pending",
  [REVIEW_STATUS.APPROVED]: "Approved",
  [REVIEW_STATUS.DECLINED]: "Declined",
  [REVIEW_STATUS.HIDDEN]: "Hidden",
};

export const RATING_CRITERIA = [
  { key: "instructors", label: "Instructors" },
  { key: "curriculum", label: "Curriculum" },
  { key: "facilities", label: "Facilities" },
  { key: "equipment", label: "Equipment" },
  { key: "organisation", label: "Organisation" },
];

export const PAGE_SIZE = 10;
