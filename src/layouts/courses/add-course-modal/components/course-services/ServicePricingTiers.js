import { useMemo } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";
import Alert from "@mui/material/Alert";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";
import { getCurrencySymbol } from "services/currencyService";

const PRICE_TYPE_OPTIONS = [
  { value: "per_week", label: "Per week" },
  { value: "fixed", label: "Fixed total" },
];

function validatePricingTiers(tiers) {
  const errors = [];
  const warnings = [];

  if (!tiers || tiers.length === 0) {
    return { errors, warnings };
  }

  const validTiers = tiers.filter(
    (t) => t.minWeeks && t.maxWeeks && Number(t.minWeeks) > 0 && Number(t.maxWeeks) > 0
  );

  tiers.forEach((tier, index) => {
    const from = Number(tier.minWeeks);
    const to = Number(tier.maxWeeks);

    if (from && to && from > to) {
      errors.push({
        tierIndex: index,
        message: `Tier ${index + 1}: Start range cannot be greater than End range.`,
      });
    }

    if (!tier.minWeeks || !tier.maxWeeks || tier.amount === "" || tier.amount === null) {
      errors.push({
        tierIndex: index,
        message: `Tier ${index + 1}: All fields are required.`,
      });
    }
  });

  for (let i = 0; i < validTiers.length; i++) {
    for (let j = i + 1; j < validTiers.length; j++) {
      const tier1 = validTiers[i];
      const tier2 = validTiers[j];

      const from1 = Number(tier1.minWeeks);
      const to1 = Number(tier1.maxWeeks);
      const from2 = Number(tier2.minWeeks);
      const to2 = Number(tier2.maxWeeks);

      if (from1 <= to2 && from2 <= to1) {
        const overlapStart = Math.max(from1, from2);
        const overlapEnd = Math.min(to1, to2);

        if (overlapStart === overlapEnd) {
          errors.push({
            tierIndex: i,
            tierIndex2: j,
            message: `Week ${overlapStart} is included in two tiers.`,
          });
        } else {
          errors.push({
            tierIndex: i,
            tierIndex2: j,
            message: `Weeks ${overlapStart}-${overlapEnd} are included in two tiers.`,
          });
        }
      }
    }
  }

  if (validTiers.length > 0 && errors.length === 0) {
    const sortedTiers = [...validTiers].sort((a, b) => Number(a.minWeeks) - Number(b.minWeeks));

    for (let i = 0; i < sortedTiers.length - 1; i++) {
      const currentTo = Number(sortedTiers[i].maxWeeks);
      const nextFrom = Number(sortedTiers[i + 1].minWeeks);

      if (nextFrom > currentTo + 1) {
        const gapStart = currentTo + 1;
        const gapEnd = nextFrom - 1;

        if (gapStart === gapEnd) {
          warnings.push({
            message: `Week ${gapStart} has no pricing tier; that duration will not be charged.`,
          });
        } else {
          warnings.push({
            message: `Weeks ${gapStart}-${gapEnd} have no pricing tier; those durations will not be charged.`,
          });
        }
      }
    }
  }

  return { errors, warnings };
}

function ServicePricingTiers({ pricingTiers, onChange, currency, disabled = false, serviceName }) {
  const validation = useMemo(() => validatePricingTiers(pricingTiers), [pricingTiers]);

  const handleTierChange = (index, field, value) => {
    const newTiers = pricingTiers.map((tier, i) =>
      i === index ? { ...tier, [field]: value } : tier
    );
    onChange(newTiers);
  };

  const handleAddTier = () => {
    onChange([
      ...pricingTiers,
      { id: Date.now(), minWeeks: 1, maxWeeks: 4, priceType: "per_week", amount: "" },
    ]);
  };

  const handleRemoveTier = (tierIndex) => {
    if (pricingTiers.length <= 1) return;
    onChange(pricingTiers.filter((_, i) => i !== tierIndex));
  };

  return (
    <SoftBox mt={2}>
      <SoftBox display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <SoftTypography variant="subtitle2" fontWeight="medium">
          Pricing Tiers
        </SoftTypography>
        <SoftButton
          variant="outlined"
          color="info"
          size="small"
          onClick={handleAddTier}
          disabled={disabled}
        >
          + Add Tier
        </SoftButton>
      </SoftBox>

      <Grid container spacing={2} sx={{ mb: 1 }}>
        <Grid item xs={2}>
          <SoftTypography variant="caption" fontWeight="bold">
            Start Range
          </SoftTypography>
        </Grid>
        <Grid item xs={2}>
          <SoftTypography variant="caption" fontWeight="bold">
            End Range
          </SoftTypography>
        </Grid>
        <Grid item xs={3}>
          <SoftTypography variant="caption" fontWeight="bold">
            Price Type
          </SoftTypography>
        </Grid>
        <Grid item xs={3}>
          <SoftTypography variant="caption" fontWeight="bold">
            Amount
          </SoftTypography>
        </Grid>
        <Grid item xs={2} />
      </Grid>

      {pricingTiers.map((tier, index) => (
        <Grid container spacing={2} key={tier.id || index} sx={{ mb: 2, alignItems: "center" }}>
          <Grid item xs={2}>
            <SoftBox display="flex" alignItems="center" gap={0.5}>
              <SoftInput
                type="number"
                value={tier.minWeeks || ""}
                onChange={(e) => handleTierChange(index, "minWeeks", e.target.value)}
                disabled={disabled}
                size="small"
                inputProps={{ min: 1 }}
              />
              <SoftTypography variant="caption">weeks</SoftTypography>
            </SoftBox>
          </Grid>
          <Grid item xs={2}>
            <SoftBox display="flex" alignItems="center" gap={0.5}>
              <SoftInput
                type="number"
                value={tier.maxWeeks || ""}
                onChange={(e) => handleTierChange(index, "maxWeeks", e.target.value)}
                disabled={disabled}
                size="small"
                inputProps={{ min: 1 }}
              />
              <SoftTypography variant="caption">weeks</SoftTypography>
            </SoftBox>
          </Grid>
          <Grid item xs={3}>
            <SoftSelect
              value={PRICE_TYPE_OPTIONS.find((o) => o.value === tier.priceType)}
              onChange={(selected) => handleTierChange(index, "priceType", selected?.value)}
              options={PRICE_TYPE_OPTIONS}
              isDisabled={disabled}
              menuPortalTarget={document.body}
              styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
            />
          </Grid>
          <Grid item xs={3}>
            <SoftBox display="flex" alignItems="center" gap={0.5}>
              <SoftTypography variant="caption">{getCurrencySymbol(currency)}</SoftTypography>
              <SoftInput
                type="number"
                value={tier.amount || ""}
                onChange={(e) => handleTierChange(index, "amount", e.target.value)}
                disabled={disabled}
                size="small"
                inputProps={{ min: 0, step: "0.01" }}
              />
            </SoftBox>
          </Grid>
          <Grid item xs={2}>
            <Tooltip title="Delete">
              <SoftButton
                variant="text"
                color="error"
                size="small"
                onClick={() => handleRemoveTier(index)}
                disabled={disabled || pricingTiers.length <= 1}
                sx={{ minWidth: "auto" }}
              >
                <Icon>delete</Icon>
              </SoftButton>
            </Tooltip>
          </Grid>
        </Grid>
      ))}

      {validation.errors.length > 0 && (
        <SoftBox mt={2}>
          {validation.errors.map((err, i) => (
            <Alert key={`${serviceName}-error-${i}`} severity="error" sx={{ mb: 1 }}>
              {err.message}
            </Alert>
          ))}
        </SoftBox>
      )}

      {validation.warnings.length > 0 && (
        <SoftBox mt={2}>
          {validation.warnings.map((warn, i) => (
            <Alert key={`${serviceName}-warn-${i}`} severity="warning" sx={{ mb: 1 }}>
              {warn.message}
            </Alert>
          ))}
        </SoftBox>
      )}
    </SoftBox>
  );
}

ServicePricingTiers.propTypes = {
  pricingTiers: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  currency: PropTypes.string,
  disabled: PropTypes.bool,
  serviceName: PropTypes.string,
};

export default ServicePricingTiers;
