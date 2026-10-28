/* eslint-disable react/prop-types -- react-table Cell renderers */
import Stack from "@mui/material/Stack";
import Icon from "@mui/material/Icon";
import Box from "@mui/material/Box";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import TruncatedText from "components/TruncatedText";

import PromoActionsCell from "./PromoActionsCell";
import StatusBadge from "./components/StatusBadge";
import { TEXT_PRIMARY } from "./constants";
import { formatPeriod } from "./utils/formatPeriod";

function formatCreatedByName(user) {
  if (!user) return "—";
  const parts = [user.firstName, user.lastName].filter(Boolean);
  if (parts.length) return parts.join(" ");
  return user.email || "—";
}

function formatShortDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

export function createPromoTableColumns() {
  return [
    {
      Header: "Code",
      accessor: "code",
      width: "18%",
      disableSortBy: true,
      Cell: ({ value: row }) => (
        <SoftBox>
          <TruncatedText
            text={row.code}
            maxLength={24}
            variant="body2"
            fontWeight="bold"
            sx={{ color: TEXT_PRIMARY }}
            display="block"
          />
          {row.description ? (
            <TruncatedText
              text={row.description}
              maxLength={40}
              variant="caption"
              color="secondary"
              display="block"
            />
          ) : (
            <SoftTypography variant="caption" color="secondary" display="block">
              —
            </SoftTypography>
          )}
        </SoftBox>
      ),
    },
    {
      Header: "Discount",
      accessor: "discount",
      width: "10%",
      disableSortBy: true,
      Cell: ({ value }) => (
        <SoftTypography variant="body2" sx={{ color: TEXT_PRIMARY }}>
          {value}
        </SoftTypography>
      ),
    },
    {
      Header: "Scope",
      accessor: "scope",
      width: "12%",
      disableSortBy: true,
      Cell: ({ value }) => (
        <SoftTypography variant="body2" sx={{ color: TEXT_PRIMARY }}>
          {value}
        </SoftTypography>
      ),
    },
    {
      Header: "Eligibility",
      accessor: "eligibility",
      width: "14%",
      disableSortBy: true,
      Cell: ({ value: row }) => {
        const assignedUserId = row.assignedUserId ?? row.assigned_user_id;
        const assignedUserEmail = row.assignedUserEmail ?? row.assigned_user_email;
        const isUser = Boolean(
          (assignedUserId != null && assignedUserId !== "") ||
            (assignedUserEmail != null && assignedUserEmail !== "")
        );
        return (
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Icon sx={{ fontSize: "1rem", color: "text.secondary" }}>
              {isUser ? "person" : "public"}
            </Icon>
            <SoftTypography variant="body2" sx={{ color: TEXT_PRIMARY }}>
              {isUser ? (
                <TruncatedText text={assignedUserEmail || "User-specific"} maxLength={28} />
              ) : (
                "Global"
              )}
            </SoftTypography>
          </Stack>
        );
      },
    },
    {
      Header: "Usage",
      accessor: "usage",
      width: "12%",
      disableSortBy: true,
      Cell: ({ value: u }) => {
        const pct =
          typeof u?.pct === "number" && Number.isFinite(u.pct)
            ? Math.min(100, Math.max(0, u.pct))
            : 0;
        return (
          <SoftBox minWidth={72}>
            <SoftTypography
              variant="body2"
              fontWeight="medium"
              sx={{ color: TEXT_PRIMARY }}
              display="block"
            >
              {u.total != null ? `${u.used} / ${u.total}` : `${u.used} / ∞`}
            </SoftTypography>
            <Box
              sx={{
                mt: 0.5,
                height: 6,
                borderRadius: 1,
                bgcolor: "grey.200",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  width: `${pct}%`,
                  maxWidth: "100%",
                  borderRadius: 1,
                  bgcolor: "info.main",
                  transition: "width 0.35s ease",
                }}
              />
            </Box>
          </SoftBox>
        );
      },
    },
    {
      Header: "Period",
      accessor: "period",
      width: "14%",
      disableSortBy: true,
      Cell: ({ value: p }) => (
        <SoftTypography variant="body2" sx={{ color: TEXT_PRIMARY }}>
          {formatPeriod(p.start, p.end)}
        </SoftTypography>
      ),
    },
    {
      Header: "Created By",
      accessor: "created",
      width: "12%",
      disableSortBy: true,
      Cell: ({ value: row }) => (
        <SoftBox>
          <SoftTypography variant="body2" sx={{ color: TEXT_PRIMARY }} display="block">
            {formatCreatedByName(row.createdBy)}
          </SoftTypography>
          <SoftTypography variant="caption" color="secondary">
            {formatShortDate(row.createdAt)}
          </SoftTypography>
        </SoftBox>
      ),
    },
    {
      Header: "Status",
      accessor: "status",
      width: "8%",
      disableSortBy: true,
      Cell: ({ value }) => <StatusBadge status={value} />,
    },
    {
      Header: "Actions",
      accessor: "actions",
      width: "12%",
      align: "center",
      disableSortBy: true,
      Cell: PromoActionsCell,
    },
  ];
}
