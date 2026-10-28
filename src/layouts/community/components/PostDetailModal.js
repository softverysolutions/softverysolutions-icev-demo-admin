import { useEffect, useState } from "react";
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
import SoftInput from "components/SoftInput";
import PostStatusBadge from "./PostStatusBadge";
import { POST_STATUS, tagLabel } from "../constants";

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
};

function PostDetailModal({ open, post, busy, onClose, onKeep, onHide, onRestore }) {
  const [note, setNote] = useState("");

  useEffect(() => {
    if (open) setNote(post?.moderationNote || "");
  }, [open, post]);

  if (!post) return null;
  const reports = post.reports || [];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <SoftBox p={3} pb={1} display="flex" alignItems="flex-start" justifyContent="space-between">
        <SoftBox display="flex" alignItems="center" gap={1.5}>
          <SoftAvatar src={post.author?.avatarUrl} alt={post.author?.name} size="md" />
          <SoftBox>
            <SoftBox display="flex" alignItems="center" gap={1}>
              <SoftTypography variant="h6" fontWeight="bold">
                {post.author?.name}
              </SoftTypography>
              <PostStatusBadge status={post.status} />
            </SoftBox>
            <SoftTypography variant="caption" color="text">
              {post.cityName} · {tagLabel(post.tag)} · {formatDateTime(post.createdAt)}
            </SoftTypography>
          </SoftBox>
        </SoftBox>
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <Icon>close</Icon>
        </IconButton>
      </SoftBox>

      <DialogContent sx={{ px: 3 }}>
        {reports.length > 0 && (
          <SoftBox mb={2} p={1.5} sx={{ backgroundColor: "#FFF6E5", borderRadius: 1.5 }}>
            <SoftTypography variant="button" fontWeight="bold" display="flex" alignItems="center" gap={0.5}>
              <Icon fontSize="small" sx={{ color: "warning.main" }}>
                flag
              </Icon>
              Reported by members
            </SoftTypography>
            {reports.map((r) => (
              <SoftTypography key={r.reason} variant="caption" color="text" display="block">
                {r.reason} · {r.count} {r.count === 1 ? "report" : "reports"}
              </SoftTypography>
            ))}
          </SoftBox>
        )}

        <SoftTypography variant="body2" color="dark" sx={{ whiteSpace: "pre-line" }}>
          {post.text}
        </SoftTypography>
        {post.imageUrl && (
          <SoftBox
            component="img"
            src={post.imageUrl}
            alt=""
            mt={2}
            width="100%"
            borderRadius="lg"
            sx={{ maxHeight: 280, objectFit: "cover" }}
          />
        )}
        <SoftBox display="flex" gap={2} mt={1.5}>
          <SoftTypography variant="caption" color="text" display="flex" alignItems="center" gap={0.5}>
            <Icon fontSize="inherit">favorite</Icon> {post.likes} likes
          </SoftTypography>
          <SoftTypography variant="caption" color="text" display="flex" alignItems="center" gap={0.5}>
            <Icon fontSize="inherit">chat_bubble</Icon> {post.comments?.length || 0} comments
          </SoftTypography>
        </SoftBox>

        {post.comments?.length > 0 && (
          <>
            <Divider />
            {post.comments.map((c) => (
              <SoftBox key={c.id} display="flex" gap={1} mb={1.25}>
                <SoftAvatar src={c.author?.avatarUrl} alt={c.author?.name} size="xs" />
                <SoftBox>
                  <SoftTypography variant="caption" fontWeight="bold" display="block">
                    {c.author?.name}
                  </SoftTypography>
                  <SoftTypography variant="caption" color="text">
                    {c.text}
                  </SoftTypography>
                </SoftBox>
              </SoftBox>
            ))}
          </>
        )}

        <Divider />
        <SoftTypography variant="caption" fontWeight="bold" display="block" mb={0.5}>
          Moderation note (internal)
        </SoftTypography>
        <SoftInput
          multiline
          rows={2}
          value={note}
          placeholder="Why was this post hidden or kept?"
          onChange={(e) => setNote(e.target.value)}
        />
        {post.moderatedAt && (
          <SoftTypography variant="caption" color="secondary" display="block" mt={0.5}>
            Last moderated {formatDateTime(post.moderatedAt)}
            {post.moderatedBy ? ` by ${post.moderatedBy}` : ""}
          </SoftTypography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        {busy && <CircularProgress size={18} color="info" />}
        {post.status === POST_STATUS.FLAGGED && (
          <SoftButton variant="outlined" color="dark" disabled={busy} onClick={() => onKeep(post, note)}>
            Keep post
          </SoftButton>
        )}
        {post.status !== POST_STATUS.HIDDEN && (
          <SoftButton variant="gradient" color="error" disabled={busy} onClick={() => onHide(post, note)}>
            Hide post
          </SoftButton>
        )}
        {post.status === POST_STATUS.HIDDEN && (
          <SoftButton variant="gradient" color="info" disabled={busy} onClick={() => onRestore(post, note)}>
            Restore post
          </SoftButton>
        )}
      </DialogActions>
    </Dialog>
  );
}

PostDetailModal.propTypes = {
  open: PropTypes.bool.isRequired,
  post: PropTypes.object,
  busy: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onKeep: PropTypes.func.isRequired,
  onHide: PropTypes.func.isRequired,
  onRestore: PropTypes.func.isRequired,
};

PostDetailModal.defaultProps = { post: null, busy: false };

export default PostDetailModal;
