import { formatMoney } from "services/currencyService";

export function getPricePreview(accommodation = {}) {
  const currency = accommodation.currency || "EUR";
  const money = (amount) => formatMoney(amount, currency);
  const type = accommodation.priceType;
  const simple = accommodation.simplePrices || [];
  const flexible = accommodation.flexibleDurationPrices || accommodation.flexiblePrices || [];
  const fixed = accommodation.fixedDurationPrices || accommodation.fixedPrices || [];

  const minOf = (nums) => {
    const valid = nums.map(Number).filter((n) => Number.isFinite(n));
    return valid.length ? Math.min(...valid) : null;
  };

  const useSimple = (type === "simple" || !type) && simple.length > 0;
  const useFlexible = (type === "flexible" || !type) && flexible.length > 0;
  const useFixed = (type === "fixed" || !type) && fixed.length > 0;

  if (useSimple) {
    const p = simple[0];
    return `${money(p.price)}/${p.period || "week"}`;
  }
  if (useFlexible) {
    const min = minOf(flexible.map((r) => r.pricePerWeek));
    return min != null ? `From ${money(min)}/week` : "N/A";
  }
  if (useFixed) {
    const perWeek = minOf(
      fixed.map((r) => (r.durationWeeks ? Number(r.totalPrice) / Number(r.durationWeeks) : NaN))
    );
    if (perWeek != null) return `From ${money(perWeek)}/week`;
    const minTotal = minOf(fixed.map((r) => r.totalPrice));
    return minTotal != null ? `From ${money(minTotal)}` : "N/A";
  }
  return "N/A";
}
