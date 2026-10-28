import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Pagination from "@mui/material/Pagination";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Chip from "@mui/material/Chip";
import { styled } from "@mui/material/styles";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftSelect from "components/SoftSelect";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

import { TravelService } from "services/travelService";
import { TRAVEL_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "./utils/statuses";
import { buildDataTableData } from "./utils/dataTableUtils";

const StyledPagination = styled(Pagination)(({ theme }) => ({
  "& .MuiPaginationItem-root": {
    margin: "0 4px",
    minWidth: "32px",
    height: "32px",
    borderRadius: "50%",
  },
  "& .MuiPaginationItem-page.Mui-selected": {
    backgroundColor: "#fafcff",
    color: "#000000",
    "&:hover": {
      backgroundColor: "#fafcff",
    },
    border: "1px solid #6D4AFF",
  },
}));

function OrdersList() {
  const navigate = useNavigate();
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [travelStatusFilter, setTravelStatusFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [searchTimeout, setSearchTimeout] = useState(null);

  const fetchTravels = useCallback(
    async (page = 1, limit = pagination.limit) => {
      try {
        setLoading(true);

        const filter = {};

        if (travelStatusFilter) {
          filter.status = [travelStatusFilter];
        }

        if (paymentStatusFilter) {
          filter.currentPaymentStatus = [paymentStatusFilter];
        }

        const response = await TravelService.searchTravels({
          search: searchQuery.trim() || undefined,
          page,
          limit,
          sortBy: "createdAt",
          sortDirection: "desc",
          filter: Object.keys(filter).length > 0 ? filter : undefined,
        });

        const travelsData = response.data || [];

        setTravels(travelsData);

        setPagination({
          page: response.meta?.currentPage || 1,
          limit: response.meta?.itemsPerPage || limit,
          totalItems: response.meta?.totalItems || 0,
          totalPages: response.meta?.totalPages || 0,
        });
      } catch (error) {
        console.error("Error fetching travels:", error);
        setTravels([]);
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit, searchQuery, travelStatusFilter, paymentStatusFilter]
  );

  useEffect(() => {
    fetchTravels();
  }, []);

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    const timeout = setTimeout(() => {
      fetchTravels(1);
    }, 500);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [searchQuery, travelStatusFilter, paymentStatusFilter, fetchTravels]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleTravelStatusChange = (option) => {
    setTravelStatusFilter(option?.value || "");
  };

  const handlePaymentStatusChange = (option) => {
    setPaymentStatusFilter(option?.value || "");
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setTravelStatusFilter("");
    setPaymentStatusFilter("");
  };

  const hasActiveFilters = searchQuery || travelStatusFilter || paymentStatusFilter;

  const handlePageChange = (event, newPage) => {
    fetchTravels(newPage);
  };

  const handleEntriesPerPageChange = ({ value }) => {
    const newLimit = value;
    setPagination((prev) => ({ ...prev, limit: newLimit }));
    fetchTravels(1, newLimit);
  };

  const handleViewOrder = (row) => {
    navigate(`/orders/view/${row.id}`);
  };

  const customDataTableData = buildDataTableData(travels, handleViewOrder);

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox my={3}>
        <Card>
          <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" p={3}>
            <SoftBox lineHeight={1}>
              <SoftTypography variant="h5" fontWeight="medium">
                Orders
              </SoftTypography>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                Bookings made in the Softvery Demo app. Filter by status or payment, open an order to manage it.
              </SoftTypography>
            </SoftBox>
          </SoftBox>


          <SoftBox px={3} pb={2}>
            <SoftBox
              display="grid"
              gridTemplateColumns={{ xs: "1fr", md: "1fr 1fr 1fr auto" }}
              gap={2}
              alignItems="stretch"
              sx={{ mb: 2 }}
            >
              <TextField
                placeholder="Search by customer, email or programme"
                value={searchQuery}
                onChange={handleSearchChange}
                fullWidth
                sx={{
                  "& .MuiOutlinedInput-root": {
                    height: 44,
                    borderRadius: "8px",
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Icon>search</Icon>
                    </InputAdornment>
                  ),
                }}
              />

              <SoftBox>
                <SoftSelect
                  placeholder="Order status"
                  options={TRAVEL_STATUS_OPTIONS}
                  value={TRAVEL_STATUS_OPTIONS.find((o) => o.value === travelStatusFilter) || null}
                  onChange={handleTravelStatusChange}
                  isClearable
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: 44,
                      borderRadius: 8,
                    }),
                  }}
                />
              </SoftBox>

              <SoftBox>
                <SoftSelect
                  placeholder="Payment status"
                  options={PAYMENT_STATUS_OPTIONS}
                  value={
                    PAYMENT_STATUS_OPTIONS.find((o) => o.value === paymentStatusFilter) || null
                  }
                  onChange={handlePaymentStatusChange}
                  isClearable
                  styles={{
                    control: (base) => ({
                      ...base,
                      minHeight: 44,
                      borderRadius: 8,
                    }),
                  }}
                />
              </SoftBox>

              {hasActiveFilters && (
                <SoftButton
                  variant="outlined"
                  color="error"
                  onClick={handleClearFilters}
                  startIcon={<Icon>clear</Icon>}
                  sx={{
                    height: 44,
                    borderRadius: "8px",
                    borderWidth: 2,
                    marginTop: "-4px",
                    "&:hover": {
                      borderWidth: 2,
                    },
                  }}
                >
                  Clear Filters
                </SoftButton>
              )}
            </SoftBox>

            {hasActiveFilters && (
              <SoftBox display="flex" gap={1.5} flexWrap="wrap">
                {searchQuery && (
                  <Chip
                    label={`Search: "${searchQuery}"`}
                    onDelete={() => setSearchQuery("")}
                    sx={{
                      height: 36,
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      backgroundColor: "#F1EDFF",
                      color: "#4B2FD6",
                      "& .MuiChip-deleteIcon": {
                        color: "#4B2FD6",
                        "&:hover": { color: "#0d47a1" },
                      },
                    }}
                  />
                )}
                {travelStatusFilter && (
                  <Chip
                    label={`Status: ${
                      TRAVEL_STATUS_OPTIONS.find((o) => o.value === travelStatusFilter)?.label
                    }`}
                    onDelete={() => setTravelStatusFilter("")}
                    sx={{
                      height: 36,
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      backgroundColor: "#fff3e0",
                      color: "#e65100",
                      "& .MuiChip-deleteIcon": {
                        color: "#e65100",
                        "&:hover": { color: "#bf360c" },
                      },
                    }}
                  />
                )}
                {paymentStatusFilter && (
                  <Chip
                    label={`Payment: ${
                      PAYMENT_STATUS_OPTIONS.find((o) => o.value === paymentStatusFilter)?.label
                    }`}
                    onDelete={() => setPaymentStatusFilter("")}
                    sx={{
                      height: 36,
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      backgroundColor: "#E6FBF4",
                      color: "#0B7A5A",
                      "& .MuiChip-deleteIcon": {
                        color: "#0B7A5A",
                        "&:hover": { color: "#1b5e20" },
                      },
                    }}
                  />
                )}
              </SoftBox>
            )}
          </SoftBox>
          <DataTable
            table={customDataTableData}
            entriesPerPage={{
              defaultValue: 10,
              entries: [10, 15, 20, 25, 50],
            }}
            canSearch={false}
            showTotalEntries
            isSorted
            noEndBorder
            onRowClick={(row) => handleViewOrder(row)}
            loading={loading}
            onEntriesChange={handleEntriesPerPageChange}
          />
          <SoftBox display="flex" justifyContent="center" alignItems="center" px={3} pb={3} mt={-8}>
            <SoftBox display="flex" alignItems="center" gap={4}>
              <StyledPagination
                count={pagination.totalPages}
                page={pagination.page}
                onChange={handlePageChange}
                size="small"
                disabled={loading}
                siblingCount={1}
                boundaryCount={1}
                shape="circular"
                variant="outlined"
              />
            </SoftBox>
          </SoftBox>
        </Card>
      </SoftBox>

    </DashboardLayout>
  );
}

export default OrdersList;
