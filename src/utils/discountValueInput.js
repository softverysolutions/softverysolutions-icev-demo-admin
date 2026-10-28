export function formatDiscountValueInput(rawInput, isPercent) {
  if (rawInput === "" || rawInput === undefined || rawInput === null) return "";

  let s = String(rawInput);
  s = s.replace(/[^\d.]/g, "");
  const parts = s.split(".");
  if (parts.length > 2) {
    s = parts[0] + "." + parts.slice(1).join("");
  }
  if (s.length > 1 && s[0] === "0" && s[1] !== ".") {
    s = s.replace(/^0+/, "") || "0";
  }
  if (isPercent && s !== "" && s !== "0") {
    const num = parseFloat(s);
    if (!isNaN(num) && num > 100) s = "100";
  }
  return s;
}

export function getDiscountValueForApi(value) {
  if (value === "" || value === undefined || value === null) return 0;
  const num = parseFloat(String(value));
  return isNaN(num) || num < 0 ? 0 : num;
}

export function validateDiscountValueForSave(value) {
  const str = value === undefined || value === null ? "" : String(value).trim();
  if (str === "") {
    return {
      valid: false,
      message: "Full Payment Discount value is required when discount is enabled.",
    };
  }
  const num = parseFloat(str);
  if (isNaN(num)) {
    return { valid: false, message: "Full Payment Discount value must be a number." };
  }
  if (num < 0) {
    return { valid: false, message: "Full Payment Discount value cannot be negative." };
  }
  return { valid: true };
}

export function validateDiscountPercentMax(value) {
  const num = parseFloat(String(value));
  if (isNaN(num)) return { valid: true };
  if (num > 100) {
    return { valid: false, message: "Percentage discount cannot exceed 100%." };
  }
  return { valid: true };
}
