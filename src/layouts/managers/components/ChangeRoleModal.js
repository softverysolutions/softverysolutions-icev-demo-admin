import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftSelect from "components/SoftSelect";

import { ROLE_OPTIONS } from "../constants/roles";

function ChangeRoleModal({ open, onClose, manager, currentRole, onSave, isSubmitting }) {
  const [selectedRole, setSelectedRole] = useState(currentRole || "");

  useEffect(() => {
    if (open) setSelectedRole(currentRole || "");
  }, [open, currentRole]);

  const handleSave = () => {
    if (selectedRole) {
      onSave?.(selectedRole);
      onClose?.();
    }
  };

  if (!manager) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <SoftBox display="flex" alignItems="center" justifyContent="space-between">
          <SoftTypography variant="h6" fontWeight="bold">
            Change Role
          </SoftTypography>
          <IconButton aria-label="Close" onClick={onClose} size="small" disabled={isSubmitting}>
            <Icon>close</Icon>
          </IconButton>
        </SoftBox>
      </DialogTitle>
      <DialogContent dividers>
        <SoftTypography variant="body2" color="text" sx={{ mb: 2 }}>
          Change role for <strong>{manager.name}</strong> ({manager.email})
        </SoftTypography>
        <SoftBox>
          <SoftTypography component="label" variant="caption" fontWeight="bold" display="block" mb={0.5}>
            New role
          </SoftTypography>
          <SoftSelect
            options={ROLE_OPTIONS}
            value={ROLE_OPTIONS.find((o) => o.value === selectedRole) || null}
            onChange={(option) => setSelectedRole(option?.value ?? "")}
            placeholder="Select role"
            isDisabled={isSubmitting}
          />
        </SoftBox>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <SoftButton variant="outlined" color="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </SoftButton>
        <SoftButton
          variant="gradient"
          color="info"
          onClick={handleSave}
          disabled={!selectedRole || isSubmitting}
        >
          {isSubmitting ? "Saving…" : "Save"}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

ChangeRoleModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  manager: PropTypes.object,
  currentRole: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
};

export default ChangeRoleModal;
