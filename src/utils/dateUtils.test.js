import { formatDateOnly, formatDateOnlyGB } from "./dateUtils";

// Run under different TZ values (e.g. TZ=America/Sao_Paulo, TZ=Europe/Kyiv):
// the saved UTC day must be shown in every zone (PUF-2223).
describe("UTC day formatting", () => {
  it("shows a discount start day stored as UTC midnight", () => {
    expect(formatDateOnly("2026-09-01T00:00:00.000Z")).toBe("01.09.2026");
  });

  it("shows a discount end day stored as UTC end of day", () => {
    expect(formatDateOnly("2026-12-15T23:59:59.999Z")).toBe("15.12.2026");
    expect(formatDateOnly("2027-03-31T23:59:59.999Z")).toBe("31.03.2027");
  });

  it("shows a package date and a course start in day/month/year", () => {
    expect(formatDateOnly("2026-10-26T00:00:00.000Z")).toBe("26.10.2026");
    expect(formatDateOnlyGB("2026-02-16T00:00:00.000Z")).toBe("16/02/2026");
  });

  it("returns null for empty or invalid input", () => {
    expect(formatDateOnly(null)).toBeNull();
    expect(formatDateOnly("not a date")).toBeNull();
    expect(formatDateOnlyGB("")).toBeNull();
  });
});
