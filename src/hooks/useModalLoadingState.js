import { useState, useCallback, useMemo } from "react";

export const useModalLoadingState = (dependencies = []) => {
  const [loadingStates, setLoadingStates] = useState({});
  const [isInitializing, setIsInitializing] = useState(false);

  const setLoading = useCallback((key, isLoading) => {
    setLoadingStates((prev) => ({
      ...prev,
      [key]: isLoading,
    }));
  }, []);

  const setInitializing = useCallback((isInitializing) => {
    setIsInitializing(isInitializing);
  }, []);

  const isAnyLoading = useMemo(() => {
    return dependencies.some((dep) => loadingStates[dep] === true);
  }, [dependencies, loadingStates]);

  const isLoading = useCallback(
    (key) => {
      return loadingStates[key] === true;
    },
    [loadingStates]
  );

  const canSave = useMemo(() => {
    return !isInitializing;
  }, [isInitializing]);

  const canEdit = useMemo(() => {
    return !isInitializing;
  }, [isInitializing]);

  const getSaveButtonText = useCallback(
    (defaultText = "Save") => {
      if (isInitializing) return "Loading...";
      if (isAnyLoading) return "Loading data...";
      return defaultText;
    },
    [isInitializing, isAnyLoading]
  );

  const getSelectPlaceholder = useCallback(
    (key, defaultText = "Select...") => {
      if (isLoading(key)) return "Loading...";
      return defaultText;
    },
    [isLoading]
  );

  const resetLoadingStates = useCallback(() => {
    setLoadingStates({});
    setIsInitializing(false);
  }, []);

  return {
    isInitializing,
    isAnyLoading,
    canSave,
    canEdit,
    loadingStates,
    setLoading,
    setInitializing,
    isLoading,
    getSaveButtonText,
    getSelectPlaceholder,
    resetLoadingStates,
  };
};

export default useModalLoadingState;
