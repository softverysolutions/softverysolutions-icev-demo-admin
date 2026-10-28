import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import PropTypes from "prop-types";
import {
  CurrencyService,
  FALLBACK_CURRENCIES,
  buildCurrencySelectItems,
  readCachedCurrencies,
  toCurrencySelectItem,
} from "../services/currencyService";

const CurrencyContext = createContext(null);

const useCurrencies = () => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error("useCurrencies must be used within a CurrencyProvider");
  }
  return context;
};

const sameCodes = (a, b) => a.length === b.length && a.every((code, index) => code === b[index]);

const loadingMessage = () => "Loading currencies…";

function getInitialState() {
  const cached = readCachedCurrencies();
  return cached ? { codes: cached, status: "ready" } : { codes: [], status: "loading" };
}

export const CurrencyProvider = ({ children }) => {
  const [state, setState] = useState(getInitialState);
  const hasLoadedRef = useRef(state.status === "ready");

  const refresh = useCallback(
    () =>
      CurrencyService.loadAvailableCurrencies()
        .then((codes) => {
          hasLoadedRef.current = true;
          setState((current) =>
            current.status === "ready" && sameCodes(current.codes, codes)
              ? current
              : { codes, status: "ready" }
          );
        })
        .catch((error) => {
          if (hasLoadedRef.current) return;
          console.warn("[currencies] falling back to the static list", error);
          setState({ codes: FALLBACK_CURRENCIES, status: "fallback" });
        }),
    []
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(() => ({ ...state, refresh }), [state, refresh]);

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>;
};

CurrencyProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useCurrencySelect = (order, { withSymbol = false } = {}) => {
  const { codes, status, refresh } = useCurrencies();

  const options = useMemo(
    () => buildCurrencySelectItems(codes, order, { withSymbol }),
    [codes, order, withSymbol]
  );

  const toOption = useCallback(
    (currency) => toCurrencySelectItem(currency, { withSymbol }),
    [withSymbol]
  );

  const onMenuOpen = useCallback(() => {
    if (status === "fallback") refresh();
  }, [status, refresh]);

  return { options, isLoading: status === "loading", loadingMessage, toOption, onMenuOpen };
};
