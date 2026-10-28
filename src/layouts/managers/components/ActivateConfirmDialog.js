import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

function ActivateConfirmDialog({ open, onClose, manager, onConfirm, isSubmitting }) {
  if (!manager) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <SoftTypography variant="h6" fontWeight="bold">
          Activate user
        </SoftTypography>
      </DialogTitle>
      <DialogContent>
        <SoftBox>
          <SoftTypography variant="body2" color="text">
            Are you sure you want to activate <strong>{manager.name}</strong> ({manager.email})?
            They will be able to log in again.
          </SoftTypography>
        </SoftBox>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <SoftButton variant="outlined" color="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </SoftButton>
        <SoftButton
          variant="gradient"
          color="info"
          onClick={() => onConfirm?.(manager)}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Activating…" : "Activate"}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

ActivateConfirmDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  manager: PropTypes.object,
  onConfirm: PropTypes.func.isRequired,
  isSubmitting: PropTypes.bool,
};

export default ActivateConfirmDialog;
