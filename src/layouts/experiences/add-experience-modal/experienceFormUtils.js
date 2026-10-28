export const isEmptyRichText = (html) => {
  const raw = String(html ?? "").trim();
  if (!raw) return true;
  const text = raw.replace(/<[^>]*>/g, "").trim();
  return !text;
};

export const toNullableString = (value) => {
  const trimmed = String(value ?? "").trim();
  return trimmed === "" ? null : trimmed;
};

export const toNullableRichText = (value) =>
  isEmptyRichText(value) ? null : String(value ?? "").trim();

export const toNullablePrice = (priceValue) => {
  const raw = String(priceValue ?? "").trim();
  if (raw === "") return null;
  const num = parseFloat(raw);
  return Number.isFinite(num) ? num : null;
};

/** POST create: omit unset optional fields. */
export const stripNullishFields = (payload) => {
  const next = { ...payload };
  Object.keys(next).forEach((key) => {
    if (next[key] === null || next[key] === undefined) delete next[key];
  });
  return next;
};
