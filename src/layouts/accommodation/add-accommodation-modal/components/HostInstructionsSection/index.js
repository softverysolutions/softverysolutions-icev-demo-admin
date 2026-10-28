import { useState } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftEditor from "components/SoftEditor";
import FormFieldError from "components/FormFieldError";
import { validateHostPhone, validateHostWhatsapp, validateHostEmail } from "utils/hostContactValidation";

function FieldLabel({ children }) {
  return (
    <SoftBox mb={1} ml={0.5} lineHeight={0} display="inline-block">
      <SoftTypography component="label" variant="caption" fontWeight="bold">
        {children}
      </SoftTypography>
    </SoftBox>
  );
}

FieldLabel.propTypes = {
  children: PropTypes.node.isRequired,
};

function HostInstructionsSection({
  accommodationInstructions,
  accommodationInstructionsNote,
  accommodationContactType,
  accommodationContactName,
  hostPhone,
  hostWhatsapp,
  hostEmail,
  houseRules,
  onFieldChange,
  disabled = false,
}) {
  const [hostPhoneError, setHostPhoneError] = useState("");
  const [hostWhatsappError, setHostWhatsappError] = useState("");
  const [hostEmailError, setHostEmailError] = useState("");

  const handleHostPhoneChange = (event) => {
    const value = event.target.value;
    onFieldChange("hostPhone", value);
    if (hostPhoneError) {
      const result = validateHostPhone(value);
      setHostPhoneError(result.valid ? "" : result.message);
    }
  };

  const handleHostWhatsappChange = (event) => {
    const value = event.target.value;
    onFieldChange("hostWhatsapp", value);
    if (hostWhatsappError) {
      const result = validateHostWhatsapp(value);
      setHostWhatsappError(result.valid ? "" : result.message);
    }
  };

  return (
    <SoftBox>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Host &amp; Instructions
      </SoftTypography>
      <SoftTypography variant="caption" color="text" display="block" mb={2}>
        Arrival guidance and host contact details shown to students on the accommodation details
        page.
      </SoftTypography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FieldLabel>Accommodation instructions</FieldLabel>
          <SoftBox dir="ltr" sx={{ direction: "ltr", textAlign: "left" }}>
            <SoftEditor
              value={accommodationInstructions || ""}
              onChange={(value) => onFieldChange("accommodationInstructions", value)}
              disabled={disabled}
              inModal
            />
          </SoftBox>
        </Grid>

        <Grid item xs={12}>
          <FieldLabel>Accommodation note</FieldLabel>
          <SoftInput
            multiline
            rows={3}
            value={accommodationInstructionsNote || ""}
            onChange={(event) =>
              onFieldChange("accommodationInstructionsNote", event.target.value)
            }
            placeholder="Internal or extra note about this accommodation..."
            disabled={disabled}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FieldLabel>Contact type</FieldLabel>
          <SoftInput
            value={accommodationContactType || ""}
            onChange={(event) => onFieldChange("accommodationContactType", event.target.value)}
            placeholder="e.g. Host family, Residence manager"
            disabled={disabled}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <FieldLabel>Contact name</FieldLabel>
          <SoftInput
            value={accommodationContactName || ""}
            onChange={(event) => onFieldChange("accommodationContactName", event.target.value)}
            placeholder="e.g. Mary O'Sullivan"
            disabled={disabled}
          />
        </Grid>

        <Grid item xs={12} md={4}>
          <FieldLabel>Host phone</FieldLabel>
          <SoftInput
            value={hostPhone || ""}
            onChange={handleHostPhoneChange}
            onBlur={() => {
              const result = validateHostPhone(hostPhone);
              setHostPhoneError(result.valid ? "" : result.message);
            }}
            placeholder="+353 86 555 0142"
            error={Boolean(hostPhoneError)}
            disabled={disabled}
          />
          <FormFieldError error={hostPhoneError} />
        </Grid>

        <Grid item xs={12} md={4}>
          <FieldLabel>Host WhatsApp (must be a WhatsApp link)</FieldLabel>
          <SoftInput
            value={hostWhatsapp || ""}
            onChange={handleHostWhatsappChange}
            onBlur={() => {
              const result = validateHostWhatsapp(hostWhatsapp);
              setHostWhatsappError(result.valid ? "" : result.message);
            }}
            placeholder="https://wa.me/353871234567"
            error={Boolean(hostWhatsappError)}
            disabled={disabled}
          />
          <FormFieldError error={hostWhatsappError} />
        </Grid>

        <Grid item xs={12} md={4}>
          <FieldLabel>Host email</FieldLabel>
          <SoftInput
            type="email"
            value={hostEmail || ""}
            onChange={(event) => {
              onFieldChange("hostEmail", event.target.value);
              if (hostEmailError) {
                const result = validateHostEmail(event.target.value);
                setHostEmailError(result.valid ? "" : result.message);
              }
            }}
            onBlur={() => {
              const result = validateHostEmail(hostEmail);
              setHostEmailError(result.valid ? "" : result.message);
            }}
            placeholder="host@example.com"
            error={Boolean(hostEmailError)}
            disabled={disabled}
          />
          <FormFieldError error={hostEmailError} />
        </Grid>

        <Grid item xs={12}>
          <FieldLabel>House rules</FieldLabel>
          <SoftBox dir="ltr" sx={{ direction: "ltr", textAlign: "left" }}>
            <SoftEditor
              value={houseRules || ""}
              onChange={(value) => onFieldChange("houseRules", value)}
              disabled={disabled}
              inModal
            />
          </SoftBox>
        </Grid>
      </Grid>
    </SoftBox>
  );
}

HostInstructionsSection.propTypes = {
  accommodationInstructions: PropTypes.string,
  accommodationInstructionsNote: PropTypes.string,
  accommodationContactType: PropTypes.string,
  accommodationContactName: PropTypes.string,
  hostPhone: PropTypes.string,
  hostWhatsapp: PropTypes.string,
  hostEmail: PropTypes.string,
  houseRules: PropTypes.string,
  onFieldChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default HostInstructionsSection;
