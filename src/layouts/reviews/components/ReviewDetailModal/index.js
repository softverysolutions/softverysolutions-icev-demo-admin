import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Divider from "@mui/material/Divider";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftAvatar from "components/SoftAvatar";
import StarRating from "../StarRating";
import StatusBadge from "../StatusBadge";
import { REVIEW_STATUS, RATING_CRITERIA } from "../../constants";

function getComment(comment) {
  if (!comment) return "";
  if (typeof comment === "string") return comment;
  return (
    comment.text ||
    comment.en ||
    comment.value ||
    Object.values(comment).find((v) => typeof v === "string" && v.trim()) ||
    ""
  );
}

function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function MetaItem({ label, value }) {
  return (
    <SoftBox display="flex" gap={0.75}>
      <SoftTypography variant="caption" color="secondary" fontWeight="bold">
        {label}:
      </SoftTypography>
      <SoftTypography variant="caption" color="text">
        {value || "—"}
      </SoftTypography>
    </SoftBox>
  );
}

MetaItem.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.node };
MetaItem.defaultProps = { value: "" };

function RatingsSection({ title, average, criteria, ratings, comment }) {
  const text = getComment(comment);
  return (
    <SoftBox>
      <SoftBox display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <SoftTypography variant="h6" fontWeight="bold">
          {title}
        </SoftTypography>
        <StarRating value={typeof average === "number" ? average : null} showValue valueLeft />
      </SoftBox>
      {criteria.map(({ key, label }) => (
        <SoftBox
          key={key}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          py={0.5}
        >
          <SoftTypography variant="button" color="text">
            {label}
          </SoftTypography>
          <StarRating value={typeof ratings?.[key] === "number" ? ratings[key] : null} />
        </SoftBox>
      ))}
      {text && (
        <SoftBox mt={1.5} p={1.5} sx={{ backgroundColor: "grey.100", borderRadius: 1.5 }}>
          <SoftTypography variant="button" color="text">
            {text}
          </SoftTypography>
        </SoftBox>
      )}
    </SoftBox>
  );
}

RatingsSection.propTypes = {
  title: PropTypes.string.isRequired,
  average: PropTypes.number,
  criteria: PropTypes.array.isRequired,
  ratings: PropTypes.object,
  comment: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
};
RatingsSection.defaultProps = { average: null, ratings: {}, comment: null };

function ReviewDetailModal({ open, submission, busy, onClose, onApprove, onDecline, onUnblock }) {
  if (!submission) return null;

  const isPending = submission.status === REVIEW_STATUS.PENDING;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <SoftBox p={3} pb={1} display="flex" alignItems="flex-start" justifyContent="space-between">
        <SoftBox display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          {submission.avatarUrl && (
            <SoftAvatar src={submission.avatarUrl} alt={submission.userName} size="md" />
          )}
          <SoftTypography variant="h5" fontWeight="bold">
            Review from {submission.userName}
          </SoftTypography>
          <StatusBadge status={submission.status} />
        </SoftBox>
        <IconButton size="small" onClick={onClose}>
          <Icon>close</Icon>
        </IconButton>
      </SoftBox>

      <DialogContent sx={{ px: 3 }}>
        <SoftBox
          mb={2}
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            columnGap: 2,
            rowGap: 1,
          }}
        >
          <MetaItem label="Submitted" value={formatDateTime(submission.submittedAt)} />
          <MetaItem label="Order" value={submission.orderNumber} />
          <MetaItem label="Programme" value={submission.courseName} />
          <MetaItem label="Provider" value={submission.schoolName} />
          <MetaItem label="Location" value={submission.campusName} />
          <MetaItem label="City" value={submission.cityName} />
        </SoftBox>

        <Divider />

        <SoftBox my={2}>
          <RatingsSection
            title="Ratings"
            average={submission.rating}
            criteria={RATING_CRITERIA}
            ratings={submission.ratings}
            comment={submission.comment}
          />
        </SoftBox>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5, justifyContent: "space-between" }}>
        <SoftButton variant="text" color="secondary" disabled={busy} onClick={() => onUnblock(submission)}>
          Allow a new review
        </SoftButton>
        <SoftBox display="flex" gap={1} alignItems="center">
          {busy && <CircularProgress size={18} color="info" />}
          {isPending && (
            <>
              <SoftButton variant="outlined" color="dark" disabled={busy} onClick={() => onDecline(submission)}>
                Decline
              </SoftButton>
              <SoftButton variant="gradient" color="success" disabled={busy} onClick={() => onApprove(submission)}>
                Approve
              </SoftButton>
            </>
          )}
        </SoftBox>
      </DialogActions>
    </Dialog>
  );
}

ReviewDetailModal.propTypes = {
  open: PropTypes.bool.isRequired,
  submission: PropTypes.object,
  busy: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onDecline: PropTypes.func.isRequired,
  onUnblock: PropTypes.func.isRequired,
};

ReviewDetailModal.defaultProps = {
  submission: null,
  busy: false,
};

export default ReviewDetailModal;
