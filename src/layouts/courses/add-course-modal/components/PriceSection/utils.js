import { formatDateToUTC } from "utils/dateUtils";
import { formatMoney } from "services/currencyService";

export function formatFeeRowForApi(fee) {
  let startDate = fee.startDate;
  let endDate = fee.endDate;
  if (Array.isArray(startDate) && startDate.length > 0) startDate = startDate[0];
  if (Array.isArray(endDate) && endDate.length > 0) endDate = endDate[0];
  const priceVal = fee.pricePerWeek ?? fee.amount ?? "0";
  const parsed = parseFloat(
    String(priceVal)
      .trim()
      .replace(/[^\d.-]/g, "")
  );
  const supplementPerWeek = !isNaN(parsed) && parsed > 0 ? parsed : 0;
  return {
    startDate: formatDateToUTC(startDate),
    endDate: formatDateToUTC(endDate),
    supplementPerWeek,
    active: fee.active !== false,
  };
}

export function rulesToApiFormat(rules) {
  const flexibleDurationPrices = [];
  const fixedDurationPrices = [];

  if (!rules || rules.length === 0) {
    return { flexibleDurationPrices, fixedDurationPrices };
  }

  rules.forEach((rule) => {
    const fromWeeks = Number(rule.fromWeeks);
    const toWeeks = Number(rule.toWeeks);
    const amount = parseFloat(rule.amount);

    if (!fromWeeks || !toWeeks || isNaN(amount)) return;

    if (rule.priceType === "per_week") {
      flexibleDurationPrices.push({
        minWeeks: fromWeeks,
        maxWeeks: toWeeks,
        pricePerWeek: amount,
        tag: rule.tag || undefined,
        color: rule.color || undefined,
      });
    } else if (rule.priceType === "fixed") {
      if (fromWeeks === toWeeks) {
        fixedDurationPrices.push({
          durationWeeks: fromWeeks,
          totalPrice: amount,
          tag: rule.tag || undefined,
          color: rule.color || undefined,
        });
      } else {
        for (let week = fromWeeks; week <= toWeeks; week++) {
          fixedDurationPrices.push({
            durationWeeks: week,
            totalPrice: amount,
            tag: rule.tag || undefined,
            color: rule.color || undefined,
          });
        }
      }
    }
  });

  return { flexibleDurationPrices, fixedDurationPrices };
}

export function apiToRulesFormat(priceList) {
  const rules = [];

  if (priceList.flexibleDurationPrices && priceList.flexibleDurationPrices.length > 0) {
    priceList.flexibleDurationPrices.forEach((fp, index) => {
      rules.push({
        id: `flex-${index}-${Date.now()}`,
        fromWeeks: fp.minWeeks?.toString() || "",
        toWeeks: fp.maxWeeks?.toString() || "",
        priceType: "per_week",
        amount: fp.pricePerWeek?.toString() || "",
        tag: fp.tag || "",
        color: fp.color || "",
      });
    });
  }

  if (priceList.fixedDurationPrices && priceList.fixedDurationPrices.length > 0) {
    const sorted = [...priceList.fixedDurationPrices].sort(
      (a, b) => a.durationWeeks - b.durationWeeks
    );
    let currentGroup = null;

    sorted.forEach((fp) => {
      if (!currentGroup) {
        currentGroup = {
          fromWeeks: fp.durationWeeks,
          toWeeks: fp.durationWeeks,
          amount: fp.totalPrice,
          tag: fp.tag || "",
          color: fp.color || "",
        };
      } else if (
        fp.durationWeeks === currentGroup.toWeeks + 1 &&
        fp.totalPrice === currentGroup.amount &&
        fp.tag === currentGroup.tag &&
        fp.color === currentGroup.color
      ) {
        currentGroup.toWeeks = fp.durationWeeks;
      } else {
        rules.push({
          id: `fixed-${currentGroup.fromWeeks}-${Date.now()}`,
          fromWeeks: currentGroup.fromWeeks.toString(),
          toWeeks: currentGroup.toWeeks.toString(),
          priceType: "fixed",
          amount: currentGroup.amount.toString(),
          tag: currentGroup.tag || "",
          color: currentGroup.color || "",
        });
        currentGroup = {
          fromWeeks: fp.durationWeeks,
          toWeeks: fp.durationWeeks,
          amount: fp.totalPrice,
          tag: fp.tag || "",
          color: fp.color || "",
        };
      }
    });

    if (currentGroup) {
      rules.push({
        id: `fixed-${currentGroup.fromWeeks}-${Date.now()}`,
        fromWeeks: currentGroup.fromWeeks.toString(),
        toWeeks: currentGroup.toWeeks.toString(),
        priceType: "fixed",
        amount: currentGroup.amount.toString(),
        tag: currentGroup.tag || "",
        color: currentGroup.color || "",
      });
    }
  }

  rules.sort((a, b) => Number(a.fromWeeks) - Number(b.fromWeeks));
  return rules;
}

export function getColorValue(colorName) {
  const colorMap = {
    blue: "#6D4AFF",
    green: "#12B886",
    orange: "#FF9800",
    pink: "#E91E63",
    navy: "#6D4AFF",
  };
  return colorMap[colorName?.toLowerCase()] || "#757575";
}

export function formatPriceDetails(priceList, currency = "EUR") {
  const details = [];

  if (priceList.flexibleDurationPrices && priceList.flexibleDurationPrices.length > 0) {
    priceList.flexibleDurationPrices.forEach((price) => {
      details.push({
        text: `${price.minWeeks}-${price.maxWeeks} weeks: ${formatMoney(
          price.pricePerWeek,
          currency
        )}/week`,
        tag: price.tag,
        color: price.color,
      });
    });
  }

  if (priceList.fixedDurationPrices && priceList.fixedDurationPrices.length > 0) {
    const grouped = {};
    priceList.fixedDurationPrices.forEach((price) => {
      const key = `${price.totalPrice}_${price.tag || ""}_${price.color || ""}`;
      if (!grouped[key]) {
        grouped[key] = { price: price.totalPrice, weeks: [], tag: price.tag, color: price.color };
      }
      grouped[key].weeks.push(price.durationWeeks);
    });

    Object.values(grouped).forEach((group) => {
      group.weeks.sort((a, b) => a - b);
      const ranges = [];
      let start = group.weeks[0];
      let end = group.weeks[0];
      for (let i = 1; i < group.weeks.length; i++) {
        if (group.weeks[i] === end + 1) {
          end = group.weeks[i];
        } else {
          ranges.push(start === end ? `${start}` : `${start}-${end}`);
          start = group.weeks[i];
          end = group.weeks[i];
        }
      }
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
      details.push({
        text: `${ranges.join(", ")} weeks: ${formatMoney(group.price, currency)} fixed`,
        tag: group.tag,
        color: group.color,
      });
    });
  }

  if (priceList.simplePrices && priceList.simplePrices.length > 0) {
    priceList.simplePrices.forEach((price) => {
      details.push({
        text: `${formatMoney(price.price, currency)} per ${price.period}`,
        tag: price.tag,
        color: price.color,
      });
    });
  }

  return details;
}
