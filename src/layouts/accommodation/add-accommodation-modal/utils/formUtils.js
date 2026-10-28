export const handleFacilityChange = (facilities, facility) => {
  const existingIndex = facilities.findIndex(
    (f) =>
      (f.amenityId && facility.amenityId && f.amenityId === facility.amenityId) ||
      (f.id && facility.id && f.id === facility.id)
  );

  if (existingIndex >= 0) {
    return facilities.filter((_, index) => index !== existingIndex);
  } else {
    return [...facilities, facility];
  }
};

export const updateFlexibleRow = (priceRange, index, field, value) => {
  return {
    ...priceRange,
    flexible: priceRange.flexible.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
  };
};

export const updateFixedRow = (priceRange, index, field, value) => {
  const updatedFixed = [...priceRange.fixed];

  if (updatedFixed.length === 0) {
    updatedFixed.push({ duration: "", price: "", unit: "week" });
  }

  if (updatedFixed[index]) {
    updatedFixed[index] = { ...updatedFixed[index], [field]: value };
  }

  return {
    ...priceRange,
    fixed: updatedFixed,
  };
};

export const addFlexibleRow = (priceRange) => {
  return {
    ...priceRange,
    flexible: [...priceRange.flexible, { min: "", max: "", unit: "day", price: 0 }],
  };
};

export const addFixedRow = (priceRange) => {
  return {
    ...priceRange,
    fixed: [...priceRange.fixed, { duration: 0, unit: "week", price: 0 }],
  };
};

export const removeFlexibleRow = (priceRange, index) => {
  return {
    ...priceRange,
    flexible: priceRange.flexible.filter((_, i) => i !== index),
  };
};

export const removeFixedRow = (priceRange, index) => {
  return {
    ...priceRange,
    fixed: priceRange.fixed.filter((_, i) => i !== index),
  };
};

export const updateHighSeasonFeeRow = (priceRange, index, field, value) => {
  return {
    ...priceRange,
    highSeasonFees: priceRange.highSeasonFees.map((row, i) =>
      i === index ? { ...row, [field]: value } : row
    ),
  };
};

export const addHighSeasonFeeRow = (priceRange) => {
  return {
    ...priceRange,
    highSeasonFees: [
      ...priceRange.highSeasonFees,
      { startDate: null, endDate: null, pricePerWeek: "0", active: true },
    ],
  };
};

export const removeHighSeasonFeeRow = (priceRange, index) => {
  return {
    ...priceRange,
    highSeasonFees: priceRange.highSeasonFees.filter((_, i) => i !== index),
  };
};

export const updateMandatoryServiceRow = (priceRange, index, field, value) => {
  const list = Array.isArray(priceRange.mandatoryServices) ? priceRange.mandatoryServices : [];
  return {
    ...priceRange,
    mandatoryServices: list.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
  };
};

export const addMandatoryServiceRow = (priceRange, emptyRowFactory) => {
  const list = Array.isArray(priceRange.mandatoryServices) ? priceRange.mandatoryServices : [];
  const row = emptyRowFactory ? emptyRowFactory() : { name: "", amount: "", pricingType: "per_week" };
  return {
    ...priceRange,
    mandatoryServices: [...list, row],
  };
};

export const removeMandatoryServiceRow = (priceRange, index) => {
  const list = Array.isArray(priceRange.mandatoryServices) ? priceRange.mandatoryServices : [];
  return {
    ...priceRange,
    mandatoryServices: list.filter((_, i) => i !== index),
  };
};
