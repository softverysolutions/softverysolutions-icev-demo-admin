import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import { Alert, IconButton } from "@mui/material";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftBadge from "components/SoftBadge";
import SoftSelect from "components/SoftSelect";
import SoftButton from "components/SoftButton";
import { TravelService } from "services/travelService";

const REFUND_STATUS_OPTIONS = [
  { value: "notStarted", label: "Not started" },
  { value: "inProgress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "notRequired", label: "Not required" },
];

const REFUND_STATUS_COLORS = {
  notStarted: "warning",
  not_started: "warning",
  inProgress: "info",
  in_progress: "info",
  completed: "success",
  notRequired: "secondary",
  not_required: "secondary",
};

const REFUND_STATUS_LABELS = {
  notStarted: "Not started",
  not_started: "Not started",
  inProgress: "In progress",
  in_progress: "In progress",
  completed: "Completed",
  notRequired: "Not required",
  not_required: "Not required",
};

function CancellationInfo({ cancellationReason, refundStatus, orderId, onUpdate }) {
  // Always show if we have cancellation data
  if (!cancellationReason && !refundStatus) {
    return null;
  }
  const getInitialRefundStatus = (status) => {
    if (!status) return null;
    const normalized = status.replace(/_/g, '');
    return REFUND_STATUS_OPTIONS.find(opt => 
      opt.value === status || 
      opt.value === normalized ||
      opt.value.toLowerCase() === status.toLowerCase().replace(/_/g, '')
    ) || REFUND_STATUS_OPTIONS.find(opt => opt.value === "notStarted") || null;
  };

  const [isEditing, setIsEditing] = useState(false);
  const [selectedRefundStatus, setSelectedRefundStatus] = useState(() => getInitialRefundStatus(refundStatus));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setSelectedRefundStatus(getInitialRefundStatus(refundStatus));
    }
  }, [refundStatus, isEditing]);

  const handleSaveRefundStatus = async () => {
    if (!selectedRefundStatus || !orderId) return;
    
    setIsSaving(true);
    try {
      await TravelService.updateRefundStatus(orderId, selectedRefundStatus.value);
      setIsEditing(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating refund status:", error);
      alert(`Failed to update refund status: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setSelectedRefundStatus(getInitialRefundStatus(refundStatus));
    setIsEditing(false);
  };

  const getRefundStatusValue = () => {
    if (!refundStatus) return null;
    const normalized = refundStatus.replace(/_/g, '');
    return REFUND_STATUS_OPTIONS.find(opt => 
      opt.value === refundStatus || 
      opt.value === normalized ||
      opt.value.toLowerCase() === refundStatus.toLowerCase().replace(/_/g, '')
    ) || null;
  };

  const currentRefundStatusValue = getRefundStatusValue();
  const normalizedRefundStatus = refundStatus?.replace(/_/g, '') || refundStatus;

  return (
    <Card>
      <SoftBox 
        p={2} 
        sx={{
          backgroundColor: "#ffebee",
          borderLeft: "4px solid #f44336",
        }}
      >
        <SoftBox display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <SoftBox display="flex" alignItems="center" gap={2} flexWrap="wrap">
            <SoftBox display="flex" alignItems="center" gap={1}>
              <Icon sx={{ color: "#f44336" }}>cancel</Icon>
              <SoftTypography variant="h6" fontWeight="bold" color="error">
                Order Cancelled
              </SoftTypography>
            </SoftBox>
            
            {cancellationReason && (
              <SoftBox display="flex" alignItems="center" gap={1}>
                <SoftTypography variant="caption" fontWeight="bold" color="text.secondary">
                  Reason:
                </SoftTypography>
                <SoftTypography variant="body2" color="text">
                  {cancellationReason}
                </SoftTypography>
              </SoftBox>
            )}

            {refundStatus && (
              <SoftBox display="flex" alignItems="center" gap={1}>
                <SoftTypography variant="caption" fontWeight="bold" color="text.secondary">
                  Refund Status:
                </SoftTypography>
                {isEditing ? (
                  <SoftBox display="flex" alignItems="center" gap={0.5}>
                    <SoftSelect
                      value={selectedRefundStatus}
                      onChange={setSelectedRefundStatus}
                      options={REFUND_STATUS_OPTIONS}
                      placeholder="Select refund status"
                      isClearable={false}
                      sx={{ minWidth: "140px" }}
                    />
                    <IconButton 
                      size="small" 
                      color="success" 
                      onClick={handleSaveRefundStatus}
                      disabled={isSaving}
                      sx={{ p: 0.5 }}
                    >
                      <Icon fontSize="small">check</Icon>
                    </IconButton>
                    <IconButton 
                      size="small" 
                      color="error" 
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      sx={{ p: 0.5 }}
                    >
                      <Icon fontSize="small">close</Icon>
                    </IconButton>
                  </SoftBox>
                ) : (
                  <SoftBadge
                    variant="contained"
                    color={REFUND_STATUS_COLORS[normalizedRefundStatus] || REFUND_STATUS_COLORS[refundStatus] || "info"}
                    size="small"
                    badgeContent={REFUND_STATUS_LABELS[normalizedRefundStatus] || REFUND_STATUS_LABELS[refundStatus] || refundStatus}
                    container
                  />
                )}
              </SoftBox>
            )}
          </SoftBox>

          {refundStatus && !isEditing && (
            <IconButton 
              size="small" 
              onClick={() => setIsEditing(true)}
              sx={{ p: 0.5 }}
            >
              <Icon fontSize="small">edit</Icon>
            </IconButton>
          )}
        </SoftBox>
      </SoftBox>
    </Card>
  );
}

CancellationInfo.propTypes = {
  cancellationReason: PropTypes.string,
  refundStatus: PropTypes.string,
  orderId: PropTypes.string,
  onUpdate: PropTypes.func,
};

export default CancellationInfo;
