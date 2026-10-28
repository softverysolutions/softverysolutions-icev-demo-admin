import React from "react";
import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isPathBlockedForRole, homePathForRole } from "permissions/can";

const ProtectedRoute = ({ children }) => {
  const { currentUser, userProfile, loading } = useAuth();
  const { pathname } = useLocation();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/authentication/sign-in/basic" />;
  }

  if (isPathBlockedForRole(userProfile?.role, pathname)) {
    return <Navigate to={homePathForRole(userProfile?.role)} replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;
