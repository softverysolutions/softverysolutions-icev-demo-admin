import { API_BASE_URL } from "../config/api";

export const FALLBACK_CURRENCIES = ["EUR"];

const CURRENCY_SYMBOLS = {
  EUR: "€",
  USD: "$",
  GBP: "£",
};

const STORAGE_KEY = "softvery-demo-admin.currencies";
const STORAGE_TTL_MS = 24 * 60 * 60 * 1000;
const RETRY_DELAYS_MS = [500, 1000, 2000];

export function getCurrencySymbol(currency) {
  if (!currency) return "";
  return CURRENCY_SYMBOLS[currency] || currency;
}

export function getCurrencyPrefix(currency) {
  const symbol = getCurrencySymbol(currency);
  return /^[A-Za-z]+$/.test(symbol) ? `${symbol} ` : symbol;
}

const AMOUNT_FORMAT = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatMoney(amount, currency) {
  const value = Math.round(Number(amount) * 100) / 100;
  const sign = value < 0 ? "-" : "";
  return `${sign}${getCurrencyPrefix(currency)}${AMOUNT_FORMAT.format(Math.abs(value))}`;
}

export function toCurrencySelectItem(currency, { withSymbol = false } = {}) {
  if (!currency) return null;
  const symbol = getCurrencySymbol(currency);
  const label = withSymbol && symbol !== currency ? `${currency} (${symbol})` : currency;
  return { value: currency, label };
}

export function buildCurrencySelectItems(codes, order = [], { withSymbol = false } = {}) {
  const preferred = order.filter((code) => codes.includes(code));
  const rest = codes.filter((code) => !preferred.includes(code));
  const known = FALLBACK_CURRENCIES.filter((code) => rest.includes(code));
  const unknown = rest.filter((code) => !FALLBACK_CURRENCIES.includes(code)).sort();
  return [...preferred, ...known, ...unknown].map((code) =>
    toCurrencySelectItem(code, { withSymbol })
  );
}

function isCurrencyList(value) {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every((code) => typeof code === "string" && code.length > 0)
  );
}

export function readCachedCurrencies(now = Date.now()) {
  try {
    const cached = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (!cached || typeof cached.savedAt !== "number" || !isCurrencyList(cached.codes)) {
      return null;
    }
    return now - cached.savedAt > STORAGE_TTL_MS ? null : cached.codes;
  } catch (error) {
    return null;
  }
}

function writeCachedCurrencies(codes) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ codes, savedAt: Date.now() }));
  } catch (error) {
    // The list still lives in memory for this session.
  }
}

function requestError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function fetchCurrencies() {
  const response = await fetch(`${API_BASE_URL}/currencies`);
  if (!response.ok) {
    throw requestError(`Currencies request failed with status ${response.status}`, response.status);
  }

  const data = await response.json().catch(() => null);
  const codes = Array.isArray(data) ? [...new Set(data.map((item) => item?.code))] : null;
  if (!isCurrencyList(codes)) {
    throw requestError("Currencies response has an unexpected shape", response.status);
  }
  return codes;
}

const isRetryable = (error) => error.statusCode == null || error.statusCode >= 500;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

let inFlight = null;

export class CurrencyService {
  static loadAvailableCurrencies({ delays = RETRY_DELAYS_MS } = {}) {
    if (!inFlight) {
      inFlight = this.requestWithRetries(delays).finally(() => {
        inFlight = null;
      });
    }
    return inFlight;
  }

  static async requestWithRetries(delays) {
    let lastError;
    for (let attempt = 0; attempt <= delays.length; attempt += 1) {
      if (attempt > 0) await wait(delays[attempt - 1]);
      try {
        const codes = await fetchCurrencies();
        writeCachedCurrencies(codes);
        return codes;
      } catch (error) {
        lastError = error;
        if (!isRetryable(error)) break;
      }
    }
    throw lastError;
  }
}
