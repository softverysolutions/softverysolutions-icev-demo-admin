import React, { createContext, useContext, useState, useEffect } from "react";
import PropTypes from "prop-types";
import { AuthService } from "../services/authService";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const profile = await AuthService.getCurrentUserProfile();
          setUserProfile(profile);
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email, role) => {
    return await AuthService.signInUser(email, role);
  };

  const signOut = async () => {
    return await AuthService.signOutUser();
  };

  const getIdToken = async () => {
    return await AuthService.getIdToken();
  };

  const refreshUserProfile = async () => {
    if (currentUser) {
      try {
        const profile = await AuthService.getCurrentUserProfile();
        setUserProfile(profile);
        return profile;
      } catch (error) {
        console.error("Failed to refresh user profile:", error);
        throw error;
      }
    }
  };

  const value = {
    currentUser,
    userProfile,
    signIn,
    signOut,
    getIdToken,
    refreshUserProfile,
    loading,
  };

  return <AuthContext.Provider value={value}>{!loading ? children : null}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
