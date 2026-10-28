import { useNavigate } from "react-router-dom";

import PropTypes from "prop-types";

import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftAvatar from "components/SoftAvatar";
import SoftButton from "components/SoftButton";

import DashboardNavbar from "examples/Navbars/DashboardNavbar";


const headerImage = `${process.env.PUBLIC_URL}/demo-images/home-hero.jpg`;

function Header({ user }) {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate("/users/users-list");
  };

  return (
    <SoftBox position="relative">
      <DashboardNavbar absolute light />
      <SoftBox
        display="flex"
        alignItems="center"
        position="relative"
        minHeight="18.75rem"
        borderRadius="xl"
        sx={{
          backgroundImage: ({ functions: { rgba, linearGradient }, palette: { gradients } }) =>
            `${linearGradient(
              rgba(gradients.info.main, 0.6),
              rgba(gradients.info.state, 0.6)
            )}, url(${headerImage})`,
          backgroundSize: "cover",
          backgroundPosition: "50%",
          overflow: "hidden",
        }}
      />
      <Card
        sx={{
          backdropFilter: `saturate(200%) blur(30px)`,
          backgroundColor: ({ functions: { rgba }, palette: { white } }) => rgba(white.main, 0.8),
          boxShadow: ({ boxShadows: { navbarBoxShadow } }) => navbarBoxShadow,
          position: "relative",
          mt: -8,
          mx: 3,
          py: 2,
          px: 2,
        }}
      >
        <Grid container spacing={3} alignItems="center">
          <Grid item>
            <SoftAvatar
              src={user?.avatarUrl || undefined}
              alt={user?.fullName || "Customer"}
              variant="rounded"
              size="xl"
              shadow="sm"
              sx={{
                bgcolor: "info.main",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {!user?.avatarUrl && <Icon sx={{ fontSize: "2rem", color: "white" }}>person</Icon>}
            </SoftAvatar>
          </Grid>
          <Grid item>
            <SoftBox height="100%" mt={0.5} lineHeight={1}>
              <SoftTypography variant="h5" fontWeight="medium">
                {user?.fullName || "User"}
              </SoftTypography>
              <SoftTypography variant="button" color="text" fontWeight="medium">
                {user?.role || "Customer"}
              </SoftTypography>
            </SoftBox>
          </Grid>
          <Grid item xs={12} md={6} lg={4} sx={{ ml: "auto", textAlign: "right", pr: 2 }}>
            <SoftButton
              variant="gradient"
              color="info"
              onClick={handleBack}
              startIcon={<Icon>arrow_back</Icon>}
            >
              Back
            </SoftButton>
          </Grid>
        </Grid>
      </Card>
    </SoftBox>
  );
}

Header.propTypes = {
  user: PropTypes.shape({
    fullName: PropTypes.string,
    role: PropTypes.string,
    avatarUrl: PropTypes.string,
  }),
};

export default Header;
