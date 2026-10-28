import PropTypes from "prop-types";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";

function DiscountSection({
  discountType,
  discountValue,
  isViewMode,
  canEdit,
  isSubmitting,
  onInputChange,
}) {
  return (
    <SoftBox mb={3}>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Discount (Optional)
      </SoftTypography>

      <SoftBox display="flex" gap={2} alignItems="flex-end">
        <SoftBox flex={1}>
          <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1} display="block">
            Discount Type
          </SoftTypography>
          <SoftBox display="flex" gap={1}>
            <SoftButton
              variant={discountType === "fixed" ? "gradient" : "outlined"}
              color={discountType === "fixed" ? "info" : "light"}
              size="small"
              onClick={() => onInputChange("discountType", "fixed")}
              disabled={isViewMode || !canEdit || isSubmitting}
              sx={{ flex: 1 }}
            >
              Fixed Amount
            </SoftButton>
            <SoftButton
              variant={discountType === "percent" ? "gradient" : "outlined"}
              color={discountType === "percent" ? "info" : "light"}
              size="small"
              onClick={() => onInputChange("discountType", "percent")}
              disabled={isViewMode || !canEdit || isSubmitting}
              sx={{ flex: 1 }}
            >
              Percentage
            </SoftButton>
          </SoftBox>
        </SoftBox>
        
        <SoftBox flex={1}>
          <SoftTypography component="label" variant="caption" fontWeight="bold" mb={1} display="block">
            Discount Value
          </SoftTypography>
          <SoftInput
            type="number"
            value={discountValue}
            onChange={(e) => onInputChange("discountValue", e.target.value)}
            disabled={isViewMode || !canEdit || isSubmitting}
            placeholder={discountType === "percent" ? "Enter %" : "Enter amount"}
            fullWidth
          />
        </SoftBox>
      </SoftBox>
    </SoftBox>
  );
}

DiscountSection.propTypes = {
  discountType: PropTypes.string.isRequired,
  discountValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  isViewMode: PropTypes.bool.isRequired,
  canEdit: PropTypes.bool.isRequired,
  isSubmitting: PropTypes.bool.isRequired,
  onInputChange: PropTypes.func.isRequired,
};

export default DiscountSection;
