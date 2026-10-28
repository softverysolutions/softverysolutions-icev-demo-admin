import {
  FALLBACK_CURRENCIES,
  getCurrencySymbol,
  getCurrencyPrefix,
  formatMoney,
  toCurrencySelectItem,
  CurrencyService,
} from "./currencyService";

describe("currencyService (demo: EUR only)", () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = jest.fn();
  });

  afterEach(() => jest.restoreAllMocks());

  it("falls back to EUR", () => {
    expect(FALLBACK_CURRENCIES).toEqual(["EUR"]);
  });

  it("formats euro amounts with the symbol, two decimals and thousands", () => {
    expect(getCurrencySymbol("EUR")).toBe("€");
    expect(getCurrencyPrefix("EUR")).toBe("€");
    expect(formatMoney(1576.825, "EUR")).toBe("€1,576.83");
    expect(formatMoney(-10, "EUR")).toBe("-€10.00");
  });

  it("uses the code as prefix for an unknown currency", () => {
    expect(getCurrencyPrefix("CHF")).toBe("CHF ");
    expect(toCurrencySelectItem("EUR", { withSymbol: true })).toEqual({ value: "EUR", label: "EUR (€)" });
  });

  it("loads the currency codes from the API", async () => {
    global.fetch.mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve([{ code: "EUR" }]) });
    await expect(CurrencyService.loadAvailableCurrencies({ delays: [] })).resolves.toEqual(["EUR"]);
  });
});
