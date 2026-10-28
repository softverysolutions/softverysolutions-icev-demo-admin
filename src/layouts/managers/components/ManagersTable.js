import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import SoftBox from "components/SoftBox";
import DataTable from "examples/Tables/DataTable";
import RoleBadge from "./RoleBadge";
import StatusBadge from "./StatusBadge";
import ActionsMenu from "./ActionsMenu";
import { formatTableDate } from "../utils/formatDate";

function RoleCell({ value }) {
  return <RoleBadge role={value} />;
}
RoleCell.propTypes = { value: PropTypes.string.isRequired };

function StatusCell({ value }) {
  return <StatusBadge status={value} />;
}
StatusCell.propTypes = { value: PropTypes.string.isRequired };

function ActionsCell({ value, onChangeRole, onDeactivate, onActivate, disabled }) {
  return (
    <ActionsMenu
      row={value?.row}
      onChangeRole={onChangeRole}
      onDeactivate={onDeactivate}
      onActivate={onActivate}
      disabled={disabled}
    />
  );
}
ActionsCell.propTypes = {
  value: PropTypes.shape({ row: PropTypes.object }),
  onChangeRole: PropTypes.func,
  onDeactivate: PropTypes.func,
  onActivate: PropTypes.func,
  disabled: PropTypes.bool,
};

function ManagersTable({
  managers,
  loading,
  onChangeRole,
  onDeactivate,
  onActivate,
  showStaffActions = true,
  serverPagination,
  onPageChange,
  onPageSizeChange,
  itemsPerPage = 10,
}) {
  function ActionsCellWrapper({ value }) {
    return (
      <ActionsCell
        value={value}
        onChangeRole={onChangeRole}
        onDeactivate={onDeactivate}
        onActivate={onActivate}
        disabled={loading}
      />
    );
  }
  ActionsCellWrapper.propTypes = {
    value: PropTypes.shape({ row: PropTypes.object }),
  };

  const baseColumns = [
    { Header: "Name", accessor: "name", width: "18%", align: "left" },
    { Header: "Email", accessor: "email", width: "22%", align: "left" },
    {
      Header: "Role",
      accessor: "role",
      width: "14%",
      align: "left",
      Cell: RoleCell,
    },
    {
      Header: "Status",
      accessor: "status",
      width: "10%",
      align: "left",
      Cell: StatusCell,
    },
    {
      Header: "Created",
      accessor: "created",
      width: "12%",
      align: "center",
    },
    {
      Header: "Last Login",
      accessor: "lastLogin",
      width: "12%",
      align: "center",
    },
  ];

  const columns = showStaffActions
    ? [
        ...baseColumns,
        {
          Header: "Actions",
          accessor: "actions",
          width: "12%",
          align: "center",
          Cell: ActionsCellWrapper,
        },
      ]
    : baseColumns;

  const rows = (managers || []).map((m) => ({
    name: m.name || "—",
    email: m.email || "—",
    role: m.role,
    status: m.status,
    created: formatTableDate(m.createdAt),
    lastLogin: formatTableDate(m.lastLoginAt),
    actions: { row: m },
  }));

  return (
    <Card>
      <SoftBox p={3}>
        <DataTable
          table={{ columns, rows }}
          canSearch={false}
          showTotalEntries={true}
          entriesPerPage={{
            defaultValue: itemsPerPage,
            entries: [5, 10, 15, 20, 25],
          }}
          serverPagination={serverPagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          noEndBorder
          isLoading={loading}
        />
      </SoftBox>
    </Card>
  );
}

ManagersTable.propTypes = {
  managers: PropTypes.array.isRequired,
  loading: PropTypes.bool,
  onChangeRole: PropTypes.func,
  onDeactivate: PropTypes.func,
  onActivate: PropTypes.func,
  showStaffActions: PropTypes.bool,
  serverPagination: PropTypes.shape({
    currentPage: PropTypes.number,
    totalPages: PropTypes.number,
    totalItems: PropTypes.number,
    itemsPerPage: PropTypes.number,
  }),
  onPageChange: PropTypes.func,
  onPageSizeChange: PropTypes.func,
  itemsPerPage: PropTypes.number,
};

export default ManagersTable;
