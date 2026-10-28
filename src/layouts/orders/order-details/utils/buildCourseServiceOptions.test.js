import { buildCourseServiceOptions } from "./buildCourseServiceOptions";

// A programme that offers "Laptop rental", priced in AED at 90 per week.
const aedPerWeek = {
  id: "cs-aed",
  isMandatory: false,
  price: null,
  durationPrices: [{ minWeeks: 1, maxWeeks: 52, mode: "PER_WEEK", price: 90 }],
  service: { id: "svc-aed", name: "Laptop rental", currency: "AED", isActive: true },
};

describe("buildCourseServiceOptions", () => {
  it("carries the service's own currency and prices per week over the course", () => {
    const [option] = buildCourseServiceOptions([aedPerWeek], 6);

    expect(option).toMatchObject({
      value: "svc-aed",
      label: "Laptop rental",
      courseServiceId: "cs-aed",
      price: 540,
      currency: "AED",
      isMandatory: false,
    });
  });

  it("takes a fixed tier price as it is", () => {
    const fixed = {
      ...aedPerWeek,
      durationPrices: [{ minWeeks: 1, maxWeeks: 52, mode: "FIXED", price: 300 }],
    };

    expect(buildCourseServiceOptions([fixed], 6)[0].price).toBe(300);
  });

  it("uses the course service price when it has no duration prices", () => {
    const flat = { ...aedPerWeek, price: 75, durationPrices: [] };

    expect(buildCourseServiceOptions([flat], 6)[0].price).toBe(75);
  });

  it("leaves out services that are switched off", () => {
    const inactive = { ...aedPerWeek, service: { ...aedPerWeek.service, isActive: false } };

    expect(buildCourseServiceOptions([inactive], 6)).toEqual([]);
  });
});
