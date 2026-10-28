import { useState } from "react";
import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";
import { ROLE_OPTIONS } from "../../constants/roles";
import { validatePassword } from "./validation";

function AddUserModalForm({
  values,
  errors,
  touched,
  handleChange,
  setFieldValue,
  setFieldTouched,
}) {
  const [showPassword, setShowPassword] = useState(false);

  const passwordError = touched.password && errors.password;
  const isPasswordValid = Boolean(
    values.password &&
      String(values.password).trim() &&
      !validatePassword(values.password)
  );
  const showPasswordRules = !isPasswordValid;

  return (
    <SoftBox display="flex" flexDirection="column" gap={2.5}>
      <SoftBox>
        <SoftTypography component="label" variant="caption" fontWeight="bold" display="block" mb={0.5}>
          Name *
        </SoftTypography>
        <SoftInput
          name="name"
          placeholder="Full name"
          value={values.name || ""}
          onChange={handleChange}
          onBlur={() => setFieldTouched("name")}
          error={!!(touched.name && errors.name)}
          fullWidth
        />
        {touched.name && errors.name && (
          <SoftTypography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
            {errors.name}
          </SoftTypography>
        )}
      </SoftBox>

      <SoftBox>
        <SoftTypography component="label" variant="caption" fontWeight="bold" display="block" mb={0.5}>
          Email *
        </SoftTypography>
        <SoftInput
          type="email"
          name="email"
          placeholder="user@example.com"
          value={values.email || ""}
          onChange={handleChange}
          onBlur={() => setFieldTouched("email")}
          error={!!(touched.email && errors.email)}
          fullWidth
          inputProps={{ autoComplete: "off" }}
        />
        {touched.email && errors.email && (
          <SoftTypography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
            {errors.email}
          </SoftTypography>
        )}
      </SoftBox>

      <SoftBox>
        <SoftTypography component="label" variant="caption" fontWeight="bold" display="block" mb={0.5}>
          Role *
        </SoftTypography>
        <SoftSelect
          options={ROLE_OPTIONS}
          value={ROLE_OPTIONS.find((o) => o.value === values.role) || null}
          onChange={(option) => setFieldValue("role", option?.value ?? "")}
          onBlur={() => setFieldTouched("role")}
          placeholder="Select role"
          isDisabled={false}
          isSearchable={false}
          openMenuOnFocus
          error={!!(touched.role && errors.role)}
        />
        {touched.role && errors.role && (
          <SoftTypography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
            {errors.role}
          </SoftTypography>
        )}
      </SoftBox>

      <SoftBox>
        <SoftTypography component="label" variant="caption" fontWeight="bold" display="block" mb={0.5}>
          Password *
        </SoftTypography>
        <SoftInput
          type={showPassword ? "text" : "password"}
          name="password"
          placeholder="Set initial password"
          value={values.password || ""}
          onChange={handleChange}
          onBlur={() => setFieldTouched("password")}
          error={!!passwordError}
          fullWidth
          inputProps={{ autoComplete: "new-password" }}
          icon={{
            component: (
              <SoftBox
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "100%",
                }}
              >
                <IconButton
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  onMouseDown={(e) => e.preventDefault()}
                  size="small"
                  sx={{ p: 0.25 }}
                >
                  <Icon fontSize="small">{showPassword ? "visibility_off" : "visibility"}</Icon>
                </IconButton>
              </SoftBox>
            ),
            direction: "right",
          }}
        />
        {passwordError && (
          <SoftTypography
            variant="caption"
            color="error"
            sx={{ mt: 0.5, display: "block" }}
          >
            {errors.password}
          </SoftTypography>
        )}
        {showPasswordRules && (
          <SoftTypography variant="caption" color="text" sx={{ mt: 0.5, display: "block", opacity: 0.8 }}>
            Min 6 characters
          </SoftTypography>
        )}
      </SoftBox>
    </SoftBox>
  );
}

AddUserModalForm.propTypes = {
  values: PropTypes.object.isRequired,
  errors: PropTypes.object.isRequired,
  touched: PropTypes.object.isRequired,
  handleChange: PropTypes.func.isRequired,
  setFieldValue: PropTypes.func.isRequired,
  setFieldTouched: PropTypes.func.isRequired,
};

export default AddUserModalForm;
