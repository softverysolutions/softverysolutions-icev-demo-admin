// Mock API for accommodation (stays), their seasonal fees and mandatory services.
import { http } from "msw";
import catalogSeed from "demo/seed/catalog.json";
import { db } from "../db";
import {
  API,
  json,
  notFound,
  readJson,
  newId,
  nowIso,
  paginate,
  includesText,
  sortBy,
  demoImage,
  today,
  addDays,
} from "../utils";

const CREATED_AT = "2026-01-15T09:00:00.000Z";

// The app seed uses generic categories; the admin shows the more specific stay types.
const CATEGORY_OVERRIDES = {
  "kreuzberg-flat": "sharedApartment",
  "ruzafa-apartment": "sharedApartment",
  "ocean-surf-house": "surfHouse",
  "amsterdam-tech-residence": "campusResidence",
  "beachside-sports": "campusResidence",
  "alpine-chalet": "chalet",
  "gracia-loft": "loft",
};

const HOSTS = [
  ["Host", "Lena Fischer", "+49 30 1234 5678"],
  ["Residence manager", "Tiago Matos", "+351 21 555 0101"],
  ["Host", "Marta Puig", "+34 93 555 0142"],
  ["House manager", "Nuno Costa", "+351 261 555 019"],
];

function cityRef(catalog, cityId) {
  const city = catalog.cities.find((c) => c.id === cityId);
  if (!city) return null;
  const country = catalog.countries.find((c) => c.id === city.countryId);
  return {
    id: city.id,
    name: city.name,
    countryId: city.countryId,
    country: country ? { id: country.id, name: country.name, code: country.code } : null,
  };
}

export function seed({ catalog }) {
  const start = today();
  const accommodations = catalog.accommodations.map((a, index) => {
    const [contactType, contactName, phone] = HOSTS[index % HOSTS.length];
    const campusIds = a.campusIds || [];
    const firstCampus = catalog.campuses.find((c) => c.id === campusIds[0]);
    return {
      id: a.id,
      name: a.name,
      category: CATEGORY_OVERRIDES[a.id] || a.category,
      type: a.type,
      bathroomType: a.bathroom,
      regimeType: a.regime,
      schoolId: firstCampus?.providerId || null,
      isActive: true,
      cityId: a.cityId,
      city: cityRef(catalog, a.cityId),
      currency: "EUR",
      address: a.address || "",
      minAge: 18,
      maxAge: 65,
      description: a.description || "",
      url: "",
      accommodationInstructions: `<p>Check-in from 15:00. Keys are handed over at reception or by the ${contactType.toLowerCase()}.</p>`,
      accommodationInstructionsNote: "Late arrival? Message the host and they will wait for you.",
      accommodationContactType: contactType,
      accommodationContactName: contactName,
      hostPhone: phone,
      hostWhatsapp: phone,
      hostEmail: `stay-${a.id}@softvery.example`,
      houseRules: "<p>Quiet hours 22:00–07:00. No smoking indoors. Guests welcome until 22:00.</p>",
      amenityIds: [],
      amenityNames: a.amenities || [],
      images: (a.images || []).map((key, i) => ({ id: `${a.id}-img-${i}`, imageUrl: demoImage(key), description: "" })),
      simplePrices: [{ id: `${a.id}-price`, price: a.pricePerWeek, period: "week" }],
      flexibleDurationPrices: [],
      fixedDurationPrices: [],
      campusIds,
      fullPaymentDiscount: null,
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    };
  });

  // A summer supplement on the beach stays, so the seasonal-fee editor has data.
  const accommodationFees = ["ocean-surf-house", "surf-lodge-private", "beachside-sports"]
    .filter((id) => accommodations.some((a) => a.id === id))
    .map((accommodationId) => ({
      id: `fee-${accommodationId}`,
      accommodationId,
      startDate: addDays(start, 200),
      endDate: addDays(start, 290),
      supplementPerWeek: 40,
      active: true,
    }));

  const accommodationServices = accommodations.flatMap((a) =>
    a.regimeType === "HalfBoard" || a.category === "chalet"
      ? []
      : [
          {
            id: `asvc-${a.id}-cleaning`,
            accommodationId: a.id,
            name: "Final cleaning",
            value: 35,
            pricingType: "FIXED_AMOUNT",
            isActive: true,
          },
        ]
  );

  return { accommodations, accommodationFees, accommodationServices };
}

/* ---- response shaping ----------------------------------------------------- */

// Campuses, cities and countries belong to other mock domains; fall back to the shared seed.
export function campusInfo(id) {
  const row = db.get("campuses", id);
  const seedRow = catalogSeed.campuses.find((c) => c.id === id);
  return {
    id,
    name: row?.name || seedRow?.name || id,
    schoolId: row?.schoolId || row?.school?.id || seedRow?.providerId || null,
    cityId: row?.cityId || row?.city?.id || seedRow?.cityId || null,
  };
}

function campusName(id) {
  return campusInfo(id).name;
}

function amenityNames(row) {
  const amenities = db.all("amenities");
  const fromIds = (row.amenityIds || [])
    .map((id) => amenities.find((a) => String(a.id) === String(id))?.name)
    .filter(Boolean);
  return fromIds.length ? fromIds : row.amenityNames || [];
}

export function toAccommodationResponse(row) {
  if (!row) return null;
  return {
    ...row,
    amenities: amenityNames(row),
    campuses: (row.campusIds || []).map((campusId) => ({ campusId, campusName: campusName(campusId) })),
    services: db.filter("accommodationServices", (s) => s.accommodationId === row.id),
    fees: db.filter("accommodationFees", (f) => f.accommodationId === row.id),
  };
}

function pricePerWeek(row) {
  if (row.simplePrices?.length) return Number(row.simplePrices[0].price) || 0;
  if (row.flexibleDurationPrices?.length)
    return Math.min(...row.flexibleDurationPrices.map((p) => Number(p.pricePerWeek) || 0));
  if (row.fixedDurationPrices?.length)
    return Math.min(
      ...row.fixedDurationPrices.map((p) => (Number(p.totalPrice) || 0) / (Number(p.durationWeeks) || 1))
    );
  return 0;
}

function fromPayload(body, existing = {}) {
  const row = {
    ...existing,
    name: body.name ?? existing.name,
    category: body.category ?? existing.category,
    type: body.type ?? existing.type,
    bathroomType: body.bathroomType ?? existing.bathroomType,
    regimeType: body.regimeType ?? existing.regimeType,
    schoolId: body.schoolId ?? existing.schoolId ?? null,
    isActive: body.isActive ?? existing.isActive ?? true,
    cityId: body.cityId ?? existing.cityId,
    currency: "EUR",
    address: body.address ?? existing.address ?? "",
    minAge: body.minAge ?? existing.minAge,
    maxAge: body.maxAge ?? existing.maxAge,
    description: body.description ?? existing.description ?? "",
    url: body.url ?? existing.url ?? "",
    amenityIds: body.amenityIds ?? existing.amenityIds ?? [],
    campusIds: body.campusIds ?? existing.campusIds ?? [],
    fullPaymentDiscount:
      body.fullPaymentDiscount !== undefined ? body.fullPaymentDiscount : existing.fullPaymentDiscount ?? null,
  };
  [
    "accommodationInstructions",
    "accommodationInstructionsNote",
    "accommodationContactType",
    "accommodationContactName",
    "hostPhone",
    "hostWhatsapp",
    "hostEmail",
    "houseRules",
  ].forEach((key) => {
    if (body[key] !== undefined) row[key] = body[key];
  });
  if (body.amenityIds) row.amenityNames = [];
  // The editor sends exactly one price model; the others are cleared.
  if (body.simplePrices || body.flexibleDurationPrices || body.fixedDurationPrices) {
    row.simplePrices = (body.simplePrices || []).map((p, i) => ({ id: `price-${i}`, ...p }));
    row.flexibleDurationPrices = (body.flexibleDurationPrices || []).map((p, i) => ({ id: `flex-${i}`, ...p }));
    row.fixedDurationPrices = (body.fixedDurationPrices || []).map((p, i) => ({ id: `fixed-${i}`, ...p }));
  }
  if (Array.isArray(body.images)) {
    row.images = body.images.map((img, i) => ({
      id: img.id || `img-${i}-${Date.now()}`,
      imageUrl: img.imageUrl,
      description: img.description || "",
    }));
  }
  const city = db.get("cities", row.cityId) || catalogSeed.cities.find((c) => c.id === row.cityId);
  if (city) {
    const countryId = city.countryId || city.country?.id;
    const country =
      db.get("countries", countryId) || catalogSeed.countries.find((c) => c.id === countryId);
    row.city = {
      id: city.id,
      name: city.name,
      countryId,
      country: country ? { id: country.id, name: country.name, code: country.code } : null,
    };
  }
  return row;
}

/* ---- handlers -------------------------------------------------------------- */

export const handlers = [
  http.post(`${API}/admin/accommodations/search`, async ({ request }) => {
    const body = await readJson(request);
    const f = body.filter || {};
    const campusSchool = (campusId) => campusInfo(campusId).schoolId;
    let list = db.all("accommodations").filter((a) => {
      if (!includesText(`${a.name} ${a.address} ${a.city?.name || ""}`, body.search)) return false;
      if (f.cityIds?.length && !f.cityIds.includes(a.cityId)) return false;
      if (f.countryIds?.length && !f.countryIds.includes(a.city?.countryId)) return false;
      if (f.campusIds?.length && !(a.campusIds || []).some((id) => f.campusIds.includes(id))) return false;
      if (f.types?.length && !f.types.includes(a.type)) return false;
      if (f.categories?.length && !f.categories.includes(a.category)) return false;
      if (f.regimeTypes?.length && !f.regimeTypes.includes(a.regimeType)) return false;
      if (
        f.schoolIds?.length &&
        !f.schoolIds.includes(a.schoolId) &&
        !(a.campusIds || []).some((id) => f.schoolIds.includes(campusSchool(id)))
      )
        return false;
      if (f.priceFilter?.durationWeeks) {
        const total = pricePerWeek(a) * Number(f.priceFilter.durationWeeks);
        if (total < Number(f.priceFilter.minPrice) || total > Number(f.priceFilter.maxPrice)) return false;
      }
      return true;
    });
    list = sortBy(list, body.sortBy === "price" ? undefined : body.sortBy || "name", body.sortDirection);
    const page = paginate(list.map(toAccommodationResponse), body);
    return json(page);
  }),

  http.get(`${API}/admin/accommodations/:id`, ({ params }) => {
    const row = db.get("accommodations", params.id);
    return row ? json(toAccommodationResponse(row)) : notFound("Accommodation not found");
  }),

  http.post(`${API}/admin/accommodations`, async ({ request }) => {
    const body = await readJson(request);
    const row = fromPayload(body, {
      id: newId("stay"),
      images: [],
      simplePrices: [],
      flexibleDurationPrices: [],
      fixedDurationPrices: [],
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    db.insert("accommodations", row);
    return json(toAccommodationResponse(row), { status: 201 });
  }),

  http.put(`${API}/admin/accommodations/:id`, async ({ params, request }) => {
    const existing = db.get("accommodations", params.id);
    if (!existing) return notFound("Accommodation not found");
    const body = await readJson(request);
    const row = db.update("accommodations", params.id, fromPayload(body, existing));
    return json(toAccommodationResponse(row));
  }),

  http.delete(`${API}/admin/accommodations/:id`, ({ params }) => {
    db.remove("accommodations", params.id);
    db.set(
      "accommodationFees",
      db.all("accommodationFees").filter((f) => f.accommodationId !== params.id)
    );
    db.set(
      "accommodationServices",
      db.all("accommodationServices").filter((s) => s.accommodationId !== params.id)
    );
    return json({ success: true });
  }),

  /* seasonal fees */
  http.get(`${API}/accommodations/:id/fees`, ({ params }) =>
    json(db.filter("accommodationFees", (f) => f.accommodationId === params.id))
  ),
  http.post(`${API}/admin/accommodations/:id/fees`, async ({ params, request }) => {
    const { items = [] } = await readJson(request);
    const created = items.map((item) =>
      db.insert("accommodationFees", { ...item, id: newId("fee"), accommodationId: params.id })
    );
    return json(created, { status: 201 });
  }),
  http.patch(`${API}/admin/accommodations/:id/fees`, async ({ request }) => {
    const { items = [] } = await readJson(request);
    return json(items.map((item) => db.update("accommodationFees", item.id, item)).filter(Boolean));
  }),
  http.delete(`${API}/admin/accommodations/:id/fees`, ({ params }) => {
    db.set(
      "accommodationFees",
      db.all("accommodationFees").filter((f) => f.accommodationId !== params.id)
    );
    return json({ success: true });
  }),

  /* mandatory services (e.g. final cleaning) */
  http.get(`${API}/admin/accommodations/:id/services`, ({ params }) =>
    json(db.filter("accommodationServices", (s) => s.accommodationId === params.id))
  ),
  http.post(`${API}/admin/accommodations/:id/services`, async ({ params, request }) => {
    const { items = [] } = await readJson(request);
    const created = items.map((item) =>
      db.insert("accommodationServices", { ...item, id: newId("asvc"), accommodationId: params.id })
    );
    return json(created, { status: 201 });
  }),
  http.patch(`${API}/admin/accommodations/:id/services`, async ({ request }) => {
    const { items = [] } = await readJson(request);
    return json(items.map((item) => db.update("accommodationServices", item.id, item)).filter(Boolean));
  }),
  http.delete(`${API}/admin/accommodations/:id/services`, async ({ request }) => {
    const { ids = [] } = await readJson(request);
    ids.forEach((id) => db.remove("accommodationServices", id));
    return json({ success: true });
  }),
];
