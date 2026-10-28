import { rulesToApiFormat } from "./utils";
import { validatePricingRules } from "../PricingRulesTable";
import {
  getDiscountValueForApi,
  validateDiscountValueForSave,
  validateDiscountPercentMax,
} from "utils/discountValueInput";
import { formatDateToUTC } from "utils/dateUtils";

function buildHighSeasonFeesPayload(highSeasonFees) {
  if (!highSeasonFees || highSeasonFees.length === 0) return [];

  return highSeasonFees
    .filter((fee) => fee.startDate && fee.endDate && fee.pricePerWeek)
    .map((fee) => {
      let startDate = fee.startDate;
      let endDate = fee.endDate;
      if (Array.isArray(startDate) && startDate.length > 0) startDate = startDate[0];
      if (Array.isArray(endDate) && endDate.length > 0) endDate = endDate[0];
      return {
        id: fee.id,
        startDate: formatDateToUTC(startDate),
        endDate: formatDateToUTC(endDate),
        supplementPerWeek: parseFloat(fee.pricePerWeek) || 0,
        active: fee.active !== false,
      };
    });
}

function buildBasePayload({
  flexibleDurationPrices,
  fixedDurationPrices,
  fullPaymentDiscount,
  highSeasonFees,
}) {
  let fullPaymentDiscountPayload = null;
  if (fullPaymentDiscount && fullPaymentDiscount.status === "active") {
    const valueValidation = validateDiscountValueForSave(fullPaymentDiscount.value);
    if (!valueValidation.valid) {
      alert(valueValidation.message);
      throw new Error("Validation failed");
    }
    if (fullPaymentDiscount.type === "percent") {
      const percentValidation = validateDiscountPercentMax(fullPaymentDiscount.value);
      if (!percentValidation.valid) {
        alert(percentValidation.message);
        throw new Error("Validation failed");
      }
    }
    fullPaymentDiscountPayload = {
      status: "active",
      applyToBasePrice: fullPaymentDiscount.applyToBasePrice,
      type: fullPaymentDiscount.type,
      value: getDiscountValueForApi(fullPaymentDiscount.value),
    };
  }

  return {
    flexibleDurationPrices: flexibleDurationPrices || [],
    fixedDurationPrices: fixedDurationPrices || [],
    fullPaymentDiscount: fullPaymentDiscountPayload,
    highSeasonFees: buildHighSeasonFeesPayload(highSeasonFees),
  };
}

const normalizeDate = (d) => {
  if (!d) return null;
  return formatDateToUTC(d);
};

const normalizeFeeForCompare = (fee) => ({
  id: fee?.id || null,
  startDate: fee?.startDate ? normalizeDate(fee.startDate) : null,
  endDate: fee?.endDate ? normalizeDate(fee.endDate) : null,
  supplementPerWeek: Number(fee?.supplementPerWeek || 0),
  active: fee?.active !== false,
});

function areHighSeasonFeesEqual(nextFees, prevFees) {
  const nextNormalized = (Array.isArray(nextFees) ? nextFees : [])
    .map(normalizeFeeForCompare)
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  const prevNormalized = (Array.isArray(prevFees) ? prevFees : [])
    .map(normalizeFeeForCompare)
    .sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)));
  return JSON.stringify(nextNormalized) === JSON.stringify(prevNormalized);
}

export async function executeSavePriceList({
  priceLists,
  editingPriceListId,
  currentPriceList,
  pricingRules,
  fullPaymentDiscount,
  highSeasonFees,
  hideActionButtons,
  courseId,
  syncFeesOnSavePriceList,
  onSavePriceList,
  onUpdatePriceList,
  onDeletePriceList,
  onPriceListSaved,
  onSaveCourseFees,
  onUpdateCourseFees,
  initialHighSeasonFees,
}) {
  if (fullPaymentDiscount && fullPaymentDiscount.status === "active") {
    const valueValidation = validateDiscountValueForSave(fullPaymentDiscount.value);
    if (!valueValidation.valid) {
      alert(valueValidation.message);
      throw new Error("Validation failed");
    }
    if (fullPaymentDiscount.type === "percent") {
      const percentValidation = validateDiscountPercentMax(fullPaymentDiscount.value);
      if (!percentValidation.valid) {
        alert(percentValidation.message);
        throw new Error("Validation failed");
      }
    }
  }

  const existingPriceList = priceLists.find((p) => p.id === editingPriceListId);
  let isEditMode = editingPriceListId && existingPriceList;

  const hasDates = currentPriceList.startDate && currentPriceList.endDate;
  const validRules = pricingRules.filter(
    (r) => r.fromWeeks && r.toWeeks && r.amount && Number(r.fromWeeks) > 0
  );
  const formIsEmpty = !hasDates && validRules.length === 0;
  const currentHighSeasonPayload = buildHighSeasonFeesPayload(highSeasonFees);
  const initialHighSeasonPayload = buildHighSeasonFeesPayload(initialHighSeasonFees);
  const hasHighSeasonData = currentHighSeasonPayload.length > 0;
  const highSeasonChanged = !areHighSeasonFeesEqual(currentHighSeasonPayload, initialHighSeasonPayload);
  const shouldSkipPriceListValidation =
    formIsEmpty && (hasHighSeasonData || highSeasonChanged);

  const effectiveExisting = existingPriceList;
  const effectiveEditId = editingPriceListId;

  if (!shouldSkipPriceListValidation && isEditMode) {
    if (formIsEmpty && effectiveExisting) {
      const hasExistingRules =
        (effectiveExisting.flexibleDurationPrices?.length || 0) +
          (effectiveExisting.fixedDurationPrices?.length || 0) >
        0;
      if (!hasExistingRules) {
        alert(
          'To edit an existing price list, click the Edit (pencil) button on the row in "Saved Price Lists" below first.'
        );
        throw new Error("Validation failed");
      }
    }
  } else if (!shouldSkipPriceListValidation) {
    if (formIsEmpty && priceLists.length > 0) {
      alert(
        'To edit an existing price list (e.g. to change Full Payment Discount), click the Edit (pencil) button on the row in "Saved Price Lists" below. To add a new price list, fill in the dates and pricing rules above.'
      );
      throw new Error("Validation failed");
    }
    const validation = validatePricingRules(pricingRules);
    if (validation.errors.length > 0) {
      alert("Please fix the errors in pricing rules before saving.");
      throw new Error("Validation failed");
    }
    if (validRules.length === 0) {
      alert("Please add at least one valid pricing rule.");
      throw new Error("Validation failed");
    }
    if (!hasDates) {
      alert("Please select start and end dates for the price list.");
      throw new Error("Validation failed");
    }
  }

  let flexibleDurationPrices;
  let fixedDurationPrices;
  let effectiveStartDate = currentPriceList.startDate;
  let effectiveEndDate = currentPriceList.endDate;

  if (validRules.length > 0) {
    const converted = rulesToApiFormat(pricingRules);
    flexibleDurationPrices = converted.flexibleDurationPrices;
    fixedDurationPrices = converted.fixedDurationPrices;
  } else if (isEditMode && effectiveExisting) {
    flexibleDurationPrices = effectiveExisting.flexibleDurationPrices || [];
    fixedDurationPrices = effectiveExisting.fixedDurationPrices || [];
  } else {
    flexibleDurationPrices = [];
    fixedDurationPrices = [];
  }

  if (isEditMode && effectiveExisting && (!effectiveStartDate || !effectiveEndDate)) {
    effectiveStartDate = effectiveExisting.startDate;
    effectiveEndDate = effectiveExisting.endDate;
  }

  const basePayload = buildBasePayload({
    flexibleDurationPrices,
    fixedDurationPrices,
    fullPaymentDiscount,
    highSeasonFees,
  });

  const isFromDatabase =
    effectiveExisting &&
    (effectiveExisting.flexibleDurationPrices || effectiveExisting.fixedDurationPrices);
  const datesChanged =
    effectiveExisting &&
    (normalizeDate(effectiveExisting.startDate) !== normalizeDate(effectiveStartDate) ||
      normalizeDate(effectiveExisting.endDate) !== normalizeDate(effectiveEndDate));

  if (!shouldSkipPriceListValidation && effectiveEditId && isFromDatabase && typeof onUpdatePriceList === "function") {
    if (datesChanged) {
      if (typeof onDeletePriceList === "function") {
        await onDeletePriceList(effectiveEditId);
      }
      const { highSeasonFees: _, ...payloadWithoutHighSeason } = basePayload;
      const createPayload = {
        ...payloadWithoutHighSeason,
        startDate: formatDateToUTC(effectiveStartDate),
        endDate: formatDateToUTC(effectiveEndDate),
      };
      if (typeof onSavePriceList === "function") {
        await onSavePriceList(createPayload);
      }
    } else {
      const { highSeasonFees: _, ...payloadWithoutHighSeason } = basePayload;
      await onUpdatePriceList(effectiveEditId, payloadWithoutHighSeason);
    }
  } else if (!shouldSkipPriceListValidation && typeof onSavePriceList === "function") {
    const { highSeasonFees: _, ...payloadWithoutHighSeason } = basePayload;
    const createPayload = {
      ...payloadWithoutHighSeason,
      startDate: formatDateToUTC(effectiveStartDate),
      endDate: formatDateToUTC(effectiveEndDate),
    };
    await onSavePriceList(createPayload);
  }

  if (syncFeesOnSavePriceList && courseId && basePayload.highSeasonFees) {
    const validFees = basePayload.highSeasonFees.filter((fee) => {
      const hasDates = fee.startDate && fee.endDate;
      const hasPrice = Number(fee.supplementPerWeek) > 0;
      if (!hasDates || !hasPrice) {
        console.warn("[PriceSection] Filtering out invalid fee:", fee);
      }
      return hasDates && hasPrice;
    });

    const existingFees = validFees.filter((fee) => fee.id);
    const newFees = validFees.filter((fee) => !fee.id);

    if (newFees.length > 0 && typeof onSaveCourseFees === "function") {
      await onSaveCourseFees(newFees.map(({ id, ...rest }) => rest));
    }

    if (existingFees.length > 0 && typeof onUpdateCourseFees === "function") {
      const invalidFees = existingFees.filter((f) => f.supplementPerWeek < 1);
      if (invalidFees.length > 0) {
        console.error("[PriceSection] Invalid fees detected:", invalidFees);
        alert(`Error: Some fees have invalid prices. Please check the "Price Per Week" values.`);
        throw new Error("Invalid fees");
      }
      await onUpdateCourseFees(existingFees);
    }
  }

  if (typeof onPriceListSaved === "function") {
    await onPriceListSaved();
  }
}
