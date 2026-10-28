import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { ServiceService } from "services/serviceService";
import { CountryService } from "services/countryService";

function BulkAssignResult() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [service, setService] = useState(null);
  const [country, setCountry] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (location.state?.bulkResult) {
          setResult(location.state.bulkResult);

          if (serviceId) {
            const serviceData = await ServiceService.getServiceById(serviceId);
            setService(serviceData);
          }

          if (location.state.bulkResult.countryId) {
            const countryData = await CountryService.getCountryById(
              location.state.bulkResult.countryId
            );
            setCountry(countryData);
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [serviceId, location.state]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </SoftBox>
      </DashboardLayout>
    );
  }

  if (!result) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox my={3}>
          <Card>
            <SoftBox p={4} textAlign="center">
              <Icon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }}>info</Icon>
              <SoftTypography variant="h5" color="text" mb={2}>
                No bulk assign result found
              </SoftTypography>
              <SoftButton
                variant="gradient"
                color="info"
                onClick={() => navigate("/services/services-list")}
              >
                Go to Extras
              </SoftButton>
            </SoftBox>
          </Card>
        </SoftBox>
      </DashboardLayout>
    );
  }

  const hasFailures = result.failedCount > 0;
  const allSuccess = result.failedCount === 0 && result.successCount > 0;

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <SoftBox my={3}>
        <Card sx={{ mb: 3 }}>
          <SoftBox p={3}>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center">
              <SoftBox display="flex" alignItems="center" gap={2}>
                <SoftButton
                  variant="outlined"
                  color="dark"
                  size="small"
                  onClick={() => navigate("/services/services-list")}
                  sx={{ minWidth: "auto" }}
                >
                  <Icon>arrow_back</Icon>
                </SoftButton>
                <SoftBox>
                  <SoftTypography variant="h5" fontWeight="medium">
                    Bulk Assign Result
                  </SoftTypography>
                  <SoftBox display="flex" alignItems="center" gap={1} mt={0.5}>
                    {service && (
                      <Chip label={service.name} size="small" variant="outlined" color="primary" />
                    )}
                    {country && <Chip label={country.name} size="small" variant="outlined" />}
                  </SoftBox>
                </SoftBox>
              </SoftBox>
              <SoftButton
                variant="gradient"
                color="info"
                onClick={() => navigate(`/services/${serviceId}/pricing`)}
              >
                View Pricing Rules
              </SoftButton>
            </SoftBox>
          </SoftBox>
        </Card>

        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <SoftBox p={3} textAlign="center">
                <SoftTypography variant="h2" fontWeight="bold" color="info">
                  {result.totalCourses}
                </SoftTypography>
                <SoftTypography variant="button" color="text">
                  Total programmes
                </SoftTypography>
              </SoftBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <SoftBox p={3} textAlign="center">
                <SoftTypography variant="h2" fontWeight="bold" color="success">
                  {result.successCount}
                </SoftTypography>
                <SoftTypography variant="button" color="text">
                  Successfully Assigned
                </SoftTypography>
              </SoftBox>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <SoftBox p={3} textAlign="center">
                <SoftTypography
                  variant="h2"
                  fontWeight="bold"
                  color={hasFailures ? "error" : "text"}
                >
                  {result.failedCount}
                </SoftTypography>
                <SoftTypography variant="button" color="text">
                  Failed
                </SoftTypography>
              </SoftBox>
            </Card>
          </Grid>
        </Grid>

        {allSuccess && (
          <Card sx={{ mb: 3 }}>
            <SoftBox p={4} textAlign="center">
              <Icon sx={{ fontSize: 60, color: "success.main", mb: 2 }}>check_circle</Icon>
              <SoftTypography variant="h5" color="success" mb={1}>
                All courses assigned successfully!
              </SoftTypography>
              <SoftTypography variant="body2" color="text">
                The extra has been assigned to all {result.successCount} programmes in this country.
              </SoftTypography>
            </SoftBox>
          </Card>
        )}

        {hasFailures && (
          <Card>
            <SoftBox p={3}>
              <SoftBox display="flex" alignItems="center" gap={1} mb={2}>
                <Icon color="error">error</Icon>
                <SoftTypography variant="h6" fontWeight="medium">
                  Failed Assignments ({result.failedCount})
                </SoftTypography>
              </SoftBox>

              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>
                        <SoftTypography variant="caption" fontWeight="bold">
                          Programme
                        </SoftTypography>
                      </TableCell>
                      <TableCell>
                        <SoftTypography variant="caption" fontWeight="bold">
                          Reason
                        </SoftTypography>
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {result.failures?.map((failure, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <SoftTypography variant="button" fontWeight="medium">
                            {failure.courseId}
                          </SoftTypography>
                        </TableCell>
                        <TableCell>
                          <SoftTypography variant="caption" color="error">
                            {failure.reason}
                          </SoftTypography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </SoftBox>
          </Card>
        )}
      </SoftBox>
    </DashboardLayout>
  );
}

export default BulkAssignResult;

