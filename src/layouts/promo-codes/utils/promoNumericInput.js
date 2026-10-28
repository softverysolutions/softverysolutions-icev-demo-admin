export function sanitizeUsageLimitInput(raw) {
  if (raw === "" || raw == null) return "";
  const digits = String(raw).replace(/\D/g, "");
  if (digits === "") return "";
  const n = parseInt(digits, 10);
  if (!Number.isFinite(n) || n < 1) return "";
  return String(Math.min(n, 2147483647));
}

export function sanitizeDiscountInput(raw, discountType) {
  let s = String(raw ?? "").replace(/[^\d.]/g, "");
  const firstDot = s.indexOf(".");
  if (firstDot !== -1) {
    s = `${s.slice(0, firstDot + 1)}${s.slice(firstDot + 1).replace(/\./g, "")}`;
  }
  if (s === "" || s === ".") return s;

  const n = parseFloat(s);
  if (Number.isNaN(n)) return "";

  if (discountType === "percent") {
    if (n > 100) return "100";
    if (n < 0) return "0";
    return s;
  }

  if (n < 0) return "";
  return s;
}
