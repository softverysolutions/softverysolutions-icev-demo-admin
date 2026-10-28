/**
=========================================================
* Soft UI Dashboard PRO React - v4.0.3
=========================================================

* Product Page: https://www.creative-tim.com/product/soft-ui-dashboard-pro-react
* Copyright 2024 Creative Tim (https://www.creative-tim.com)

Coded by www.creative-tim.com

 =========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
*/

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import PageLayout from "examples/LayoutContainers/PageLayout";

import { useAuth } from "context/AuthContext";
import { homePathForRole } from "permissions/can";
import { DEMO_ROLES, DEMO_OPERATORS } from "demo/session";

import logo from "assets/images/softvery-demo-admin-logo.png";

const ROLE_ICONS = { super_admin: "verified_user", admin: "admin_panel_settings", consultant: "support_agent" };

function SignIn() {
  const navigate = useNavigate();
  const { signIn, userProfile } = useAuth();
  const [role, setRole] = useState(userProfile?.role || "super_admin");
  const [email, setEmail] = useState(DEMO_OPERATORS[role].email);
  const [password, setPassword] = useState("demo-password");
  const [submitting, setSubmitting] = useState(false);
  const [pendingRole, setPendingRole] = useState(null);

  // Navigate once the profile for the chosen role has loaded.
  useEffect(() => {
    if (pendingRole && userProfile?.role === pendingRole) {
      navigate(homePathForRole(pendingRole), { replace: true });
    }
  }, [pendingRole, userProfile, navigate]);

  const pickRole = (value) => {
    setRole(value);
    setEmail(DEMO_OPERATORS[value].email);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    await signIn(email.trim() || DEMO_OPERATORS[role].email, role);
    setPendingRole(role);
  };

  return (
    <PageLayout background="white">
      <SoftBox display="flex" minHeight="100vh" sx={{ flexDirection: { xs: "column", lg: "row" } }}>
        <SoftBox
          flex={1}
          p={{ xs: 4, lg: 8 }}
          display="flex"
          flexDirection="column"
          justifyContent="space-between"
          sx={{
            color: "#fff",
            backgroundImage: `linear-gradient(140deg, rgba(36, 26, 92, 0.92), rgba(109, 74, 255, 0.82)), url(${process.env.PUBLIC_URL}/demo-images/tech-campus.jpg)`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <SoftBox
            bgColor="white"
            borderRadius="lg"
            px={2}
            py={1.5}
            display="inline-flex"
            alignSelf="flex-start"
          >
            <SoftBox component="img" src={logo} alt="Softvery Demo Admin" width="11rem" />
          </SoftBox>
          <SoftBox my={6} maxWidth="34rem">
            <SoftTypography variant="h2" color="white" fontWeight="bold" mb={2}>
              Run your tech &amp; sport programmes from one place
            </SoftTypography>
            <SoftTypography variant="body1" color="white" opacity={0.85}>
              Providers, programmes, stays, packages, orders, promo codes, course plans and
              community moderation — the operator side of the Softvery Demo app.
            </SoftTypography>
          </SoftBox>
          <SoftTypography variant="button" color="white" opacity={0.8}>
            Demo by Softvery Solutions · works offline · sample data only
          </SoftTypography>
        </SoftBox>

        <SoftBox
          flex={1}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={{ xs: 2, md: 6 }}
          bgColor="grey-100"
        >
          <Card sx={{ width: "100%", maxWidth: "30rem" }}>
            <SoftBox component="form" onSubmit={handleSubmit} p={4} data-testid="demo-sign-in">
              <SoftTypography variant="h4" fontWeight="bold">
                Sign in to the demo
              </SoftTypography>
              <SoftTypography variant="body2" color="text" mb={3}>
                The session is pre-filled. Pick a role to see what each operator can do.
              </SoftTypography>

              <SoftTypography variant="caption" fontWeight="bold" textTransform="uppercase" color="text">
                Role
              </SoftTypography>
              <SoftBox display="flex" flexDirection="column" gap={1} mt={1} mb={3} role="radiogroup">
                {DEMO_ROLES.map((option) => {
                  const selected = option.value === role;
                  return (
                    <SoftBox
                      key={option.value}
                      role="radio"
                      aria-checked={selected}
                      tabIndex={0}
                      data-testid={`role-${option.value}`}
                      onClick={() => pickRole(option.value)}
                      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && pickRole(option.value)}
                      display="flex"
                      alignItems="center"
                      gap={1.5}
                      p={1.5}
                      borderRadius="lg"
                      sx={{
                        cursor: "pointer",
                        border: `2px solid ${selected ? "#6D4AFF" : "#E7E5F0"}`,
                        backgroundColor: selected ? "#F1EDFF" : "#fff",
                        transition: "all 120ms ease",
                      }}
                    >
                      <Icon sx={{ color: selected ? "#6D4AFF" : "#8E8BA3" }}>{ROLE_ICONS[option.value]}</Icon>
                      <SoftBox>
                        <SoftTypography variant="button" fontWeight="bold" display="block">
                          {option.label}
                        </SoftTypography>
                        <SoftTypography variant="caption" color="text">
                          {option.description}
                        </SoftTypography>
                      </SoftBox>
                    </SoftBox>
                  );
                })}
              </SoftBox>

              <SoftBox mb={2}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Email
                </SoftTypography>
                <SoftInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </SoftBox>
              <SoftBox mb={3}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Password
                </SoftTypography>
                <SoftInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                <SoftTypography variant="caption" color="text">
                  Demo only: any password works.
                </SoftTypography>
              </SoftBox>
              <SoftButton type="submit" variant="gradient" color="info" fullWidth disabled={submitting}>
                {submitting ? "Signing in…" : "Sign in"}
              </SoftButton>
            </SoftBox>
          </Card>
        </SoftBox>
      </SoftBox>
    </PageLayout>
  );
}

export default SignIn;
