export const getPriceDifferenceOldTotal = (order) => {
  if (!order) return 0;
  return Number(order.priceDifferenceBaseTotal ?? order.totalAmount ?? 0) || 0;
};

export const calculatePriceDifferenceAmount = (order, newTotal) => {
  const oldTotal = getPriceDifferenceOldTotal(order);
  const nextTotal = Number(newTotal ?? order?.totalAmount ?? oldTotal) || 0;
  return nextTotal - oldTotal;
};
