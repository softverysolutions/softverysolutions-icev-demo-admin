import { buildCityApiPayload } from "./cityService";

describe("buildCityApiPayload isActive", () => {
  it("sends the Active switch value", () => {
    expect(buildCityApiPayload({ name: "Lisbon", countryId: "pt", isActive: false }).isActive).toBe(
      false
    );
    expect(buildCityApiPayload({ name: "Lisbon", countryId: "pt", isActive: true }).isActive).toBe(
      true
    );
  });

  it("leaves isActive out when the caller does not set it", () => {
    expect(buildCityApiPayload({ name: "Lisbon", countryId: "pt" })).not.toHaveProperty("isActive");
  });
});
