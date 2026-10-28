// Mock API for packages, experiences and the package "important information" option lists.
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
  nextMonday,
} from "../utils";
import { toAccommodationResponse } from "./stays";

const CREATED_AT = "2026-01-15T09:00:00.000Z";

const IMPORTANT_INFO = {
  whatToBring: [
    "Laptop with at least 8 GB RAM",
    "Charger and travel adapter",
    "Sports clothes and trainers",
    "Swimwear and sunscreen",
    "Warm layers and gloves",
    "Valid ID or passport",
    "European health insurance card",
  ],
  notAllowed: ["Smoking in the accommodation", "Pets", "Unregistered overnight guests"],
  goodToKnow: [
    "Classes run Monday to Friday",
    "Arrive the day before the start date",
    "Equipment is fitted on the first morning",
    "Free Wi-Fi on campus and in the accommodation",
    "Public transport pass not included",
  ],
};

const isoDay = (day) => `${day}T00:00:00.000Z`;

function packageStartDates(programme) {
  const first = nextMonday(addDays(today(), 30));
  if (programme?.start === "cohort") return Array.from({ length: 4 }, (_, i) => addDays(first, i * 42));
  return Array.from({ length: 6 }, (_, i) => addDays(first, i * 14));
}

const WHAT_TO_BRING_BY_CATEGORY = {
  tech: ["Laptop with at least 8 GB RAM", "Charger and travel adapter", "Valid ID or passport"],
  sport: ["Sports clothes and trainers", "Swimwear and sunscreen", "Valid ID or passport"],
};

export function seed({ catalog }) {
  const experiences = catalog.experiences.map((e) => ({
    id: e.id,
    name: e.name,
    type: e.type,
    isActive: true,
    description: e.description,
    fullDescription: `<p>${e.description}</p>`,
    price: e.price,
    currency: "EUR",
    duration: e.duration,
    location: e.location,
    includedItems: e.included || [],
    videoUrl: null,
    images: [{ id: `${e.id}-img-0`, imageUrl: demoImage(e.image), order: 0 }],
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }));

  const packages = catalog.packages.map((pkg) => {
    const programme = catalog.programmes.find((p) => p.id === pkg.programmeId);
    const dates = packageStartDates(programme).flatMap((startDate, i) =>
      pkg.weeks.map((weeks, j) => ({
        id: `${pkg.id}__d${i}_${weeks}`,
        startDate: isoDay(startDate),
        duration: weeks,
        accommodationDuration: weeks,
        tag: i === 0 && j === 0 ? "Next start" : null,
        color: i === 0 && j === 0 ? "green" : "navy",
      }))
    );
    return {
      id: pkg.id,
      name: pkg.name,
      isActive: true,
      courseId: pkg.programmeId,
      accommodationId: pkg.accommodationId,
      secondaryAccommodationIds: pkg.secondaryAccommodationIds || [],
      description: pkg.description,
      longDescription: `<p>${pkg.description}</p>`,
      includedItems: pkg.included || [],
      notIncludedItems: pkg.notIncluded || [],
      whatToBring: WHAT_TO_BRING_BY_CATEGORY[programme?.category] || [],
      notAllowed: ["Smoking in the accommodation"],
      goodToKnow: ["Arrive the day before the start date"],
      discountType: pkg.discountType,
      discountValue: pkg.discountValue,
      dates,
      images: (pkg.images || [pkg.image]).map((key, order) => ({
        id: `${pkg.id}-img-${order}`,
        imageUrl: demoImage(key),
        type: "main",
        order,
      })),
      serviceIds: pkg.serviceIds || [],
      experienceIds: pkg.experienceIds || [],
      currency: "EUR",
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    };
  });

  const packageImportantInfoOptions = Object.entries(IMPORTANT_INFO).flatMap(([category, texts]) =>
    texts.map((text, i) => ({ id: `pio-${category}-${i}`, category, text }))
  );

  return { experiences, packages, packageImportantInfoOptions };
}

/* ---- related records (other domains first, shared seed as fallback) -------- */

function campusRef(campusId) {
  const row = db.get("campuses", campusId);
  const seedRow = catalogSeed.campuses.find((c) => c.id === campusId);
  if (!row && !seedRow) return null;
  const schoolId = row?.schoolId || row?.school?.id || seedRow?.providerId;
  const school = db.get("schools", schoolId) || catalogSeed.providers.find((p) => p.id === schoolId);
  const cityId = row?.cityId || row?.city?.id || seedRow?.cityId;
  const city = db.get("cities", cityId) || catalogSeed.cities.find((c) => c.id === cityId);
  const countryId = city?.countryId || city?.country?.id;
  const country = db.get("countries", countryId) || catalogSeed.countries.find((c) => c.id === countryId);
  return {
    id: campusId,
    name: row?.name || seedRow?.name,
    schoolId,
    school: school ? { id: school.id, name: school.name } : null,
    cityId,
    city: city ? { id: city.id, name: city.name } : null,
    country: country ? { id: country.id, name: country.name } : null,
  };
}

function courseRef(courseId) {
  const row = db.get("courses", courseId);
  const seedRow = catalogSeed.programmes.find((p) => p.id === courseId);
  if (!row && !seedRow) return null;
  const campusId = row?.campusId || row?.campus?.id || seedRow?.campusId;
  const courseServices = db
    .filter("courseServices", (cs) => cs.courseId === courseId)
    .map((cs) => ({ ...cs, service: db.get("services", cs.serviceId) }))
    .filter((cs) => cs.service);
  return {
    id: courseId,
    name: row?.name || seedRow?.name,
    campusId,
    campus: campusRef(campusId),
    pricePerWeek: row?.pricePerWeek ?? seedRow?.pricePerWeek ?? 0,
    courseServices,
  };
}

function servicePrice(courseId, serviceId, weeks) {
  const cs = db.find("courseServices", (row) => row.courseId === courseId && row.serviceId === serviceId);
  const dp = cs?.durationPrices?.find((p) => weeks >= p.minWeeks && weeks <= p.maxWeeks) || cs?.durationPrices?.[0];
  if (dp) return dp.mode === "PER_WEEK" ? dp.price * weeks : dp.price;
  const seedService = catalogSeed.services.find((s) => s.id === serviceId);
  if (!seedService) return 0;
  return seedService.period === "week" ? seedService.price * weeks : seedService.price;
}

function accommodationPerWeek(accommodationId) {
  const acc = db.get("accommodations", accommodationId);
  if (acc?.simplePrices?.length) return Number(acc.simplePrices[0].price) || 0;
  return catalogSeed.accommodations.find((a) => a.id === accommodationId)?.pricePerWeek || 0;
}

// Same formula as the app's package quote: tuition + stay + mandatory and chosen extras + experiences.
function quote(pkg) {
  const weeks = Number(pkg.dates?.[0]?.duration) || 1;
  const course = courseRef(pkg.courseId);
  const courseBase = Math.round((course?.pricePerWeek || 0) * weeks);
  const accommodationTotal = pkg.accommodationId ? accommodationPerWeek(pkg.accommodationId) * weeks : 0;
  const mandatory = (course?.courseServices || [])
    .filter((cs) => cs.isMandatory)
    .reduce((sum, cs) => sum + servicePrice(pkg.courseId, cs.serviceId, weeks), 0);
  const optional = (pkg.serviceIds || []).reduce(
    (sum, sid) => sum + servicePrice(pkg.courseId, sid, weeks),
    0
  );
  const experiencesTotal = (pkg.experienceIds || []).reduce(
    (sum, eid) => sum + (Number(db.get("experiences", eid)?.price) || 0),
    0
  );
  const travelBase = courseBase + accommodationTotal + mandatory + optional + experiencesTotal;
  const value = Number(pkg.discountValue) || 0;
  const discountAmount = pkg.discountType === "percent" ? Math.round((travelBase * value) / 100) : value;
  return { travelBase, discountAmount, travelTotal: Math.max(0, travelBase - discountAmount) };
}

function toPackageResponse(pkg) {
  const accommodation = pkg.accommodationId
    ? toAccommodationResponse(db.get("accommodations", pkg.accommodationId))
    : null;
  return {
    ...pkg,
    course: courseRef(pkg.courseId),
    accommodation,
    secondaryAccommodations: (pkg.secondaryAccommodationIds || []).map((accommodationId, order) => ({
      id: `${pkg.id}__acc_${accommodationId}`,
      accommodationId,
      accommodation: toAccommodationResponse(db.get("accommodations", accommodationId)),
      order,
    })),
    services: (pkg.serviceIds || [])
      .map((id) => db.get("services", id))
      .filter(Boolean)
      .map((service) => ({ id: service.id, serviceId: service.id, service })),
    experiences: (pkg.experienceIds || [])
      .map((id, order) => ({ id, order, experience: db.get("experiences", id) }))
      .filter((row) => row.experience)
      .map((row) => ({ id: `${pkg.id}__exp_${row.id}`, experienceId: row.id, order: row.order, experience: row.experience })),
    ...quote(pkg),
  };
}

function fromPackagePayload(body, existing = {}) {
  const row = { ...existing };
  [
    "name",
    "isActive",
    "courseId",
    "description",
    "longDescription",
    "includedItems",
    "notIncludedItems",
    "whatToBring",
    "notAllowed",
    "goodToKnow",
    "accommodationId",
    "discountValue",
    "discountType",
  ].forEach((key) => {
    if (body[key] !== undefined) row[key] = body[key];
  });
  if (body.discountValue === undefined && existing.id && body.courseId !== undefined) {
    // The editor omits the discount when it was cleared.
    row.discountValue = null;
    row.discountType = null;
  }
  if (body.secondaryAccommodationIds !== undefined)
    row.secondaryAccommodationIds = body.secondaryAccommodationIds || [];
  if (body.serviceIds !== undefined) row.serviceIds = body.serviceIds || [];
  if (Array.isArray(body.dates)) {
    row.dates = body.dates.map((d, i) => ({
      id: d.id || `${row.id}__d${i}-${Date.now()}`,
      startDate: d.startDate,
      duration: Number(d.duration),
      accommodationDuration: d.accommodationDuration ?? Number(d.duration),
      tag: d.tag || null,
      color: d.color || "navy",
    }));
  }
  if (Array.isArray(body.images)) {
    row.images = body.images.map((img, order) => ({
      id: img.id || `${row.id}-img-${order}-${Date.now()}`,
      imageUrl: img.imageUrl,
      type: img.type || "main",
      order: img.order ?? order,
    }));
  }
  return row;
}

/* ---- handlers -------------------------------------------------------------- */

export const handlers = [
  /* packages */
  http.post(`${API}/admin/packages/search`, async ({ request }) => {
    const body = await readJson(request);
    const filters = body.filters || body.filter || {};
    let list = db.all("packages").filter((p) => {
      const course = courseRef(p.courseId);
      if (!includesText(`${p.name} ${course?.name || ""} ${course?.campus?.city?.name || ""}`, body.search))
        return false;
      if (filters.isActive !== undefined && p.isActive !== filters.isActive) return false;
      if (filters.courseIds?.length && !filters.courseIds.includes(p.courseId)) return false;
      return true;
    });
    list = sortBy(list, body.sortBy || "createdAt", body.sortDirection || "desc");
    return json(paginate(list.map(toPackageResponse), body));
  }),

  http.get(`${API}/admin/packages/:id`, ({ params }) => {
    const pkg = db.get("packages", params.id);
    return pkg ? json(toPackageResponse(pkg)) : notFound("Package not found");
  }),

  http.post(`${API}/admin/packages`, async ({ request }) => {
    const body = await readJson(request);
    const id = newId("pkg");
    const row = fromPackagePayload(body, {
      id,
      isActive: true,
      dates: [],
      images: [],
      serviceIds: [],
      experienceIds: [],
      secondaryAccommodationIds: [],
      includedItems: [],
      notIncludedItems: [],
      whatToBring: [],
      notAllowed: [],
      goodToKnow: [],
      currency: "EUR",
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    db.insert("packages", row);
    return json(toPackageResponse(row), { status: 201 });
  }),

  http.put(`${API}/admin/packages/:id`, async ({ params, request }) => {
    const existing = db.get("packages", params.id);
    if (!existing) return notFound("Package not found");
    const body = await readJson(request);
    const row = db.update("packages", params.id, fromPackagePayload(body, existing));
    return json(toPackageResponse(row));
  }),

  http.put(`${API}/admin/packages/:id/experiences`, async ({ params, request }) => {
    if (!db.get("packages", params.id)) return notFound("Package not found");
    const body = await readJson(request);
    const ids =
      body.experienceIds ||
      (body.experiences || body.items || []).map((e) => e.experienceId || e.id).filter(Boolean);
    const row = db.update("packages", params.id, { experienceIds: ids });
    return json(toPackageResponse(row));
  }),

  http.delete(`${API}/admin/packages/:id`, ({ params }) => {
    db.remove("packages", params.id);
    return json({ success: true });
  }),

  /* experiences */
  http.post(`${API}/admin/experiences/search`, async ({ request }) => {
    const body = await readJson(request);
    let list = db
      .all("experiences")
      .filter((e) => includesText(`${e.name} ${e.location || ""}`, body.search))
      .filter((e) => body.type === undefined || body.type === "" || e.type === body.type)
      .filter((e) => body.isActive === undefined || e.isActive === body.isActive);
    list = sortBy(list, "name");
    return json(paginate(list, body));
  }),

  http.get(`${API}/admin/experiences/:id`, ({ params }) => {
    const row = db.get("experiences", params.id);
    return row ? json(row) : notFound("Experience not found");
  }),

  http.post(`${API}/admin/experiences`, async ({ request }) => {
    const body = await readJson(request);
    const id = newId("exp");
    const row = {
      includedItems: [],
      price: null,
      currency: null,
      ...body,
      id,
      images: (body.images || []).map((img, order) => ({ id: `${id}-img-${order}`, order, ...img })),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.insert("experiences", row);
    return json(row, { status: 201 });
  }),

  http.patch(`${API}/admin/experiences/:id`, async ({ params, request }) => {
    if (!db.get("experiences", params.id)) return notFound("Experience not found");
    const body = await readJson(request);
    if (Array.isArray(body.images)) {
      body.images = body.images.map((img, order) => ({
        id: img.id || `${params.id}-img-${order}-${Date.now()}`,
        order,
        ...img,
      }));
    }
    return json(db.update("experiences", params.id, body));
  }),

  http.delete(`${API}/admin/experiences/:id`, ({ params }) => {
    db.remove("experiences", params.id);
    db.all("packages")
      .filter((p) => (p.experienceIds || []).includes(params.id))
      .forEach((p) =>
        db.update("packages", p.id, { experienceIds: p.experienceIds.filter((id) => id !== params.id) })
      );
    return json({ success: true });
  }),

  /* package important-information option lists */
  http.get(`${API}/admin/package-important-info-options`, ({ request }) => {
    const url = new URL(request.url);
    const category = url.searchParams.get("category");
    const search = url.searchParams.get("search");
    const list = db
      .all("packageImportantInfoOptions")
      .filter((o) => !category || o.category === category)
      .filter((o) => includesText(o.text, search));
    return json(list);
  }),

  http.post(`${API}/admin/package-important-info-options`, async ({ request }) => {
    const { category, text } = await readJson(request);
    const row = { id: newId("pio"), category, text };
    db.insert("packageImportantInfoOptions", row);
    return json(row, { status: 201 });
  }),
];
