export const MANDATORY_PRICING_OPTIONS = [
  { value: "per_week", label: "Per week" },
  { value: "fixed", label: "Fixed amount" },
];

export function createEmptyMandatoryServiceRow() {
  return { id: undefined, name: "", amount: "", pricingType: "per_week", isActive: true };
}

export function sanitizeMandatoryServiceAmountInput(raw) {
  if (raw == null) return "";
  let hasSep = false;
  let out = "";
  for (const c of String(raw)) {
    if (c >= "0" && c <= "9") {
      out += c;
    } else if ((c === "." || c === ",") && !hasSep) {
      out += c;
      hasSep = true;
    }
  }
  return out;
}

export function mapApiServiceToRow(raw) {
  if (!raw || typeof raw !== "object") return createEmptyMandatoryServiceRow();
  const pt = String(raw.pricingType || "")
    .toUpperCase()
    .replace(/-/g, "_");
  const isFixed = pt === "FIXED" || pt === "FIXED_AMOUNT" || pt === "ONCE" || pt === "FIXEDAMOUNT";
  return {
    id: raw.id,
    name: raw.name != null ? String(raw.name) : "",
    amount: raw.value != null ? String(raw.value) : "",
    pricingType: isFixed ? "fixed" : "per_week",
    isActive: raw.isActive !== false,
  };
}

export function toApiAccommodationServices(rows) {
  return rows
    .filter((r) => r.name?.trim())
    .map((r) => {
      const value = parseFloat(String(r.amount).replace(",", "."));
      const pricingType = r.pricingType === "fixed" ? "FIXED_AMOUNT" : "PER_WEEK";
      const item = {
        name: r.name.trim(),
        value,
        pricingType,
        isActive: r.isActive !== false,
      };
      if (r.id) item.id = r.id;
      return item;
    });
}

export function toApiAccommodationServicesForCreate(rows) {
  return toApiAccommodationServices(rows).map(({ id: _id, ...rest }) => rest);
}

export function validateMandatoryServicesForSave(rows) {
  const meaningful = rows.filter(
    (r) =>
      (r.name && r.name.trim()) ||
      (r.amount !== "" && r.amount != null && String(r.amount).trim() !== "") ||
      r.pricingType
  );

  for (const r of meaningful) {
    if (!r.name?.trim()) {
      return { valid: false, message: "Each mandatory service needs a name." };
    }
    const amount = parseFloat(String(r.amount).replace(",", "."));
    if (Number.isNaN(amount) || amount <= 0) {
      return { valid: false, message: "Each mandatory service needs an amount greater than 0." };
    }
    if (!r.pricingType || !["per_week", "fixed"].includes(r.pricingType)) {
      return { valid: false, message: "Select a charge type for each mandatory service." };
    }
  }
  return { valid: true };
}
