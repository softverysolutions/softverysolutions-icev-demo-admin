import PropTypes from "prop-types";
import { useState, useEffect, useMemo } from "react";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Icon from "@mui/material/Icon";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";

import SoftBox from "components/SoftBox";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";
import SoftButton from "components/SoftButton";
import SoftTypography from "components/SoftTypography";
import { getCurrencySymbol } from "services/currencyService";

const PRICE_TYPE_OPTIONS = [
  { value: "per_week", label: "Per week" },
  { value: "fixed", label: "Fixed total" },
];

function validatePricingRules(rules) {
  const errors = [];
  const warnings = [];

  if (!rules || rules.length === 0) {
    return { errors, warnings };
  }

  const validRules = rules.filter(
    (r) => r.fromWeeks && r.toWeeks && Number(r.fromWeeks) > 0 && Number(r.toWeeks) > 0
  );

  validRules.forEach((rule, index) => {
    const from = Number(rule.fromWeeks);
    const to = Number(rule.toWeeks);

    if (from > to) {
      errors.push({
        ruleIndex: index,
        message: `Rule ${index + 1}: "From" must be less than or equal to "To"`,
      });
    }
  });

  for (let i = 0; i < validRules.length; i++) {
    for (let j = i + 1; j < validRules.length; j++) {
      const rule1 = validRules[i];
      const rule2 = validRules[j];

      const from1 = Number(rule1.fromWeeks);
      const to1 = Number(rule1.toWeeks);
      const from2 = Number(rule2.fromWeeks);
      const to2 = Number(rule2.toWeeks);

      if (from1 <= to2 && from2 <= to1) {
        const overlapStart = Math.max(from1, from2);
        const overlapEnd = Math.min(to1, to2);

        if (overlapStart === overlapEnd) {
          errors.push({
            ruleIndex: i,
            ruleIndex2: j,
            message: `Week ${overlapStart} is included in two rules.`,
          });
        } else {
          errors.push({
            ruleIndex: i,
            ruleIndex2: j,
            message: `Weeks ${overlapStart}-${overlapEnd} are included in two rules.`,
          });
        }
      }
    }
  }

  if (validRules.length > 0 && errors.length === 0) {
    const sortedRules = [...validRules].sort(
      (a, b) => Number(a.fromWeeks) - Number(b.fromWeeks)
    );

    for (let i = 0; i < sortedRules.length - 1; i++) {
      const currentTo = Number(sortedRules[i].toWeeks);
      const nextFrom = Number(sortedRules[i + 1].fromWeeks);

      if (nextFrom > currentTo + 1) {
        const gapStart = currentTo + 1;
        const gapEnd = nextFrom - 1;

        if (gapStart === gapEnd) {
          warnings.push({
            message: `Week ${gapStart} has no price rule; that duration will not be available.`,
          });
        } else {
          warnings.push({
            message: `Weeks ${gapStart}-${gapEnd} have no price rule; those durations will not be available.`,
          });
        }
      }
    }
  }

  return { errors, warnings };
}

function PricingRulesTable({
  pricingRules = [],
  onRulesChange,
  disabled = false,
  currency = "EUR",
}) {
  const [localRules, setLocalRules] = useState([]);

  useEffect(() => {
    if (pricingRules && pricingRules.length > 0) {
      setLocalRules(pricingRules);
    } else {
      setLocalRules([
        {
          id: Date.now(),
          fromWeeks: "",
          toWeeks: "",
          priceType: "per_week",
          amount: "",
          tag: "",
          color: "",
        },
      ]);
    }
  }, [pricingRules]);

  const validation = useMemo(() => validatePricingRules(localRules), [localRules]);

  const handleUpdateRule = (index, field, value) => {
    const newRules = [...localRules];
    newRules[index] = { ...newRules[index], [field]: value };
    setLocalRules(newRules);
    onRulesChange?.(newRules);
  };

  const handleAddRule = () => {
    const newRules = [
      ...localRules,
      {
        id: Date.now(),
        fromWeeks: "",
        toWeeks: "",
        priceType: "per_week",
        amount: "",
        tag: "",
        color: "",
      },
    ];
    setLocalRules(newRules);
    onRulesChange?.(newRules);
  };

  const handleRemoveRule = (index) => {
    if (localRules.length <= 1) return;
    const newRules = localRules.filter((_, i) => i !== index);
    setLocalRules(newRules);
    onRulesChange?.(newRules);
  };

  const isRowWithError = (index) => {
    return validation.errors.some(
      (e) => e.ruleIndex === index || e.ruleIndex2 === index
    );
  };

  return (
    <SoftBox>
      <SoftBox mb={2}>
        <SoftTypography variant="h6" fontWeight="medium">
          Pricing Rules (by programme duration in weeks)
        </SoftTypography>
        <SoftTypography variant="caption" color="text">
          Define one or more rules. For each duration range, choose whether the price is per week
          or a fixed total.
        </SoftTypography>
      </SoftBox>

      {validation.errors.length > 0 && (
        <SoftBox mb={2}>
          {validation.errors.map((error, idx) => (
            <Alert key={idx} severity="error" sx={{ mb: 1 }}>
              {error.message}
            </Alert>
          ))}
        </SoftBox>
      )}

      {validation.warnings.length > 0 && (
        <SoftBox mb={2}>
          {validation.warnings.map((warning, idx) => (
            <Alert key={idx} severity="warning" sx={{ mb: 1 }}>
              {warning.message}
            </Alert>
          ))}
        </SoftBox>
      )}

      <Paper variant="outlined" sx={{ p: 2 }}>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={1.8}>
            <SoftTypography variant="caption" fontWeight="bold">
              From (weeks) *
            </SoftTypography>
          </Grid>
          <Grid item xs={1.8}>
            <SoftTypography variant="caption" fontWeight="bold">
              To (weeks) *
            </SoftTypography>
          </Grid>
          <Grid item xs={2.2}>
            <SoftTypography variant="caption" fontWeight="bold">
              Price Type *
            </SoftTypography>
          </Grid>
          <Grid item xs={1.8}>
            <SoftTypography variant="caption" fontWeight="bold">
              Amount ({getCurrencySymbol(currency)}) *
            </SoftTypography>
          </Grid>
          <Grid item xs={1.6}>
            <SoftTypography variant="caption" fontWeight="bold">
              Tag
            </SoftTypography>
          </Grid>
          <Grid item xs={1.6}>
            <SoftTypography variant="caption" fontWeight="bold">
              Color
            </SoftTypography>
          </Grid>
          <Grid item xs={1.2}>
          </Grid>
        </Grid>

        {localRules.map((rule, index) => (
          <Grid
            container
            spacing={2}
            key={rule.id || index}
            sx={{
              mb: 2,
              alignItems: "center",
              backgroundColor: isRowWithError(index) ? "rgba(244, 67, 54, 0.1)" : "transparent",
              borderRadius: 1,
              p: isRowWithError(index) ? 1 : 0,
            }}
          >
            <Grid item xs={1.8}>
              <SoftInput
                type="number"
                placeholder="1"
                value={rule.fromWeeks || ""}
                onChange={(e) => handleUpdateRule(index, "fromWeeks", e.target.value)}
                disabled={disabled}
                inputProps={{ min: 1 }}
                error={isRowWithError(index)}
              />
            </Grid>
            <Grid item xs={1.8}>
              <SoftInput
                type="number"
                placeholder="4"
                value={rule.toWeeks || ""}
                onChange={(e) => handleUpdateRule(index, "toWeeks", e.target.value)}
                disabled={disabled}
                inputProps={{ min: 1 }}
                error={isRowWithError(index)}
              />
            </Grid>
            <Grid item xs={2.2}>
              <SoftSelect
                value={PRICE_TYPE_OPTIONS.find((opt) => opt.value === rule.priceType) || PRICE_TYPE_OPTIONS[0]}
                onChange={(selected) => handleUpdateRule(index, "priceType", selected?.value || "per_week")}
                options={PRICE_TYPE_OPTIONS}
                isDisabled={disabled}
                placeholder="Select type"
              />
            </Grid>
            <Grid item xs={1.8}>
              <SoftInput
                type="number"
                placeholder="100"
                value={rule.amount || ""}
                onChange={(e) => handleUpdateRule(index, "amount", e.target.value)}
                disabled={disabled}
                inputProps={{ min: 0, step: "0.01" }}
              />
            </Grid>
            <Grid item xs={1.6}>
              <SoftInput
                placeholder="Tag"
                value={rule.tag || ""}
                onChange={(e) => handleUpdateRule(index, "tag", e.target.value)}
                disabled={disabled}
              />
            </Grid>
            <Grid item xs={1.6}>
              <SoftSelect
                value={rule.color ? { value: rule.color, label: rule.color } : null}
                onChange={(option) => handleUpdateRule(index, "color", option?.value || "")}
                options={[
                  { value: "blue", label: "Blue" },
                  { value: "green", label: "Green" },
                  { value: "orange", label: "Orange" },
                  { value: "pink", label: "Pink" },
                  { value: "navy", label: "Navy" },
                ]}
                isDisabled={disabled}
                placeholder="Color"
              />
            </Grid>
            <Grid item xs={1.2}>
              <SoftBox display="flex" justifyContent="center">
                <Tooltip title={localRules.length <= 1 ? "At least one rule is required" : "Delete rule"}>
                  <span>
                    <SoftButton
                      variant="text"
                      color="error"
                      size="small"
                      onClick={() => handleRemoveRule(index)}
                      disabled={disabled || localRules.length <= 1}
                      sx={{ minWidth: "auto", p: 1 }}
                    >
                      <Icon>delete</Icon>
                    </SoftButton>
                  </span>
                </Tooltip>
              </SoftBox>
            </Grid>
          </Grid>
        ))}

        <SoftBox display="flex" justifyContent="flex-start" mt={2}>
          <SoftButton
            variant="outlined"
            color="info"
            size="small"
            onClick={handleAddRule}
            disabled={disabled}
            startIcon={<Icon>add</Icon>}
          >
            Add pricing rule
          </SoftButton>
        </SoftBox>
      </Paper>
    </SoftBox>
  );
}

PricingRulesTable.propTypes = {
  pricingRules: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      fromWeeks: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      toWeeks: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      priceType: PropTypes.oneOf(["per_week", "fixed"]),
      amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })
  ),
  onRulesChange: PropTypes.func,
  disabled: PropTypes.bool,
  currency: PropTypes.string,
};

export { validatePricingRules };
export default PricingRulesTable;
