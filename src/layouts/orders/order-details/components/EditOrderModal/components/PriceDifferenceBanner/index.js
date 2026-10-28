import PropTypes from "prop-types";
import { Alert } from "@mui/material";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftSelect from "components/SoftSelect";
import { formatMoney } from "services/currencyService";

const DIFFERENCE_STATUS_OPTIONS = [
  { value: "not_handled", label: "Not handled" },
  { value: "invoice_sent", label: "Invoice sent" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
  { value: "not_applicable", label: "Not applicable" },
];

const API_TO_UI_STATUS = {
  notHandled: "not_handled",
  invoiceSent: "invoice_sent",
  paid: "paid",
  refunded: "refunded",
  notApplicable: "not_applicable",
};

const normalizeStatusForDisplay = (status) => {
  if (!status) return "not_handled";
  if (DIFFERENCE_STATUS_OPTIONS.some((opt) => opt.value === status)) return status;
  return API_TO_UI_STATUS[status] || status;
};

function PriceDifferenceBanner({
  priceDifference,
  differenceStatus,
  onStatusChange,
  oldTotal,
  newTotal,
  currency = "EUR",
  statusReadOnly,
}) {
  const isPositive = priceDifference > 0;
  const isNegative = priceDifference < 0;
  const absDifference = Math.abs(Number(priceDifference) || 0);
  const moneyCurrency = currency || "EUR";
  const oldVal = Number(oldTotal) || 0;
  const newVal = Number(newTotal) || 0;
  const displayDiff = priceDifference != null ? Number(priceDifference) : newVal - oldVal;
  const hasNoChange = displayDiff === 0;
  const normalizedStatus = normalizeStatusForDisplay(differenceStatus);

  return (
    <SoftBox mb={3}>
      <SoftBox
        p={2}
        sx={{
          backgroundColor: "#F7F6FB",
          borderRadius: "8px",
          border: "1px solid #e0e0e0",
        }}
      >
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <SoftBox display="flex" gap={3}>
            <SoftBox>
              <SoftTypography variant="caption" color="text.secondary" display="block">
                Old total
              </SoftTypography>
              <SoftTypography variant="h6" fontWeight="bold">
                {formatMoney(oldVal, moneyCurrency)}
              </SoftTypography>
            </SoftBox>
            <SoftBox>
              <SoftTypography variant="caption" color="text.secondary" display="block">
                New total
              </SoftTypography>
              <SoftTypography variant="h6" fontWeight="bold">
                {formatMoney(newVal, moneyCurrency)}
              </SoftTypography>
            </SoftBox>
            <SoftBox>
              <SoftTypography variant="caption" color="text.secondary" display="block">
                Difference
              </SoftTypography>
              <SoftTypography
                variant="h6"
                fontWeight="bold"
                color={displayDiff > 0 ? "info" : displayDiff < 0 ? "error" : "text"}
              >
                {displayDiff > 0 ? "+" : displayDiff < 0 ? "−" : ""}
                {formatMoney(Math.abs(displayDiff), moneyCurrency)}
              </SoftTypography>
              <SoftTypography variant="caption" color="text" display="block">
                {displayDiff > 0 ? "to collect" : displayDiff < 0 ? "to refund" : "no change"}
              </SoftTypography>
            </SoftBox>
          </SoftBox>
          <SoftBox>
            {statusReadOnly ? (
              <SoftTypography variant="button" fontWeight="medium" color="text">
                {DIFFERENCE_STATUS_OPTIONS.find((opt) => opt.value === normalizedStatus)?.label ||
                  normalizedStatus}
              </SoftTypography>
            ) : (
              <SoftSelect
                value={DIFFERENCE_STATUS_OPTIONS.find((opt) => opt.value === normalizedStatus) || null}
                onChange={(option) => onStatusChange(option?.value || "not_handled")}
                options={DIFFERENCE_STATUS_OPTIONS}
                placeholder="Select status"
                isClearable={false}
                styles={{
                  control: (base) => ({
                    ...base,
                    minWidth: "140px",
                  }),
                }}
              />
            )}
            {hasNoChange && (
              <SoftTypography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                No price change
              </SoftTypography>
            )}
          </SoftBox>
        </SoftBox>
      </SoftBox>
    </SoftBox>
  );
}

PriceDifferenceBanner.propTypes = {
  priceDifference: PropTypes.number.isRequired,
  differenceStatus: PropTypes.string.isRequired,
  onStatusChange: PropTypes.func.isRequired,
  oldTotal: PropTypes.number,
  newTotal: PropTypes.number,
  currency: PropTypes.string,
  priceSummary: PropTypes.object,
  isCalculating: PropTypes.bool,
  statusReadOnly: PropTypes.bool,
};

export default PriceDifferenceBanner;
