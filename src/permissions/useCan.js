import { useMemo, useCallback } from "react";
import { useAuth } from "context/AuthContext";
import { can } from "./can";

export function useCan() {
  const { userProfile } = useAuth();
  const role = userProfile?.role;

  const check = useCallback((featureKey) => can(role, featureKey), [role]);

  return useMemo(
    () => ({
      role,
      can: check,
    }),
    [role, check]
  );
}
