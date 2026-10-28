import { useState, useMemo } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import Tooltip from "@mui/material/Tooltip";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import DataTable from "examples/Tables/DataTable";

function formatDateTime(isoString) {
  if (!isoString) return "—";
  try {
    const d = new Date(isoString);
    const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
    const time = d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    return `${date} ${time}`;
  } catch {
    return isoString;
  }
}

const ACTION_LABELS = {
  ORDER_EDITED: "Order edited",
  ORDER_CREATED: "Order created",
  ORDER_CANCELLED: "Order cancelled",
  PAYMENT_UPDATED: "Payment updated",
};

const FIELD_DISPLAY_NAMES = {
  birthDate: "Date of birth",
  nationality: "Nationality",
  fullName: "Full name",
  phoneNumber: "Phone number",
  skillLevel: "Skill level",
  gender: "Gender",
  courseId: "Programme",
  accommodationId: "Accommodation",
  totalPrice: "Total price",
  status: "Status",
  refundStatus: "Refund status",
  paymentStatus: "Payment status",
  priceDifferenceStatus: "Price difference status",
  duration: "Duration",
  startDate: "Start date",
  "emergencyContact.fullName": "Emergency contact full name",
  "emergencyContact.phoneNumber": "Emergency contact phone number",
  "emergencyContact.relationship": "Emergency contact relationship",
};

const VALUE_LABELS = {
  notHandled: "Not handled",
  notApplicable: "Not applicable",
  notStarted: "Not started",
  inProgress: "In progress",
  notRequired: "Not required",
};

function formatAction(action) {
  if (!action) return "—";
  return ACTION_LABELS[action] || action.replace(/([A-Z])/g, " $1").trim();
}

function getFieldDisplayName(field) {
  if (!field) return "";
  if (FIELD_DISPLAY_NAMES[field]) return FIELD_DISPLAY_NAMES[field];
  return field
    .split(".")
    .map((part) => part.replace(/([A-Z])/g, " $1").trim())
    .join(" ")
    .replace(/^\s*/, "")
    .replace(/\b\w/, (c) => c.toUpperCase());
}

function formatValue(val) {
  if (val === null || val === undefined) return "—";
  if (val === "") return "—";
  if (VALUE_LABELS[val] !== undefined) return VALUE_LABELS[val];
  if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}(T|$)/.test(val)) {
    try {
      const d = new Date(val);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
      }
    } catch {}
  }
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}

function formatOneChange(entry) {
  if (!entry || typeof entry !== "object") return "";
  const entity = (entry.entity || "").toLowerCase();
  const entityLabel = entity ? entity.charAt(0).toUpperCase() + entity.slice(1) : "";
  const field = entry.field;
  const changeType = entry.changeType;
  const fieldLabel = field ? getFieldDisplayName(field) : "";
  const newVal = formatValue(entry.newValue);

  if (changeType === "ADDED" && entity === "extra") {
    return `${entityLabel}: service added`;
  }
  if (changeType === "ADDED") {
    return fieldLabel ? `${entityLabel}: ${fieldLabel} — ${newVal}` : `${entityLabel}: ${newVal}`;
  }
  if (changeType === "REMOVED") {
    return fieldLabel ? `${entityLabel}: ${fieldLabel} — removed` : `${entityLabel} removed`;
  }
  if (changeType === "UPDATED" && fieldLabel) {
    return `${entityLabel}: ${fieldLabel} — ${newVal}`;
  }
  if (fieldLabel) {
    return `${entityLabel}: ${fieldLabel}`;
  }
  return entityLabel || "—";
}

function getChangeItems(changes) {
  if (!changes || (Array.isArray(changes) && changes.length === 0)) return [];
  if (!Array.isArray(changes)) return [];
  return changes.map(formatOneChange).filter(Boolean);
}

const FEW_ITEMS_THRESHOLD = 3;
const ACCORDION_DURATION = 350;
const CHANGE_LINE_SX = {
  fontSize: "0.9rem",
  lineHeight: 1.5,
  display: "block",
  marginBottom: "4px",
};

function WhichFieldsCell({ value }) {
  const items = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState(false);
  const hasMany = items.length > FEW_ITEMS_THRESHOLD;
  const previewItems = items.slice(0, FEW_ITEMS_THRESHOLD);
  const restItems = items.slice(FEW_ITEMS_THRESHOLD);

  if (items.length === 0) return <span>—</span>;

  const renderLines = (list) =>
    list.map((item, i) => (
      <SoftTypography key={i} component="span" sx={CHANGE_LINE_SX}>
        {item}
      </SoftTypography>
    ));

  if (!hasMany) {
    return (
      <SoftBox sx={{ display: "flex", flexDirection: "column" }}>
        {renderLines(items)}
      </SoftBox>
    );
  }

  return (
    <SoftBox sx={{ width: "100%", display: "flex", flexDirection: "column", overflow: "visible" }}>
      <SoftBox
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          width: "100%",
          minHeight: "28px",
        }}
      >
        <IconButton
          size="small"
          onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
          sx={{ p: 0.25 }}
          aria-label={open ? "Collapse" : "Expand"}
        >
          <Icon sx={{ fontSize: "1.1rem" }}>{open ? "expand_less" : "expand_more"}</Icon>
        </IconButton>
      </SoftBox>
      <SoftBox sx={{ display: "flex", flexDirection: "column" }}>
        {renderLines(previewItems)}
      </SoftBox>
      <Collapse in={open} timeout={ACCORDION_DURATION} unmountOnExit={false}>
        <SoftBox sx={{ display: "flex", flexDirection: "column" }}>
          {renderLines(restItems)}
        </SoftBox>
      </Collapse>
    </SoftBox>
  );
}

WhichFieldsCell.propTypes = {
  value: PropTypes.arrayOf(PropTypes.string),
};

function ChangedByCell({ value }) {
  const displayName = value && typeof value === "object" ? value.displayName : null;
  const rawId = value && typeof value === "object" ? value.adminId : "";
  const display = displayName || "";
  if (!display && !rawId) return <span>—</span>;
  if (display) return <SoftTypography variant="caption">{display}</SoftTypography>;
  const id = rawId || "";
  const truncated = id.length > 12 ? `${id.slice(0, 8)}…` : id;
  return (
    <Tooltip title={id} placement="top">
      <SoftTypography variant="caption" sx={{ cursor: "default" }}>
        {truncated}
      </SoftTypography>
    </Tooltip>
  );
}

ChangedByCell.propTypes = {
  value: PropTypes.shape({
    displayName: PropTypes.string,
    adminId: PropTypes.string,
  }),
};

function ChangedByCellWrapper({ value }) {
  return <ChangedByCell value={value} />;
}
ChangedByCellWrapper.propTypes = {
  value: PropTypes.shape({
    displayName: PropTypes.string,
    adminId: PropTypes.string,
  }),
};

function WhichFieldsCellWrapper({ value }) {
  return <WhichFieldsCell value={value} />;
}
WhichFieldsCellWrapper.propTypes = {
  value: PropTypes.arrayOf(PropTypes.string),
};

function AuditLogsSection({ auditLogs = [], adminDisplayNames = {} }) {
  const tableData = useMemo(() => {
    const sorted = [...(auditLogs || [])].sort(
      (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
    );
    return {
      columns: [
        { Header: "Changed At", accessor: "changedAt", width: "18%", align: "left" },
        {
          Header: "Changed By",
          accessor: "changedBy",
          width: "22%",
          align: "left",
          Cell: ChangedByCellWrapper,
        },
        { Header: "Action", accessor: "action", width: "14%", align: "left" },
        {
          Header: "Changes",
          accessor: "changesItems",
          width: "46%",
          align: "left",
          fullWidth: true,
          Cell: WhichFieldsCellWrapper,
        },
      ],
      rows: sorted.map((log) => ({
        changedAt: formatDateTime(log.createdAt),
        changedBy: {
          displayName: adminDisplayNames[log.adminId] || null,
          adminId: log.adminId || "",
        },
        action: formatAction(log.action),
        changesItems: getChangeItems(log.changes),
      })),
    };
  }, [auditLogs, adminDisplayNames]);


  return (
    <Card sx={{ overflow: "visible" }}>
      <SoftBox p={3}>
        <SoftTypography variant="h6" fontWeight="medium" mb={2}>
          Audit logs
        </SoftTypography>
        <DataTable
          table={tableData}
          showTotalEntries={false}
          canSearch={false}
          noEndBorder
          isSorted={false}
          entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20] }}
          containerSx={{ overflow: "visible" }}
        />
      </SoftBox>
    </Card>
  );
}

AuditLogsSection.propTypes = {
  auditLogs: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      travelId: PropTypes.string,
      adminId: PropTypes.string,
      action: PropTypes.string,
      changes: PropTypes.oneOfType([PropTypes.array, PropTypes.object]),
      createdAt: PropTypes.string,
    })
  ),
  adminDisplayNames: PropTypes.object,
};

export default AuditLogsSection;
