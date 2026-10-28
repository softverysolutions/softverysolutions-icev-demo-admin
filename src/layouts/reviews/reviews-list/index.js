import { useEffect, useRef, useState } from "react";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SoftBadge from "components/SoftBadge";
import SoftSelect from "components/SoftSelect";
import SoftAvatar from "components/SoftAvatar";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

import { useReviews } from "../hooks/useReviews";
import { STATUS_TABS, REVIEW_STATUS } from "../constants";
import StarRating from "../components/StarRating";
import StatusBadge from "../components/StatusBadge";
import ReviewDetailModal from "../components/ReviewDetailModal";

const TABLE_COLUMNS = [
  { Header: "Submitted", accessor: "submitted", width: "11%" },
  { Header: "Participant", accessor: "user", width: "18%" },
  { Header: "Programme", accessor: "entity", width: "22%" },
  { Header: "Review", accessor: "comment", width: "25%" },
  { Header: "Rating", accessor: "rating", width: "10%" },
  { Header: "Status", accessor: "status", width: "7%" },
  { Header: "Actions", accessor: "actions", align: "right", width: "7%" },
];

const excerpt = (text, max = 90) =>
  !text ? "—" : text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const displayLabel = (value) => {
  const s = value == null ? "" : String(value).trim();
  if (!s) return "";
  return UUID_RE.test(s) ? `${s.slice(0, 8)}…` : s;
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

function ReviewsList() {
  const {
    activeStatus,
    changeStatusTab,
    changeSearch,
    filters,
    changeFilter,
    clearFilters,
    hasActiveFilters,
    filterOptions,
    rows,
    hasMore,
    loadMore,
    counts,
    loading,
    error,
    applyStatus,
    unblock,
  } = useReviews();

  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [busyId, setBusyId] = useState("");
  const [modalBusy, setModalBusy] = useState(false);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => changeSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput, changeSearch]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore || loading) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadMore, rows.length]);

  const openModal = (row) => {
    setSelected(row);
    setModalOpen(true);
  };

  const runAction = async (row, status, { fromModal = false } = {}) => {
    if (fromModal) setModalBusy(true);
    else setBusyId(row.id);
    try {
      await applyStatus(row, status);
      if (fromModal) setModalOpen(false);
    } catch (err) {
      alert(err.message || "Failed to update review.");
    } finally {
      setBusyId("");
      setModalBusy(false);
    }
  };

  const restoreStatus = (row) =>
    row.status === REVIEW_STATUS.HIDDEN ? REVIEW_STATUS.APPROVED : REVIEW_STATUS.PENDING;

  const handleUnblock = async (row) => {
    if (!window.confirm(`Let ${row.userName} submit a new review for order ${row.orderNumber}?`)) return;
    setModalBusy(true);
    try {
      await unblock(row.travelId);
      alert("Done: the participant can submit a new review.");
    } catch (err) {
      alert(err.message || "Failed to unblock review.");
    } finally {
      setModalBusy(false);
    }
  };

  const campusValue = filterOptions.campuses.find((o) => o.value === filters.campusId) || null;
  const courseValue = filterOptions.courses.find((o) => o.value === filters.courseId) || null;

  const handleClearAll = () => {
    setSearchInput("");
    clearFilters();
  };

  const renderActions = (row) => {
    const busy = busyId === row.id;
    const iconBtn = (title, icon, onClick, color) => (
      <Tooltip title={title} placement="top">
        <span>
          <IconButton
            size="small"
            disabled={busy}
            onClick={() => onClick(row)}
            sx={{ color: `${color}.main` }}
          >
            <Icon fontSize="small">{icon}</Icon>
          </IconButton>
        </span>
      </Tooltip>
    );
    return (
      <SoftBox display="flex" alignItems="center" justifyContent="flex-end" gap={0.25}>
        {busy && <CircularProgress size={14} color="info" />}
        {iconBtn("View", "visibility", openModal, "info")}
        {row.status === REVIEW_STATUS.PENDING && (
          <>
            {iconBtn("Approve", "check", (r) => runAction(r, REVIEW_STATUS.APPROVED), "success")}
            {iconBtn("Decline", "close", (r) => runAction(r, REVIEW_STATUS.DECLINED), "error")}
          </>
        )}
        {row.status === REVIEW_STATUS.APPROVED &&
          iconBtn("Hide", "visibility_off", (r) => runAction(r, REVIEW_STATUS.HIDDEN), "warning")}
        {(row.status === REVIEW_STATUS.DECLINED || row.status === REVIEW_STATUS.HIDDEN) &&
          iconBtn("Restore", "restart_alt", (r) => runAction(r, restoreStatus(r)), "info")}
      </SoftBox>
    );
  };

  const tableRows = rows.map((row) => {
    return {
      submitted: (
        <SoftTypography variant="caption" color="text" fontWeight="medium">
          {formatDate(row.submittedAt)}
        </SoftTypography>
      ),
      user: (
        <SoftBox display="flex" alignItems="center" gap={1}>
          {row.avatarUrl && <SoftAvatar src={row.avatarUrl} alt={row.userName} size="sm" />}
          <SoftBox>
            <SoftTypography variant="button" fontWeight="medium" display="block">
              {row.userName}
            </SoftTypography>
            {row.orderNumber && (
              <SoftTypography variant="caption" color="secondary">
                Order {row.orderNumber}
              </SoftTypography>
            )}
          </SoftBox>
        </SoftBox>
      ),
      entity: (
        <SoftBox>
          <SoftTypography variant="button" fontWeight="medium" display="block">
            {displayLabel(row.courseName) || "—"}
          </SoftTypography>
          <SoftTypography variant="caption" color="secondary">
            {[row.schoolName, row.cityName].filter(Boolean).join(" · ")}
          </SoftTypography>
        </SoftBox>
      ),
      comment: (
        <SoftBox sx={{ width: "18rem", whiteSpace: "normal" }}>
          <SoftTypography variant="caption" color="text">
            {excerpt(row.comment)}
          </SoftTypography>
        </SoftBox>
      ),
      rating: <StarRating value={row.rating} showValue />,
      status: <StatusBadge status={row.status} />,
      actions: renderActions(row),
    };
  });

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3}>
          <SoftTypography variant="h4" fontWeight="bold">
            Reviews
          </SoftTypography>
          <SoftTypography variant="body2" color="text">
            Moderate participant reviews before they appear in the app: approve, decline, hide or
            restore. Ratings cover instructors, curriculum, facilities, equipment and organisation.
          </SoftTypography>
        </SoftBox>

        <Card>
          <SoftBox p={2}>
            {/* Filters */}
            <SoftBox display="flex" gap={1.5} flexWrap="wrap" alignItems="center" mb={2}>
              <SoftBox flex="1 1 240px" minWidth={200}>
                <SoftInput
                  placeholder="Search reviews, programmes, participants..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  icon={{ component: "search", direction: "left" }}
                />
              </SoftBox>
              <SoftBox flex="1 1 160px" minWidth={150}>
                <SoftSelect
                  placeholder="All locations"
                  isClearable
                  options={filterOptions.campuses}
                  value={campusValue}
                  onChange={(opt) => changeFilter("campusId", opt?.value || "")}
                />
              </SoftBox>
              <SoftBox flex="1 1 160px" minWidth={150}>
                <SoftSelect
                  placeholder="All programmes"
                  isClearable
                  options={filterOptions.courses}
                  value={courseValue}
                  onChange={(opt) => changeFilter("courseId", opt?.value || "")}
                />
              </SoftBox>
              <FormControlLabel
                sx={{ m: 0 }}
                control={
                  <Checkbox
                    checked={filters.fixedPackageOnly}
                    onChange={(e) => changeFilter("fixedPackageOnly", e.target.checked)}
                  />
                }
                label={
                  <SoftTypography variant="caption" color="text">
                    Packages only
                  </SoftTypography>
                }
              />
              {hasActiveFilters && (
                <SoftButton
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={<Icon>close</Icon>}
                  onClick={handleClearAll}
                >
                  Clear
                </SoftButton>
              )}
            </SoftBox>

            <SoftBox display="flex" gap={1} flexWrap="wrap" mb={1}>
              {STATUS_TABS.map((tab) => {
                const active = tab.value === activeStatus;
                return (
                  <SoftButton
                    key={tab.value}
                    size="small"
                    color={active ? "info" : "secondary"}
                    variant={active ? "gradient" : "outlined"}
                    onClick={() => changeStatusTab(tab.value)}
                  >
                    {tab.label}
                    {typeof counts[tab.value] === "number" && (
                      <SoftBadge
                        badgeContent={counts[tab.value]}
                        color={active ? "light" : "secondary"}
                        size="xs"
                        container
                        sx={{ ml: 1 }}
                      />
                    )}
                  </SoftButton>
                );
              })}
            </SoftBox>

            {/* Table */}
            {loading ? (
              <SoftBox display="flex" justifyContent="center" py={6}>
                <CircularProgress color="info" />
              </SoftBox>
            ) : error ? (
              <SoftTypography variant="body2" color="error" textAlign="center" py={4}>
                {error}
              </SoftTypography>
            ) : rows.length === 0 ? (
              <SoftTypography variant="body2" color="text" textAlign="center" py={4}>
                No reviews in this tab.
              </SoftTypography>
            ) : (
              <>
                <DataTable
                  table={{ columns: TABLE_COLUMNS, rows: tableRows }}
                  entriesPerPage={false}
                  canSearch={false}
                  showTotalEntries={false}
                  isSorted={false}
                  noEndBorder
                />
                <SoftBox
                  ref={sentinelRef}
                  display="flex"
                  justifyContent="center"
                  py={hasMore ? 2 : 0}
                >
                  {hasMore && <CircularProgress size={22} color="info" />}
                </SoftBox>
              </>
            )}
          </SoftBox>
        </Card>
      </SoftBox>

      <ReviewDetailModal
        open={modalOpen}
        submission={selected}
        busy={modalBusy}
        onClose={() => setModalOpen(false)}
        onApprove={(row) => runAction(row, REVIEW_STATUS.APPROVED, { fromModal: true })}
        onDecline={(row) => runAction(row, REVIEW_STATUS.DECLINED, { fromModal: true })}
        onUnblock={handleUnblock}
      />
    </DashboardLayout>
  );
}

export default ReviewsList;
