import { useState } from "react";
import PropTypes from "prop-types";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";

const REFUND_STATUS_OPTIONS = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "not_required", label: "Not required" },
];

function CancelOrderModal({ open, onClose, onConfirm, orderId }) {
  const [cancellationReason, setCancellationReason] = useState("");
  const [refundStatus, setRefundStatus] = useState(null);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setCancellationReason("");
    setRefundStatus(null);
    setErrors({});
    onClose();
  };

  const validate = () => {
    const newErrors = {};
    
    if (!cancellationReason.trim()) {
      newErrors.cancellationReason = "Cancellation reason is required";
    }
    
    if (!refundStatus) {
      newErrors.refundStatus = "Refund status is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm({
        cancellationReason: cancellationReason.trim(),
        refundStatus: refundStatus.value,
      });
      handleClose();
    } catch (error) {
      console.error("Error cancelling order:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          maxHeight: "90vh",
          overflow: "auto",
        },
      }}
    >
      <DialogTitle>
        <SoftTypography variant="h5" fontWeight="medium">
          Cancel Order #{orderId}
        </SoftTypography>
      </DialogTitle>

      <DialogContent>
        <SoftBox p={2}>
          <SoftBox mb={3}>
            <SoftTypography variant="body2" color="text" mb={1}>
              Are you sure you want to cancel this order? This action will:
            </SoftTypography>
            <SoftBox component="ul" pl={3} mb={0}>
              <SoftTypography component="li" variant="body2" color="text">
                Set order status to Cancelled
              </SoftTypography>
              <SoftTypography component="li" variant="body2" color="text">
                Release the seat in the programme and the room booking
              </SoftTypography>
            </SoftBox>
            <SoftTypography variant="body2" color="text" mt={2} fontWeight="medium">
              Track the refund to the customer with the refund status below.
            </SoftTypography>
          </SoftBox>

          <SoftBox mb={3}>
            <SoftTypography
              component="label"
              variant="caption"
              fontWeight="bold"
              mb={1}
              display="block"
            >
              Cancellation Reason *
            </SoftTypography>
            <SoftInput
              placeholder="Enter cancellation reason"
              value={cancellationReason}
              onChange={(e) => {
                setCancellationReason(e.target.value);
                if (errors.cancellationReason) {
                  setErrors((prev) => ({ ...prev, cancellationReason: "" }));
                }
              }}
              error={!!errors.cancellationReason}
              multiline
              rows={4}
            />
            {errors.cancellationReason && (
              <SoftTypography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                {errors.cancellationReason}
              </SoftTypography>
            )}
          </SoftBox>

          <SoftBox mb={3}>
            <SoftTypography
              component="label"
              variant="caption"
              fontWeight="bold"
              mb={1}
              display="block"
            >
              Refund Status *
            </SoftTypography>
            <SoftSelect
              value={refundStatus}
              onChange={(option) => {
                setRefundStatus(option);
                if (errors.refundStatus) {
                  setErrors((prev) => ({ ...prev, refundStatus: "" }));
                }
              }}
              options={REFUND_STATUS_OPTIONS}
              placeholder="Select refund status"
              isClearable={false}
            />
            {errors.refundStatus && (
              <SoftTypography variant="caption" color="error" sx={{ mt: 0.5, display: "block" }}>
                {errors.refundStatus}
              </SoftTypography>
            )}
            <SoftTypography variant="caption" color="text" sx={{ mt: 0.5, display: "block" }}>
              This is for tracking only. You can edit it later.
            </SoftTypography>
          </SoftBox>
        </SoftBox>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <SoftButton
          variant="outlined"
          color="dark"
          onClick={handleClose}
          disabled={isSubmitting}
        >
          Cancel
        </SoftButton>
        <SoftButton
          variant="gradient"
          color="error"
          onClick={handleConfirm}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Cancelling..." : "Cancel Order"}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

CancelOrderModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  orderId: PropTypes.string.isRequired,
};

export default CancelOrderModal;
