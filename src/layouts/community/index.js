import { useEffect, useState } from "react";
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
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

import { useCommunityPosts } from "./hooks/useCommunityPosts";
import { POST_STATUS, STATUS_TABS, tagLabel } from "./constants";
import PostDetailModal from "./components/PostDetailModal";

const TABLE_COLUMNS = [
  { Header: "Member", accessor: "member", width: "20%" },
  { Header: "Post", accessor: "post", width: "38%" },
  { Header: "Where", accessor: "where", width: "12%" },
  { Header: "Reports", accessor: "reports", width: "18%" },
  { Header: "Actions", accessor: "actions", align: "right", width: "12%" },
];

const relativeTime = (value) => {
  const hours = Math.round((Date.now() - new Date(value).getTime()) / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} ${days === 1 ? "day" : "days"} ago`;
};

const excerpt = (text, max = 110) =>
  !text ? "" : text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;

function CommunityModeration() {
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
    counts,
    loading,
    error,
    moderate,
  } = useCommunityPosts();

  const [searchInput, setSearchInput] = useState("");
  const [selected, setSelected] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [modalBusy, setModalBusy] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => changeSearch(searchInput), 400);
    return () => clearTimeout(t);
  }, [searchInput, changeSearch]);

  const run = async (post, payload, { fromModal = false } = {}) => {
    if (fromModal) setModalBusy(true);
    else setBusyId(post.id);
    try {
      await moderate(post, payload);
      if (fromModal) setSelected(null);
    } catch (err) {
      alert(err.message || "Failed to update the post.");
    } finally {
      setBusyId("");
      setModalBusy(false);
    }
  };

  const keep = (post, note, opts) =>
    run(post, { status: POST_STATUS.PUBLISHED, dismissReports: true, note }, opts);
  const hide = (post, note, opts) => run(post, { status: POST_STATUS.HIDDEN, note }, opts);
  const restore = (post, note, opts) =>
    run(post, { status: POST_STATUS.PUBLISHED, dismissReports: true, note }, opts);

  const renderActions = (post) => {
    const busy = busyId === post.id;
    const iconBtn = (title, icon, onClick, color, testId) => (
      <Tooltip title={title} placement="top">
        <span>
          <IconButton
            size="small"
            disabled={busy}
            data-testid={testId}
            onClick={onClick}
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
        {iconBtn("View", "visibility", () => setSelected(post), "info", `view-${post.id}`)}
        {post.status === POST_STATUS.FLAGGED &&
          iconBtn("Keep (dismiss reports)", "check", () => keep(post), "success", `keep-${post.id}`)}
        {post.status !== POST_STATUS.HIDDEN &&
          iconBtn("Hide", "visibility_off", () => hide(post), "error", `hide-${post.id}`)}
        {post.status === POST_STATUS.HIDDEN &&
          iconBtn("Restore", "restart_alt", () => restore(post), "info", `restore-${post.id}`)}
      </SoftBox>
    );
  };

  const tableRows = rows.map((post) => ({
    member: (
      <SoftBox display="flex" alignItems="center" gap={1}>
        <SoftAvatar src={post.author?.avatarUrl} alt={post.author?.name} size="sm" />
        <SoftBox>
          <SoftTypography variant="button" fontWeight="medium" display="block">
            {post.author?.name}
          </SoftTypography>
          <SoftTypography variant="caption" color="secondary">
            {relativeTime(post.createdAt)}
          </SoftTypography>
        </SoftBox>
      </SoftBox>
    ),
    post: (
      <SoftBox display="flex" alignItems="center" gap={1.5} sx={{ width: "19rem" }}>
        {post.imageUrl && (
          <SoftBox
            component="img"
            src={post.imageUrl}
            alt=""
            width="3rem"
            height="3rem"
            borderRadius="md"
            sx={{ objectFit: "cover", flexShrink: 0 }}
          />
        )}
        <SoftTypography variant="caption" color="text" sx={{ whiteSpace: "normal" }}>
          {excerpt(post.text, 100)}
        </SoftTypography>
      </SoftBox>
    ),
    where: (
      <SoftBox>
        <SoftTypography variant="caption" fontWeight="medium" display="block">
          {post.cityName}
        </SoftTypography>
        <SoftTypography variant="caption" color="secondary">
          {tagLabel(post.tag)}
        </SoftTypography>
      </SoftBox>
    ),
    reports: post.reportCount ? (
      <Tooltip title={(post.reports || []).map((r) => `${r.reason} (${r.count})`).join(", ")}>
        <SoftBox display="flex" alignItems="center" gap={0.5}>
          <Icon fontSize="small" sx={{ color: "warning.main" }}>
            flag
          </Icon>
          <SoftTypography variant="caption" fontWeight="bold">
            {post.reportCount} · {post.reports?.[0]?.reason}
          </SoftTypography>
        </SoftBox>
      </Tooltip>
    ) : (
      <SoftTypography variant="caption" color="secondary">
        —
      </SoftTypography>
    ),
    actions: renderActions(post),
  }));

  const cityValue = filterOptions.cities.find((o) => o.value === filters.cityId) || null;
  const tagOptions = filterOptions.tags.map((t) => ({ value: t, label: tagLabel(t) }));
  const tagValue = tagOptions.find((o) => o.value === filters.tag) || null;

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3}>
          <SoftTypography variant="h4" fontWeight="bold">
            Community moderation
          </SoftTypography>
          <SoftTypography variant="body2" color="text">
            Posts from the app&apos;s Community tab. Review what members reported, keep good posts,
            hide anything that breaks the rules and restore posts hidden by mistake.
          </SoftTypography>
        </SoftBox>

        <Card>
          <SoftBox p={2}>
            <SoftBox display="flex" gap={1.5} flexWrap="wrap" alignItems="center" mb={2}>
              <SoftBox flex="1 1 240px" minWidth={200}>
                <SoftInput
                  placeholder="Search posts or members..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  icon={{ component: "search", direction: "left" }}
                />
              </SoftBox>
              <SoftBox flex="1 1 160px" minWidth={150}>
                <SoftSelect
                  placeholder="All cities"
                  isClearable
                  options={filterOptions.cities}
                  value={cityValue}
                  onChange={(opt) => changeFilter("cityId", opt?.value || "")}
                />
              </SoftBox>
              <SoftBox flex="1 1 160px" minWidth={150}>
                <SoftSelect
                  placeholder="All tags"
                  isClearable
                  options={tagOptions}
                  value={tagValue}
                  onChange={(opt) => changeFilter("tag", opt?.value || "")}
                />
              </SoftBox>
              {hasActiveFilters && (
                <SoftButton
                  size="small"
                  variant="outlined"
                  color="secondary"
                  startIcon={<Icon>close</Icon>}
                  onClick={() => {
                    setSearchInput("");
                    clearFilters();
                  }}
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
                    data-testid={`tab-${tab.value}`}
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
                {activeStatus === POST_STATUS.FLAGGED
                  ? "Nothing to review: no reported posts."
                  : "No posts in this tab."}
              </SoftTypography>
            ) : (
              <DataTable
                table={{ columns: TABLE_COLUMNS, rows: tableRows }}
                entriesPerPage={{ defaultValue: 10, entries: [10, 25, 50] }}
                canSearch={false}
                showTotalEntries
                isSorted={false}
                noEndBorder
              />
            )}
          </SoftBox>
        </Card>
      </SoftBox>

      <PostDetailModal
        open={!!selected}
        post={selected}
        busy={modalBusy}
        onClose={() => setSelected(null)}
        onKeep={(post, note) => keep(post, note, { fromModal: true })}
        onHide={(post, note) => hide(post, note, { fromModal: true })}
        onRestore={(post, note) => restore(post, note, { fromModal: true })}
      />
    </DashboardLayout>
  );
}

export default CommunityModeration;
