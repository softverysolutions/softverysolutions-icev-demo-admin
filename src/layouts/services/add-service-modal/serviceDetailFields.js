/**
 * Detail content of a service for the app's "More details" layer:
 * cover photo, highlight sentence, "What is included", complementary information and
 * warning note. Limits match the backend's ServiceDto.
 */
export const SERVICE_DETAIL_LIMITS = {
  highlight: 200,
  includedItems: 100,
  includedItem: 500,
  complementaryInfo: 2000,
  warningNote: 500,
};

export const SERVICE_DETAIL_FIELDS = [
  "coverImageUrl",
  "highlight",
  "includedItems",
  "complementaryInfo",
  "warningNote",
];

export const EMPTY_SERVICE_DETAIL = {
  coverImageUrl: "",
  highlight: "",
  includedItems: [],
  complementaryInfo: "",
  warningNote: "",
};

function textOrNull(value) {
  if (value == null) return null;
  const text = String(value).trim();
  return text ? text : null;
}

/** Form values from a service returned by the API. */
export function mapServiceDetailToForm(service) {
  return {
    coverImageUrl: service?.coverImageUrl || "",
    highlight: service?.highlight || "",
    includedItems: Array.isArray(service?.includedItems) ? [...service.includedItems] : [],
    complementaryInfo: service?.complementaryInfo || "",
    warningNote: service?.warningNote || "",
  };
}

/** API values from the form: trimmed, empty text as null, blank list rows dropped. */
export function normalizeServiceDetail(form) {
  return {
    coverImageUrl: textOrNull(form?.coverImageUrl),
    highlight: textOrNull(form?.highlight),
    includedItems: (Array.isArray(form?.includedItems) ? form.includedItems : [])
      .map((item) => String(item ?? "").trim())
      .filter(Boolean),
    complementaryInfo: textOrNull(form?.complementaryInfo),
    warningNote: textOrNull(form?.warningNote),
  };
}

/**
 * Only the detail fields that differ from what the service had, so saving a service whose
 * detail content was not touched sends nothing new.
 */
export function buildServiceDetailPayload(form, initial) {
  const next = normalizeServiceDetail(form);
  const previous = normalizeServiceDetail(initial || EMPTY_SERVICE_DETAIL);
  const payload = {};
  SERVICE_DETAIL_FIELDS.forEach((field) => {
    if (JSON.stringify(next[field]) !== JSON.stringify(previous[field])) {
      payload[field] = next[field];
    }
  });
  return payload;
}

export function validateServiceDetail(form) {
  const errors = {};
  const detail = normalizeServiceDetail(form);
  if (detail.highlight && detail.highlight.length > SERVICE_DETAIL_LIMITS.highlight) {
    errors.highlight = `Highlight must be ${SERVICE_DETAIL_LIMITS.highlight} characters or fewer.`;
  }
  if (detail.includedItems.length > SERVICE_DETAIL_LIMITS.includedItems) {
    errors.includedItems = `Add at most ${SERVICE_DETAIL_LIMITS.includedItems} included items.`;
  } else if (detail.includedItems.some((item) => item.length > SERVICE_DETAIL_LIMITS.includedItem)) {
    errors.includedItems = `Each included item must be ${SERVICE_DETAIL_LIMITS.includedItem} characters or fewer.`;
  }
  if (
    detail.complementaryInfo &&
    detail.complementaryInfo.length > SERVICE_DETAIL_LIMITS.complementaryInfo
  ) {
    errors.complementaryInfo = `Complementary information must be ${SERVICE_DETAIL_LIMITS.complementaryInfo} characters or fewer.`;
  }
  if (detail.warningNote && detail.warningNote.length > SERVICE_DETAIL_LIMITS.warningNote) {
    errors.warningNote = `Warning note must be ${SERVICE_DETAIL_LIMITS.warningNote} characters or fewer.`;
  }
  return errors;
}
