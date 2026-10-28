import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { formatMoney } from "services/currencyService";

const EMPTY_VALUE = "—";

function DetailRow({ label, value, strong = false }) {
  return (
    <SoftBox>
      <SoftTypography variant="caption" color="text" fontWeight="medium" display="block" mb={0.5}>
        {label}
      </SoftTypography>
      <SoftTypography variant="body2" color="dark" fontWeight={strong ? "bold" : "regular"}>
        {value ?? EMPTY_VALUE}
      </SoftTypography>
    </SoftBox>
  );
}

DetailRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  strong: PropTypes.bool,
};

const SCOPE_LABELS = { course: "Programme", package: "Package", all: "Whole order" };

function OrderPricingDetails({ pricingDetails, currency = "EUR" }) {
  const money = (value) => (value == null ? EMPTY_VALUE : formatMoney(value, currency));
  const promoTitle = pricingDetails?.promoCodeTitle?.trim() || null;
  const promoAmount = Number(pricingDetails?.promoCodeDiscountAmount) || 0;
  const discount = Number(pricingDetails?.discountAmount) || 0;

  const rows = [
    { label: "Programme", value: money(pricingDetails?.courseTotal) },
    { label: "Accommodation", value: money(pricingDetails?.accommodationTotal) },
    { label: "Extras & experiences", value: money(pricingDetails?.extrasTotal) },
    {
      label: pricingDetails?.discountTitle ? `Discount (${pricingDetails.discountTitle})` : "Discount",
      value: discount > 0 ? `-${money(discount)}` : EMPTY_VALUE,
    },
    {
      label: promoTitle
        ? `Promo code ${promoTitle}${
            pricingDetails?.promoCodeScope ? ` · ${SCOPE_LABELS[pricingDetails.promoCodeScope] || ""}` : ""
          }`
        : "Promo code",
      value: promoAmount > 0 ? `-${money(promoAmount)}` : EMPTY_VALUE,
    },
    { label: "Total", value: money(pricingDetails?.total), strong: true },
  ];

  return (
    <Card>
      <SoftBox p={3}>
        <SoftTypography variant="h6" fontWeight="medium" mb={3}>
          Pricing Details
        </SoftTypography>
        <Grid container spacing={3}>
          {rows.map((row) => (
            <Grid item xs={12} sm={6} md={2} key={row.label}>
              <DetailRow label={row.label} value={row.value} strong={row.strong} />
            </Grid>
          ))}
        </Grid>
      </SoftBox>
    </Card>
  );
}

OrderPricingDetails.propTypes = {
  pricingDetails: PropTypes.shape({
    courseTotal: PropTypes.number,
    accommodationTotal: PropTypes.number,
    extrasTotal: PropTypes.number,
    discountAmount: PropTypes.number,
    discountTitle: PropTypes.string,
    promoCodeTitle: PropTypes.string,
    promoCodeDiscountAmount: PropTypes.number,
    promoCodeScope: PropTypes.string,
    total: PropTypes.number,
  }),
  currency: PropTypes.string,
};

export default OrderPricingDetails;
