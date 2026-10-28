import PropTypes from "prop-types";
import { useState } from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import AddUserModalForm from "./AddUserModalForm";
import { validateAddUserForm, validateEmail, validateName, validatePassword } from "./validation";

const INITIAL_VALUES = {
  name: "",
  email: "",
  role: "",
  password: "",
};

function AddUserModal({ open, onClose, onSubmit, isSubmitting }) {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});

  const handleClose = () => {
    if (isSubmitting) return;
    setValues(INITIAL_VALUES);
    setTouched({});
    setErrors({});
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target || {};
    setValues((prev) => ({ ...prev, [name]: value }));
    if (name === "name") {
      setTouched((prev) => ({ ...prev, name: true }));
      const nameError = validateName(value);
      setErrors((prev) => ({ ...prev, name: nameError || undefined }));
    } else if (name === "email") {
      setTouched((prev) => ({ ...prev, email: true }));
      const emailError = validateEmail(value);
      setErrors((prev) => ({ ...prev, email: emailError || undefined }));
    } else if (name === "password") {
      setTouched((prev) => ({ ...prev, password: true }));
      const passwordError = validatePassword(value);
      setErrors((prev) => ({ ...prev, password: passwordError || undefined }));
    } else if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const setFieldValue = (name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const setFieldTouched = (name) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async () => {
    const nextErrors = validateAddUserForm(values);
    setErrors(nextErrors);
    setTouched({ name: true, email: true, role: true, password: true });

    if (Object.keys(nextErrors).length > 0) return;

    try {
      await onSubmit?.(values);
      handleClose();
    } catch (err) {
      const apiErrors = err?.apiErrors || [];
      const nextErrors = {};
      const emailMsg = apiErrors.find(
        (m) => typeof m === "string" && (m.toLowerCase().includes("email") || m.toLowerCase().includes("valid"))
      );
      if (emailMsg) {
        nextErrors.email = emailMsg;
      }
      nextErrors.submit = nextErrors.email ? "Please fix the errors above." : (err?.message || "Failed to create user");
      setErrors((prev) => ({ ...prev, ...nextErrors }));
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <SoftBox display="flex" alignItems="center" justifyContent="space-between">
          <SoftTypography variant="h6" fontWeight="bold">
            Add New User
          </SoftTypography>
          <IconButton aria-label="Close" onClick={handleClose} size="small" disabled={isSubmitting}>
            <Icon>close</Icon>
          </IconButton>
        </SoftBox>
      </DialogTitle>
      <DialogContent dividers>
        <SoftBox component="form" autoComplete="off" noValidate>
        <AddUserModalForm
          values={values}
          errors={errors}
          touched={touched}
          handleChange={handleChange}
          setFieldValue={setFieldValue}
          setFieldTouched={setFieldTouched}
        />
        {errors.submit && (
          <SoftTypography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
            {errors.submit}
          </SoftTypography>
        )}
        </SoftBox>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <SoftButton variant="outlined" color="secondary" onClick={handleClose} disabled={isSubmitting}>
          Cancel
        </SoftButton>
        <SoftButton
          variant="gradient"
          color="info"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Creating…" : "Add User"}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

AddUserModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  isSubmitting: PropTypes.bool,
};

export default AddUserModal;
