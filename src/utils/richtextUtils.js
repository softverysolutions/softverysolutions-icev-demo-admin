export const toNullableString = (value) => {
  if (value == null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
};

export const isEmptyRichText = (value) => {
  if (!value) return true;
  const stripped = String(value)
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .trim();
  return !stripped;
};

export const toNullableRichText = (value) => {
  if (isEmptyRichText(value)) return null;
  return String(value).trim();
};
