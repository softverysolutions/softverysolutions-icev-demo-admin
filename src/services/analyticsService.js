import { API_BASE_URL } from "../config/api";

const analyticsService = {
  getAuthToken: async () => {
    const { auth } = await import("../demo/session");
    const { getAuth } = await import("../demo/session");
    const authInstance = getAuth();
    const user = authInstance.currentUser;

    if (!user) {
      throw new Error("User not authenticated");
    }

    const token = await user.getIdToken();
    return token;
  },

  getAnalytics: async (filters = {}) => {
    try {
      const token = await analyticsService.getAuthToken();

      const defaultFilters = {
        paymentFilter: { period: "last_month" },
        travelFilter: { period: "last_month" },
        revenueFilter: { period: "last_month" },
      };

      const requestBody = {
        ...defaultFilters,
        ...filters,
      };

      const response = await fetch(`${API_BASE_URL}/admin/analytics`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Failed to fetch analytics: ${response.status} - ${
            errorData.message || errorData.error || "Unknown error"
          }`
        );
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error("Error fetching analytics:", error);
      throw error;
    }
  },

  periodMapping: {
    last_7_days: "last_week",
    last_30_days: "last_month",
    last_year: "last_year",
    total: "total",
  },

  getApiPeriod: (uiPeriod) => {
    return analyticsService.periodMapping[uiPeriod] || "last_month";
  },

  getUiPeriod: (apiPeriod) => {
    const mapping = Object.entries(analyticsService.periodMapping).find(
      ([_, value]) => value === apiPeriod
    );
    return mapping ? mapping[0] : "last_30_days";
  },
};

export default analyticsService;
