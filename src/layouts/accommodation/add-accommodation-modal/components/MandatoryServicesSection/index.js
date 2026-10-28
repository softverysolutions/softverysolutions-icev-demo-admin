import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";

import {
  MANDATORY_PRICING_OPTIONS,
  sanitizeMandatoryServiceAmountInput,
} from "utils/accommodationMandatoryServices";

function MandatoryServicesSection({ rows, currency, onChange, onAdd, onRemove, disabled }) {
  return (
    <SoftBox mt={3}>
      <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
        <SoftBox>
          <SoftTypography variant="h6" fontWeight="medium">
            Mandatory fees
          </SoftTypography>
          <SoftTypography variant="caption" color="text" display="block" mt={0.5}>
            Add required fees charged with this accommodation.
          </SoftTypography>
        </SoftBox>
        {!disabled && (
          <SoftButton
            variant="outlined"
            color="info"
            size="small"
            startIcon={<Icon fontSize="small">add</Icon>}
            onClick={onAdd}
          >
            Add fee
          </SoftButton>
        )}
      </SoftBox>

      {rows.length === 0 && (
        <SoftTypography variant="body2" color="text.secondary" mb={2}>
          No mandatory services. Use &quot;Add fee&quot; for fees that apply to every booking.
        </SoftTypography>
      )}

      {rows.map((row, index) => (
        <SoftBox
          key={row.id || `mandatory-${index}`}
          mb={2}
          p={2}
          sx={{
            border: "1px solid",
            borderColor: "grey.300",
            borderRadius: 2,
            backgroundColor: "grey.50",
          }}
        >
          <Grid container spacing={2} alignItems="flex-start">
            <Grid item xs={12} md={3}>
              <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                Name *
              </SoftTypography>
              <SoftInput
                placeholder="e.g. Final cleaning"
                value={row.name}
                onChange={(e) => onChange(index, "name", e.target.value)}
                disabled={disabled}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                Charge type
              </SoftTypography>
              <SoftSelect
                placeholder="Type"
                options={MANDATORY_PRICING_OPTIONS}
                value={
                  MANDATORY_PRICING_OPTIONS.find((o) => o.value === row.pricingType) ||
                  MANDATORY_PRICING_OPTIONS[0]
                }
                onChange={(opt) => onChange(index, "pricingType", opt?.value || "per_week")}
                isDisabled={disabled}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                Amount ({currency})
              </SoftTypography>
              <SoftInput
                type="text"
                inputProps={{ inputMode: "decimal", autoComplete: "off" }}
                value={row.amount}
                onChange={(e) =>
                  onChange(index, "amount", sanitizeMandatoryServiceAmountInput(e.target.value))
                }
                disabled={disabled}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={2}>
              <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
                Status
              </SoftTypography>
              <FormControlLabel
                sx={{ m: 0, alignItems: "center" }}
                control={
                  <Checkbox
                    checked={row.isActive !== false}
                    onChange={(e) => onChange(index, "isActive", e.target.checked)}
                    disabled={disabled}
                    size="small"
                  />
                }
                label={
                  <SoftTypography variant="caption" color="text">
                    {row.isActive !== false ? "Active" : "Inactive"}
                  </SoftTypography>
                }
              />
            </Grid>
            <Grid
              item
              xs={12}
              md={1}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5} aria-hidden sx={{ visibility: "hidden" }}>
                .
              </SoftTypography>
              {!disabled && (
                <IconButton
                  color="error"
                  size="small"
                  aria-label="Remove fee"
                  onClick={() => onRemove(index)}
                >
                  <Icon fontSize="small">delete</Icon>
                </IconButton>
              )}
            </Grid>
          </Grid>
        </SoftBox>
      ))}
    </SoftBox>
  );
}

MandatoryServicesSection.propTypes = {
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      amount: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      pricingType: PropTypes.string,
      isActive: PropTypes.bool,
    })
  ).isRequired,
  currency: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default MandatoryServicesSection;
