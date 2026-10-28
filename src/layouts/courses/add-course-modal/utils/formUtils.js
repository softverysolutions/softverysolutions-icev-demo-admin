export const updateFixedDurationRow = (formData, index, field, value) => {
  const fixedDuration = formData.fixedDuration || [];
  return {
    ...formData,
    fixedDuration: fixedDuration.map((row, i) => (i === index ? { ...row, [field]: value } : row)),
  };
};

export const addFixedDurationRow = (formData) => {
  const fixedDuration = formData.fixedDuration || [];
  return {
    ...formData,
    fixedDuration: [...fixedDuration, { duration: "", unit: "week", totalPrice: "" }],
  };
};

export const removeFixedDurationRow = (formData, index) => {
  const fixedDuration = formData.fixedDuration || [];
  return {
    ...formData,
    fixedDuration: fixedDuration.filter((_, i) => i !== index),
  };
};

export const updateHighSeasonFeeRow = (highSeasonFees, index, field, value) => {
  return highSeasonFees.map((row, i) => (i === index ? { ...row, [field]: value } : row));
};

export const addHighSeasonFeeRow = (highSeasonFees) => {
  return [...highSeasonFees, { startDate: null, endDate: null, pricePerWeek: "0", active: true }];
};

export const removeHighSeasonFeeRow = (highSeasonFees, index) => {
  return highSeasonFees.filter((_, i) => i !== index);
};
