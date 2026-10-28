import { fetchAllCities, groupCitiesByCountry } from "./utils";

describe("destinations list loading", () => {
  it("loads all cities with one request when they fit in a page", async () => {
    const searchCities = jest.fn().mockResolvedValue({
      data: [{ id: "c1" }, { id: "c2" }],
      meta: { hasNextPage: false },
    });
    const cities = await fetchAllCities(searchCities);
    expect(searchCities).toHaveBeenCalledTimes(1);
    expect(searchCities.mock.calls[0][0]).not.toHaveProperty("filters");
    expect(cities).toHaveLength(2);
  });

  it("follows further pages only when the backend reports them", async () => {
    const searchCities = jest
      .fn()
      .mockResolvedValueOnce({ data: [{ id: "c1" }], meta: { hasNextPage: true } })
      .mockResolvedValueOnce({ data: [{ id: "c2" }], meta: { hasNextPage: false } });
    const cities = await fetchAllCities(searchCities);
    expect(searchCities).toHaveBeenCalledTimes(2);
    expect(searchCities.mock.calls[1][0].page).toBe(2);
    expect(cities.map((c) => c.id)).toEqual(["c1", "c2"]);
  });

  it("groups cities under their country", () => {
    const grouped = groupCitiesByCountry([
      { id: "lis", country: { id: "pt" } },
      { id: "opo", country: { id: "pt" } },
      { id: "dub", countryId: "ie" },
      { id: "orphan" },
    ]);
    expect(Object.keys(grouped).sort()).toEqual(["ie", "pt"]);
    expect(grouped.pt.map((c) => c.id)).toEqual(["lis", "opo"]);
  });
});
