import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Grid from "@mui/material/Grid";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Box from "@mui/material/Box";
import Icon from "@mui/material/Icon";
import CircularProgress from "@mui/material/CircularProgress";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";
import SoftButton from "components/SoftButton";

import { NEW_USER_UNIT_OPTIONS } from "../constants";

const CAPTION_MIN_HEIGHT = 40;
const selectControlSx = {
  "& .react-select__control": {
    minHeight: 40,
  },
};

function NewUserPromoCard({
  enabled,
  onEnabledChange,
  amount,
  onAmountChange,
  expiryValue,
  onExpiryValueChange,
  expiryUnit,
  onExpiryUnitChange,
  combineWithSchool,
  onCombineWithSchoolChange,
  onSave,
  saving,
  loadingConfig,
}) {
  const unitValue =
    NEW_USER_UNIT_OPTIONS.find((o) => o.value === expiryUnit) || NEW_USER_UNIT_OPTIONS[1];

  return (
    <Card sx={{ mb: 3 }}>
      <SoftBox p={3}>
        {loadingConfig ? (
          <SoftBox display="flex" justifyContent="center" py={4}>
            <CircularProgress color="info" size={32} />
          </SoftBox>
        ) : null}
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={2}
          sx={{ display: loadingConfig ? "none" : "flex" }}
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Icon sx={{ color: "info.main", mt: 0.25 }}>card_giftcard</Icon>
            <SoftBox>
              <SoftTypography variant="h6" fontWeight="medium">
                New User Promo Code
              </SoftTypography>
              <SoftTypography
                variant="button"
                fontWeight="regular"
                color="text"
                display="block"
                mt={0.5}
              >
                One-time system code per user, created when they request it in the product. Fixed
                discount on the full booking total. Expiry is stored in whole hours; you can enter
                hours or days below.
              </SoftTypography>
            </SoftBox>
          </Stack>
          <FormControlLabel
            control={
              <Switch
                checked={enabled}
                onChange={(e) => onEnabledChange(e.target.checked)}
                color="info"
              />
            }
            label={<SoftTypography variant="button">Enabled</SoftTypography>}
          />
        </Stack>

        <Grid
          container
          spacing={3}
          mt={2}
          alignItems="flex-start"
          sx={{ display: loadingConfig ? "none" : undefined }}
        >
          <Grid item xs={12} sm={6} md={3}>
            <SoftTypography
              component="label"
              variant="caption"
              fontWeight="bold"
              mb={1}
              display="block"
            >
              Discount Amount *
            </SoftTypography>
            <SoftInput
              type="number"
              placeholder="e.g. 25"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              disabled={!enabled}
              fullWidth
            />
            <SoftTypography
              variant="caption"
              color="text"
              display="block"
              mt={0.5}
              sx={{ minHeight: CAPTION_MIN_HEIGHT }}
            >
              Fixed discount in euros (EUR).
            </SoftTypography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <SoftTypography
              component="label"
              variant="caption"
              fontWeight="bold"
              mb={1}
              display="block"
            >
              Expiry Duration After Signup *
            </SoftTypography>
            <SoftInput
              type="number"
              placeholder="5"
              value={expiryValue}
              onChange={(e) => onExpiryValueChange(e.target.value)}
              disabled={!enabled}
              fullWidth
            />
            <SoftTypography
              variant="caption"
              color="text"
              display="block"
              mt={0.5}
              sx={{ minHeight: CAPTION_MIN_HEIGHT }}
            >
              Valid for this duration after the code is generated (countdown starts at generation).
            </SoftTypography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <SoftTypography
              component="label"
              variant="caption"
              fontWeight="bold"
              mb={1}
              display="block"
            >
              Unit
            </SoftTypography>
            <SoftBox sx={selectControlSx}>
              <SoftSelect
                value={unitValue}
                onChange={(selected) => onExpiryUnitChange(selected?.value ?? "days")}
                options={NEW_USER_UNIT_OPTIONS}
                isDisabled={!enabled}
                isClearable={false}
                menuPortalTarget={typeof document !== "undefined" ? document.body : null}
                menuPosition="fixed"
              />
            </SoftBox>
            <SoftTypography
              variant="caption"
              color="text"
              display="block"
              mt={0.5}
              sx={{ minHeight: CAPTION_MIN_HEIGHT }}
            >
              Hours or days — applies to the expiry duration field.
            </SoftTypography>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <SoftTypography
              component="label"
              variant="caption"
              fontWeight="bold"
              mb={1}
              display="block"
            >
              Combine with provider discount
            </SoftTypography>
            <Box
              display="flex"
              alignItems="center"
              gap={1}
              minHeight={40}
              sx={{ opacity: enabled ? 1 : 0.5 }}
            >
              <SoftTypography variant="button" color="text">
                {combineWithSchool ? "Yes" : "No"}
              </SoftTypography>
              <Switch
                checked={combineWithSchool}
                onChange={(e) => onCombineWithSchoolChange(e.target.checked)}
                disabled={!enabled}
                color="info"
              />
            </Box>
            <SoftTypography
              variant="caption"
              color="text"
              display="block"
              mt={0.5}
              sx={{ minHeight: CAPTION_MIN_HEIGHT }}
            >
              Allow stacking with provider discounts.
            </SoftTypography>
          </Grid>
        </Grid>

        {!loadingConfig && onSave ? (
          <SoftBox display="flex" justifyContent="flex-end" mt={3}>
            <SoftButton color="info" variant="gradient" onClick={onSave} disabled={saving}>
              {saving ? (
                <Stack direction="row" alignItems="center" spacing={1}>
                  <CircularProgress size={18} color="inherit" />
                  <span>Saving…</span>
                </Stack>
              ) : (
                "Save settings"
              )}
            </SoftButton>
          </SoftBox>
        ) : null}
      </SoftBox>
    </Card>
  );
}

NewUserPromoCard.propTypes = {
  enabled: PropTypes.bool.isRequired,
  onEnabledChange: PropTypes.func.isRequired,
  amount: PropTypes.string.isRequired,
  onAmountChange: PropTypes.func.isRequired,
  expiryValue: PropTypes.string.isRequired,
  onExpiryValueChange: PropTypes.func.isRequired,
  expiryUnit: PropTypes.string.isRequired,
  onExpiryUnitChange: PropTypes.func.isRequired,
  combineWithSchool: PropTypes.bool.isRequired,
  onCombineWithSchoolChange: PropTypes.func.isRequired,
  onSave: PropTypes.func,
  saving: PropTypes.bool,
  loadingConfig: PropTypes.bool,
};

NewUserPromoCard.defaultProps = {
  onSave: null,
  saving: false,
  loadingConfig: false,
};

export default NewUserPromoCard;
