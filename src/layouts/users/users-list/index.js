import { useState, useEffect, useMemo } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import ComplexStatisticsCard from "examples/Cards/StatisticsCards/ComplexStatisticsCard";
import DataTable from "examples/Tables/DataTable";

import { ActionsCell } from "./utils/components";
import { UserService } from "services/userService";

function UsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [globalSearchFilter, setGlobalSearchFilter] = useState("");
  const [searchInputValue, setSearchInputValue] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const fetchUsers = async (page = 1, limit = 10, search = "") => {
    try {
      setLoading(true);
      setError(null);
      const response = await UserService.searchUsers({
        page,
        limit,
        search,
      });
      const activeUsers = (response.data || []).filter((user) => {
        if (user.deletedAt) return false;
        const hasName =
          user.fullName ||
          (user.firstName && user.firstName.trim()) ||
          (user.lastName && user.lastName.trim());
        return hasName;
      });
      setUsers(activeUsers);
      setPagination({
        currentPage: response.meta?.currentPage || page,
        totalPages: response.meta?.totalPages || 1,
        totalItems: response.meta?.totalItems || activeUsers.length,
        hasNextPage: response.meta?.hasNextPage || false,
        hasPreviousPage: response.meta?.hasPreviousPage || false,
      });
    } catch (err) {
      console.error("Error fetching users:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(currentPage, itemsPerPage, globalSearchFilter);
  }, [currentPage, itemsPerPage, globalSearchFilter]);

  const handleSearchInputChange = (value) => {
    setSearchInputValue(value);
  };

  const handleSearchSubmit = () => {
    setCurrentPage(1);
    setGlobalSearchFilter(searchInputValue);
  };

  const handleSearchBlur = () => {
    if (searchInputValue.trim() !== "") {
      handleSearchSubmit();
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      handleSearchSubmit();
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleEntriesPerPageChange = (newEntriesPerPage) => {
    setItemsPerPage(newEntriesPerPage);
    setCurrentPage(1);
  };

  const ActionsCellWrapper = ({ value }) => {
    const formattedRow = UserService.formatUserForTable(value.row);
    return <ActionsCell row={formattedRow} />;
  };

  ActionsCellWrapper.propTypes = {
    value: PropTypes.shape({
      row: PropTypes.object.isRequired,
    }).isRequired,
  };

  const customDataTableData = useMemo(
    () => ({
      columns: [
        { Header: "Name", accessor: "name", width: "20%" },
        { Header: "Email", accessor: "email", width: "25%" },
        { Header: "Registration Date", accessor: "registration date", width: "15%" },
        { Header: "Last Activity", accessor: "last activity", width: "15%" },
        { Header: "Orders", accessor: "travels purchased", width: "15%" },
        {
          Header: "Actions",
          accessor: "actions",
          width: "10%",
          Cell: ActionsCellWrapper,
        },
      ],
      rows: users.map((user) => ({
        ...UserService.formatUserForTable(user),
        actions: {
          row: user,
        },
      })),
    }),
    [users]
  );

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <ComplexStatisticsCard
                    icon="account_circle"
                    count={{ number: pagination.totalItems, label: "customers" }}
                    percentage="—"
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </SoftBox>

        <Card>
          <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" p={3}>
            <SoftBox lineHeight={1}>
              <SoftTypography variant="h5" fontWeight="medium">
                Customers
              </SoftTypography>
            </SoftBox>
          </SoftBox>
          {loading ? (
            <SoftBox display="flex" justifyContent="center" alignItems="center" p={4}>
              <SoftTypography variant="body2" color="text">
                Loading customers...
              </SoftTypography>
            </SoftBox>
          ) : error ? (
            <SoftBox display="flex" justifyContent="center" alignItems="center" p={4}>
              <SoftTypography variant="body2" color="error">
                Error loading customers: {error}
              </SoftTypography>
            </SoftBox>
          ) : (
            <>
              <SoftBox
                display="flex"
                gap={2}
                alignItems="center"
                sx={{
                  marginBottom: "46px",
                  paddingLeft: "20px",
                  paddingRight: "20px",
                }}
              >
                <SoftBox flex={1}>
                  <SoftInput
                    placeholder="Search by name or email"
                    value={searchInputValue}
                    onChange={({ currentTarget }) => {
                      handleSearchInputChange(currentTarget.value);
                    }}
                    onBlur={handleSearchBlur}
                    onKeyDown={handleSearchKeyDown}
                    icon={{
                      component: <Icon>search</Icon>,
                      direction: "left",
                    }}
                  />
                </SoftBox>
                <SoftButton
                  variant="gradient"
                  color="info"
                  onClick={handleSearchSubmit}
                  startIcon={<Icon>search</Icon>}
                >
                  Search
                </SoftButton>
              </SoftBox>
              <DataTable
                table={customDataTableData}
                entriesPerPage={{
                  defaultValue: itemsPerPage,
                  entries: [5, 10, 15, 20, 25, 50, 100],
                }}
                serverPagination={{
                  currentPage: pagination.currentPage,
                  totalPages: pagination.totalPages,
                  totalItems: pagination.totalItems,
                  itemsPerPage: itemsPerPage,
                }}
                onPageChange={handlePageChange}
                onPageSizeChange={handleEntriesPerPageChange}
              />
            </>
          )}
        </Card>
      </SoftBox>
    </DashboardLayout>
  );
}

export default UsersList;
