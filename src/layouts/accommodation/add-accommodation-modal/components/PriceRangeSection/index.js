import { useState, useEffect } from "react";
import PropTypes from "prop-types";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import PriceTypeSelector from "./components/PriceTypeSelector";
import SimplePriceForm from "./components/SimplePriceForm";
import FlexiblePriceTable from "./components/FlexiblePriceTable";
import FixedPriceTable from "./components/FixedPriceTable";

import {
  updateFlexibleRow,
  updateFixedRow,
  addFlexibleRow,
  addFixedRow,
  removeFlexibleRow,
  removeFixedRow,
  updateHighSeasonFeeRow,
  addHighSeasonFeeRow,
  removeHighSeasonFeeRow,
} from "../../utils/formUtils";

function PriceRangeSection({ priceRange, setPriceRange, currency, disabled = false }) {
  const [priceType, setPriceType] = useState(priceRange.type);

  useEffect(() => {
    setPriceType(priceRange.type);
  }, [priceRange.type]);

  const handlePriceTypeChange = (type) => {
    if (disabled) return;
    setPriceType(type);
    setPriceRange((prev) => {
      const newPriceRange = { ...prev, type };

      if (type !== "simple") {
        newPriceRange.simple = { price: 0, unit: "week" };
      }
      if (type !== "flexible") {
        newPriceRange.flexible = [];
      }
      if (type !== "fixed") {
        newPriceRange.fixed = [];
      }

      return newPriceRange;
    });
  };

  const handleHighSeasonFeeUpdate = (index, field, value) => {
    if (disabled) return;
    setPriceRange((prev) => updateHighSeasonFeeRow(prev, index, field, value));
  };

  const handleHighSeasonFeeRemove = (index) => {
    if (disabled) return;
    setPriceRange((prev) => removeHighSeasonFeeRow(prev, index));
  };

  const handleHighSeasonFeeAdd = () => {
    if (disabled) return;
    setPriceRange((prev) => addHighSeasonFeeRow(prev));
  };

  const handleSimpleChange = (simple) => {
    if (disabled) return;
    setPriceRange((prev) => ({ ...prev, simple }));
  };

  const handleFlexibleUpdate = (index, field, value) => {
    if (disabled) return;
    setPriceRange((prev) => updateFlexibleRow(prev, index, field, value));
  };

  const handleFlexibleRemove = (index) => {
    if (disabled) return;
    setPriceRange((prev) => removeFlexibleRow(prev, index));
  };

  const handleFlexibleAdd = () => {
    if (disabled) return;
    setPriceRange((prev) => addFlexibleRow(prev));
  };

  const handleFixedUpdate = (index, field, value) => {
    if (disabled) return;
    setPriceRange((prev) => updateFixedRow(prev, index, field, value));
  };

  const handleFixedRemove = (index) => {
    if (disabled) return;
    setPriceRange((prev) => removeFixedRow(prev, index));
  };

  const handleFixedAdd = () => {
    if (disabled) return;
    setPriceRange((prev) => addFixedRow(prev));
  };

  return (
    <SoftBox>
      <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <SoftTypography variant="h6" fontWeight="medium">
          Price Range
        </SoftTypography>
        <SoftBox display="flex" alignItems="center" gap={1}>
          <SoftTypography variant="button" color="text">
            Currency: {currency}
          </SoftTypography>
          <SoftBox component="span" sx={{ cursor: "pointer" }}>
            ℹ️
          </SoftBox>
        </SoftBox>
      </SoftBox>

      <PriceTypeSelector
        priceType={priceType}
        onPriceTypeChange={handlePriceTypeChange}
        disabled={disabled}
      />

      {priceType === "simple" && (
        <SimplePriceForm
          simple={priceRange.simple}
          currency={currency}
          onSimpleChange={handleSimpleChange}
          highSeasonFees={priceRange.highSeasonFees || []}
          onHighSeasonFeeUpdate={handleHighSeasonFeeUpdate}
          onHighSeasonFeeRemove={handleHighSeasonFeeRemove}
          onHighSeasonFeeAdd={handleHighSeasonFeeAdd}
          disabled={disabled}
        />
      )}

      {priceType === "flexible" && (
        <FlexiblePriceTable
          flexible={priceRange.flexible}
          currency={currency}
          onUpdateRow={handleFlexibleUpdate}
          onRemoveRow={handleFlexibleRemove}
          onAddRow={handleFlexibleAdd}
          highSeasonFees={priceRange.highSeasonFees || []}
          onHighSeasonFeeUpdate={handleHighSeasonFeeUpdate}
          onHighSeasonFeeRemove={handleHighSeasonFeeRemove}
          onHighSeasonFeeAdd={handleHighSeasonFeeAdd}
          disabled={disabled}
        />
      )}

      {priceType === "fixed" && (
        <FixedPriceTable
          fixed={priceRange.fixed}
          currency={currency}
          onUpdateRow={handleFixedUpdate}
          onRemoveRow={handleFixedRemove}
          onAddRow={handleFixedAdd}
          highSeasonFees={priceRange.highSeasonFees || []}
          onHighSeasonFeeUpdate={handleHighSeasonFeeUpdate}
          onHighSeasonFeeRemove={handleHighSeasonFeeRemove}
          onHighSeasonFeeAdd={handleHighSeasonFeeAdd}
          disabled={disabled}
        />
      )}
    </SoftBox>
  );
}

PriceRangeSection.propTypes = {
  priceRange: PropTypes.object.isRequired,
  setPriceRange: PropTypes.func.isRequired,
  currency: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

export default PriceRangeSection;
