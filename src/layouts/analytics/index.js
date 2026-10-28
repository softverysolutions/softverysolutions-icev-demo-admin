import React, { useState, useEffect } from "react";
import { Card, Grid, Typography, MenuItem, Menu, Icon } from "@mui/material";
import SoftBox from "../../components/SoftBox";
import SoftTypography from "../../components/SoftTypography";
import SoftButton from "../../components/SoftButton";
import MiniStatisticsCard from "../../examples/Cards/StatisticsCards/MiniStatisticsCard";
import DashboardLayout from "../../examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "../../examples/Navbars/DashboardNavbar";
import analyticsService from "../../services/analyticsService";
import { formatMoney } from "../../services/currencyService";
import TravelsChart from "./components/TravelsChart";
import TravelsByStatusChart from "./components/TravelsByStatusChart";
import RevenueChart from "./components/RevenueChart";
import PaymentsByStatusChart from "./components/PaymentsByStatusChart";
import PaymentsByMethodChart from "./components/PaymentsByMethodChart";

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("last_30_days");
  const [error, setError] = useState(null);
  const [periodMenu, setPeriodMenu] = useState(null);

  const periodOptions = [
    { value: "last_7_days", label: "Last 7 days" },
    { value: "last_30_days", label: "Last 30 days" },
    { value: "last_year", label: "Last 12 months" },
  ];

  const fetchAnalytics = async (period = selectedPeriod) => {
    try {
      setLoading(true);
      setError(null);

      const apiPeriod = analyticsService.getApiPeriod(period);
      const filters = {
        paymentFilter: { period: apiPeriod },
        travelFilter: { period: apiPeriod },
        revenueFilter: { period: apiPeriod },
      };

      const data = await analyticsService.getAnalytics(filters);
      setAnalyticsData(data);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      setError(`Failed to load analytics data: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const openPeriodMenu = (event) => setPeriodMenu(event.currentTarget);
  const closePeriodMenu = () => setPeriodMenu(null);

  const handlePeriodSelect = (period) => {
    setSelectedPeriod(period);
    fetchAnalytics(period);
    closePeriodMenu();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox my={3}>
          <Typography>Loading analytics...</Typography>
        </SoftBox>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox my={3}>
          <Typography color="error">{error}</Typography>
        </SoftBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox my={3}>
        <SoftBox mb={3}>
          <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <SoftBox>
              <SoftTypography variant="h4" fontWeight="bold" color="dark">
                Analytics
              </SoftTypography>
              <SoftTypography variant="body2" color="text" fontWeight="regular" mt={1}>
                Bookings, revenue and payments across tech and sport programmes (sample data).
              </SoftTypography>
            </SoftBox>

            <SoftBox display="flex" gap={2} alignItems="center">
              <SoftButton variant="gradient" color="dark" onClick={openPeriodMenu}>
                {periodOptions.find((option) => option.value === selectedPeriod)?.label ||
                  "Select period"}
                &nbsp;
                <Icon>expand_more</Icon>
              </SoftButton>

              <Menu
                anchorEl={periodMenu}
                transformOrigin={{ vertical: "top", horizontal: "left" }}
                open={Boolean(periodMenu)}
                onClose={closePeriodMenu}
                keepMounted
              >
                {periodOptions.map((option) => (
                  <MenuItem key={option.value} onClick={() => handlePeriodSelect(option.value)}>
                    {option.label}
                  </MenuItem>
                ))}
              </Menu>
            </SoftBox>
          </SoftBox>
        </SoftBox>

        <Grid container spacing={3} mb={4}>
          <Grid item xs={12} sm={6} lg={3}>
            <MiniStatisticsCard
              title={{ text: "Customers", fontWeight: "bold" }}
              count={analyticsData?.totalUsers || 0}
              percentage={{ color: "success", text: "Registered in the app" }}
              icon={{ color: "info", component: "people" }}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <MiniStatisticsCard
              title={{ text: "Purchasers", fontWeight: "bold" }}
              count={analyticsData?.totalPurchasers || 0}
              percentage={{ color: "success", text: "Customers with an order" }}
              icon={{ color: "info", component: "person_add" }}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <MiniStatisticsCard
              title={{ text: "Orders", fontWeight: "bold" }}
              count={analyticsData?.totalOrders || 0}
              percentage={{ color: "success", text: "In the selected period" }}
              icon={{ color: "info", component: "shopping_cart" }}
            />
          </Grid>
          <Grid item xs={12} sm={6} lg={3}>
            <MiniStatisticsCard
              title={{ text: "Revenue", fontWeight: "bold" }}
              count={formatMoney(analyticsData?.revenueTotal || 0, "EUR")}
              percentage={{ color: "success", text: "Paid, in EUR" }}
              icon={{ color: "info", component: "euro" }}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} lg={6}>
            <Card
              sx={{
                p: 3,
                height: "100%",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                border: "1px solid rgba(0, 0, 0, 0.05)",
              }}
            >
              <SoftTypography variant="h6" fontWeight="bold" mb={2} color="dark">
                Orders
              </SoftTypography>
              <TravelsChart data={analyticsData?.travel} />
            </Card>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Card
              sx={{
                p: 3,
                height: "100%",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                border: "1px solid rgba(0, 0, 0, 0.05)",
              }}
            >
              <SoftTypography variant="h6" fontWeight="bold" mb={2} color="dark">
                Orders by status
              </SoftTypography>
              <TravelsByStatusChart data={analyticsData?.travel} />
            </Card>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Card
              sx={{
                p: 3,
                height: "100%",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                border: "1px solid rgba(0, 0, 0, 0.05)",
              }}
            >
              <SoftTypography variant="h6" fontWeight="bold" mb={2} color="dark">
                Revenue by source
              </SoftTypography>
              <RevenueChart data={analyticsData?.revenue} />
            </Card>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Card
              sx={{
                p: 3,
                height: "100%",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                border: "1px solid rgba(0, 0, 0, 0.05)",
              }}
            >
              <SoftTypography variant="h6" fontWeight="bold" mb={2} color="dark">
                Payments by status
              </SoftTypography>
              <PaymentsByStatusChart data={analyticsData?.payment} />
            </Card>
          </Grid>

          <Grid item xs={12} lg={6}>
            <Card
              sx={{
                p: 3,
                height: "100%",
                borderRadius: "12px",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
                border: "1px solid rgba(0, 0, 0, 0.05)",
              }}
            >
              <SoftTypography variant="h6" fontWeight="bold" mb={2} color="dark">
                Payments by method
              </SoftTypography>
              <PaymentsByMethodChart data={analyticsData?.payment} />
            </Card>
          </Grid>
        </Grid>
      </SoftBox>
    </DashboardLayout>
  );
};

export default Analytics;
