import { buildServiceUpdatePayload } from "./serviceService";

describe("buildServiceUpdatePayload", () => {
  it("sends only the status when only the status is toggled", () => {
    expect(buildServiceUpdatePayload({ isActive: false })).toEqual({ isActive: false });
  });

  it("does not invent defaults for missing fields", () => {
    const payload = buildServiceUpdatePayload({ isActive: true });
    expect(payload).not.toHaveProperty("name");
    expect(payload).not.toHaveProperty("type");
    expect(payload).not.toHaveProperty("currency");
    expect(payload).not.toHaveProperty("description");
  });

  it("keeps every field the edit form sends, including an empty description", () => {
    expect(
      buildServiceUpdatePayload({
        type: "equipment",
        name: "Laptop rental",
        isActive: 1,
        currency: "EUR",
        description: "",
      })
    ).toEqual({
      type: "equipment",
      name: "Laptop rental",
      isActive: true,
      currency: "EUR",
      description: "",
    });
  });
});
