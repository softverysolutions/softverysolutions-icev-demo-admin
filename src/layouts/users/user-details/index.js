import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";

import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import CircularProgress from "@mui/material/CircularProgress";
import CardMedia from "@mui/material/CardMedia";
import { Link } from "react-router-dom";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import ProfileInfoCard from "examples/Cards/InfoCards/ProfileInfoCard";


import Header from "./components/Header";
import { UserService } from "services/userService";
import { TravelService } from "services/travelService";
import { formatDateOnlyGB } from "utils/dateUtils";
import { travelStatusOf } from "layouts/orders/orders-list/utils/statuses";

const fallbackImage = `${process.env.PUBLIC_URL}/demo-images/tech-campus.jpg`;

function TravelCard({ travel }) {
  const campusImage = travel.courseImage || fallbackImage;
  return (
    <SoftBox
      sx={{
        maxHeight: "500px",
        maxWidth: "300px",
        minWidth: 240,
        flexShrink: 0,
      }}
    >
      <Card
        sx={{
          display: "flex",
          flexDirection: "column",
          backgroundColor: "transparent",
          boxShadow: "none",
          overflow: "visible",
        }}
      >
        <SoftBox position="relative" width="100%" shadow="xl" borderRadius="xl">
          <CardMedia
            src={campusImage}
            component="img"
            title={travel.packageName || (travel.courseName || "Programme").split(" - ")[0]}
            sx={{
              width: "100%",
              height: "200px",
              margin: 0,
              boxShadow: ({ boxShadows: { md } }) => md,
              objectFit: "cover",
              objectPosition: "center",
              borderRadius: "12px",
            }}
          />
        </SoftBox>
        <SoftBox pt={3} px={0.5}>
          <SoftBox mb={1}>
            <SoftTypography
              variant="button"
              fontWeight="regular"
              textTransform="capitalize"
              textGradient
            >
              {`order ${travel.id}`}
            </SoftTypography>
          </SoftBox>
          <SoftBox mb={1}>
            <SoftTypography
              component={Link}
              to={`/orders/view/${travel.id}`}
              variant="h5"
              textTransform="capitalize"
            >
              {travel.packageName || (travel.courseName || "Programme").split(" - ")[0]}
            </SoftTypography>
          </SoftBox>
          <SoftBox mb={3} lineHeight={0}>
            <SoftTypography variant="button" fontWeight="regular" color="text">
              {`Starts ${
                travel.selectedStartDate ? formatDateOnlyGB(travel.selectedStartDate) : "TBD"
              } · ${travel.duration || 0} weeks · ${travelStatusOf(travel.status).label}`}
            </SoftTypography>
          </SoftBox>
          <SoftBox display="flex" justifyContent="space-between" alignItems="center">
            <SoftButton
              component={Link}
              to={`/orders/view/${travel.id}`}
              variant="outlined"
              size="small"
              color="info"
            >
              view order
            </SoftButton>
          </SoftBox>
        </SoftBox>
      </Card>
    </SoftBox>
  );
}

TravelCard.propTypes = {
  travel: PropTypes.object.isRequired,
};

function UserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTravels, setLoadingTravels] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const userData = await UserService.getUserById(id);
        const formattedUser = await UserService.formatUserForDetail(userData);
        setUser(formattedUser);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    const fetchTravels = async () => {
      try {
        setLoadingTravels(true);
        const userTravels = await TravelService.getUserTravels(id);
        setTravels(userTravels);
      } catch (err) {
        console.error("Error fetching user travels:", err);
        setTravels([]);
      } finally {
        setLoadingTravels(false);
      }
    };

    if (id) {
      fetchUser();
      fetchTravels();
    }
  }, [id]);

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress />
          <SoftTypography variant="h6" color="text.secondary" ml={2}>
            Loading customer...
          </SoftTypography>
        </SoftBox>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <SoftBox textAlign="center">
            <SoftTypography variant="h6" color="error" mb={2}>
              Error loading customer
            </SoftTypography>
            <SoftTypography variant="body2" color="text.secondary">
              {error}
            </SoftTypography>
          </SoftBox>
        </SoftBox>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <SoftTypography variant="h6" color="text.secondary">
            Customer not found
          </SoftTypography>
        </SoftBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Header user={user} />
      <SoftBox mt={5} mb={3}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <ProfileInfoCard
              title="Personal Information"
              description="Profile and contact details"
              info={{
                "Full Name": user.fullName,
                "Lives in": user.country,
                "Date of Birth": user.dateOfBirth,
                Gender: user.gender,
                Email: user.email,
                "Phone Number": user.phoneNumber,
                "Skill level": user.skillLevel,
                "Registration Date": user.registrationDate,
              }}
              social={[]}
              action={{ route: "#", tooltip: "" }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <ProfileInfoCard
              title="Preferences"
              description="What the customer told us in the app"
              info={{
                Interests: user.preferences.interests,
                "Preferred duration": user.preferences.travelDurations,
                Goal: user.preferences.goal,
                "Cities of interest": user.preferences.interestCities,
                "Saved items": user.preferences.savedCount,
              }}
              social={[]}
              action={{ route: "#", tooltip: "" }}
            />
          </Grid>
        </Grid>
      </SoftBox>
      <SoftBox mb={3}>
        <Card>
          <SoftBox pt={2} px={2}>
            <SoftBox mb={0.5}>
              <SoftTypography variant="h6" fontWeight="medium">
                Orders
              </SoftTypography>
            </SoftBox>
            <SoftBox mb={1}>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                Bookings made by this customer
              </SoftTypography>
            </SoftBox>
          </SoftBox>
          <SoftBox p={2}>
            <SoftBox
              sx={{
                display: "flex",
                gap: 2,
                overflowX: "auto",
                pb: 2,
                "&::-webkit-scrollbar": {
                  height: 8,
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: "#f1f1f1",
                  borderRadius: 4,
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: "#888",
                  borderRadius: 4,
                  "&:hover": {
                    backgroundColor: "#555",
                  },
                },
              }}
            >
              {loadingTravels ? (
                <SoftBox
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  width="100%"
                  py={4}
                >
                  <CircularProgress size={24} />
                  <SoftTypography variant="body2" color="text.secondary" ml={2}>
                    Loading orders...
                  </SoftTypography>
                </SoftBox>
              ) : travels.length === 0 ? (
                <SoftBox
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  width="100%"
                  py={4}
                >
                  <SoftTypography variant="body2" color="text.secondary">
                    No orders yet
                  </SoftTypography>
                </SoftBox>
              ) : (
                travels.map((travel, index) => {
                  return (
                    <TravelCard key={travel.id || index} travel={travel} />
                  );
                })
              )}
            </SoftBox>
          </SoftBox>
        </Card>
      </SoftBox>
    </DashboardLayout>
  );
}

export default UserDetails;
