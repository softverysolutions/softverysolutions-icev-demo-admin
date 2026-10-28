import {
  buildServiceDetailPayload,
  mapServiceDetailToForm,
  validateServiceDetail,
} from "./serviceDetailFields";

describe("extra detail content", () => {
  const saved = {
    coverImageUrl: "/demo-images/sport-surf.jpg",
    highlight: "Pick-up on arrival day",
    includedItems: ["Meet & greet", "Private car"],
    complementaryInfo: null,
    warningNote: "Not after 22:00",
  };

  it("sends nothing when the detail content was not changed", () => {
    const form = mapServiceDetailToForm(saved);
    expect(buildServiceDetailPayload(form, mapServiceDetailToForm(saved))).toEqual({});
  });

  it("sends only the changed fields, clearing emptied text with null", () => {
    const form = {
      ...mapServiceDetailToForm(saved),
      highlight: "  ",
      includedItems: ["Meet & greet", "", "Private car", "Bottle of water"],
      complementaryInfo: "Send your flight number",
    };
    expect(buildServiceDetailPayload(form, mapServiceDetailToForm(saved))).toEqual({
      highlight: null,
      includedItems: ["Meet & greet", "Private car", "Bottle of water"],
      complementaryInfo: "Send your flight number",
    });
  });

  it("sends the filled fields of a new service", () => {
    expect(
      buildServiceDetailPayload(
        { highlight: "Fast track", includedItems: [], warningNote: "" },
        null
      )
    ).toEqual({ highlight: "Fast track" });
  });

  it("removing the cover photo sends null", () => {
    const form = { ...mapServiceDetailToForm(saved), coverImageUrl: "" };
    expect(buildServiceDetailPayload(form, mapServiceDetailToForm(saved))).toEqual({
      coverImageUrl: null,
    });
  });

  it("validates the backend limits", () => {
    const errors = validateServiceDetail({
      highlight: "a".repeat(201),
      includedItems: ["b".repeat(501)],
      complementaryInfo: "c".repeat(2001),
      warningNote: "d".repeat(501),
    });
    expect(Object.keys(errors).sort()).toEqual([
      "complementaryInfo",
      "highlight",
      "includedItems",
      "warningNote",
    ]);
    expect(validateServiceDetail({ highlight: "ok", includedItems: ["fine"] })).toEqual({});
  });
});
