// Mock API for extras (services) and their assignment to programmes (course services).
import { http } from "msw";
import catalogSeed from "demo/seed/catalog.json";
import { db } from "../db";
import { API, json, notFound, readJson, newId, nowIso, paginate, includesText, sortBy, demoImage } from "../utils";

const CREATED_AT = "2026-01-15T09:00:00.000Z";

// Seed service types mapped to the admin's extra types.
const TYPE_BY_ID = {
  "svc-laptop": "equipment",
  "svc-equipment": "equipment",
  "svc-career": "coaching",
  "svc-video": "coaching",
};

const COVER_BY_ID = {
  "svc-transfer": "city-lisbon",
  "svc-laptop": "tech-classroom",
  "svc-equipment": "sport-surf",
  "svc-career": "tech-campus",
  "svc-video": "sport-football-2",
  "svc-exam": "tech-cyber",
};

// Extras the admin offers on top of the app seed.
const EXTRA_SERVICES = [
  {
    id: "svc-exam",
    type: "exam",
    name: "Certification exam",
    description: "An industry certification exam voucher, booked for the final week of the programme.",
    mandatory: false,
    price: 180,
    period: "course",
    programmeTypes: ["cybersecurity", "dataScience"],
  },
];

const durationPrice = (id, service) => ({
  id: `${id}__dp`,
  minWeeks: 1,
  maxWeeks: 52,
  price: service.price,
  mode: service.period === "week" ? "PER_WEEK" : "FIXED",
});

export function seed({ catalog }) {
  const all = [...catalog.services, ...EXTRA_SERVICES];
  const services = all.map((s) => ({
    id: s.id,
    type: TYPE_BY_ID[s.id] || s.type,
    name: s.name,
    isActive: true,
    currency: "EUR",
    description: `<p>${s.description}</p>`,
    coverImageUrl: COVER_BY_ID[s.id] ? demoImage(COVER_BY_ID[s.id]) : null,
    highlight: s.description,
    includedItems: [],
    complementaryInfo: null,
    warningNote: null,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }));

  // Same rule as the app: common extras for every programme, plus the programme category's.
  const courseServices = [];
  catalog.programmes.forEach((programme) => {
    all.forEach((s) => {
      const matches = s.programmeTypes
        ? s.programmeTypes.includes(programme.programType)
        : !s.category || s.category === programme.category;
      if (!matches) return;
      const id = `${programme.id}__${s.id}`;
      courseServices.push({
        id,
        courseId: programme.id,
        serviceId: s.id,
        isMandatory: Boolean(s.mandatory),
        price: s.price,
        period: s.period,
        durationPrices: [durationPrice(id, s)],
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
      });
    });
  });

  return { services, courseServices };
}

/* ---- response shaping ----------------------------------------------------- */

function courseRef(courseId) {
  const course = db.get("courses", courseId);
  const seedRow = catalogSeed.programmes.find((p) => p.id === courseId);
  return { id: courseId, name: course?.name || seedRow?.name || courseId };
}

function withService(cs) {
  const service = db.get("services", cs.serviceId);
  return { ...cs, course: courseRef(cs.courseId), service };
}

function courseServicesFor(serviceId) {
  return db.filter("courseServices", (cs) => cs.serviceId === serviceId).map(withService);
}

function toServiceResponse(service) {
  const courseServices = courseServicesFor(service.id);
  return { ...service, courseServices, courseCount: courseServices.length };
}

function normaliseDurationPrices(list = [], courseServiceId) {
  return list.map((dp, i) => ({
    id: dp.id ? String(dp.id) : `${courseServiceId}__dp${i}-${Date.now()}`,
    minWeeks: Number(dp.minWeeks) || 1,
    maxWeeks: Number(dp.maxWeeks) || 52,
    price: Number(dp.price) || 0,
    mode: dp.mode || "PER_WEEK",
  }));
}

function createCourseService(item) {
  const existing = db.find(
    "courseServices",
    (cs) => cs.courseId === item.courseId && cs.serviceId === item.serviceId
  );
  if (existing) db.remove("courseServices", existing.id);
  const id = newId("cs");
  const durationPrices = normaliseDurationPrices(item.durationPrices, id);
  const row = {
    id,
    courseId: item.courseId,
    serviceId: item.serviceId,
    isMandatory: Boolean(item.isMandatory),
    price: durationPrices[0]?.price ?? Number(item.price) ?? 0,
    period: durationPrices[0]?.mode === "PER_WEEK" ? "week" : "course",
    durationPrices,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db.insert("courseServices", row);
  return withService(row);
}

function programmesInCountry(countryId) {
  return catalogSeed.programmes.filter((p) => {
    const campus = catalogSeed.campuses.find((c) => c.id === p.campusId);
    const city = catalogSeed.cities.find((c) => c.id === campus?.cityId);
    return city?.countryId === countryId;
  });
}

/* ---- handlers -------------------------------------------------------------- */

export const handlers = [
  http.get(`${API}/admin/services`, () => json(db.all("services").map(toServiceResponse))),

  http.post(`${API}/admin/services/search`, async ({ request }) => {
    const body = await readJson(request);
    const filters = body.filters || body.filter || {};
    let list = db
      .all("services")
      .filter((s) => includesText(`${s.name} ${s.type}`, body.search))
      .filter((s) => !filters.types?.length || filters.types.includes(s.type))
      .filter((s) => filters.isActive === undefined || s.isActive === filters.isActive);
    list = sortBy(list, body.sortBy || "name", body.sortDirection);
    return json(paginate(list.map(toServiceResponse), body));
  }),

  http.get(`${API}/admin/services/:id`, ({ params }) => {
    const service = db.get("services", params.id);
    return service ? json(toServiceResponse(service)) : notFound("Extra not found");
  }),

  http.post(`${API}/admin/services`, async ({ request }) => {
    const body = await readJson(request);
    const row = {
      includedItems: [],
      complementaryInfo: null,
      warningNote: null,
      highlight: null,
      coverImageUrl: null,
      ...body,
      id: newId("svc"),
      currency: "EUR",
      isActive: body.isActive !== false,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    db.insert("services", row);
    return json(toServiceResponse(row), { status: 201 });
  }),

  http.patch(`${API}/admin/services/:id`, async ({ params, request }) => {
    if (!db.get("services", params.id)) return notFound("Extra not found");
    const body = await readJson(request);
    const row = db.update("services", params.id, { ...body, currency: "EUR" });
    return json(toServiceResponse(row));
  }),

  http.delete(`${API}/admin/services/:id`, ({ params }) => {
    db.remove("services", params.id);
    db.set(
      "courseServices",
      db.all("courseServices").filter((cs) => cs.serviceId !== params.id)
    );
    return json({ success: true });
  }),

  /* programme ↔ extra assignment (bulk and per-programme writes live in catalogue.js) */
  http.get(`${API}/admin/courses/:courseId/services`, ({ params }) =>
    json(db.filter("courseServices", (cs) => cs.courseId === params.courseId).map(withService))
  ),

  http.post(`${API}/admin/countries/:countryId/course-services`, async ({ params, request }) => {
    const body = await readJson(request);
    const programmes = programmesInCountry(params.countryId);
    const created = [];
    const skipped = [];
    programmes.forEach((p) => {
      const exists = db.find(
        "courseServices",
        (cs) => cs.courseId === p.id && cs.serviceId === body.serviceId
      );
      if (exists) {
        skipped.push({ courseId: p.id, courseName: p.name, reason: "Already assigned" });
        return;
      }
      if (!body.dryRun) {
        createCourseService({ ...body, courseId: p.id });
      }
      created.push({ courseId: p.id, courseName: p.name });
    });
    return json({
      countryId: params.countryId,
      serviceId: body.serviceId,
      totalCourses: programmes.length,
      // Programmes that already had the extra count as assigned, not as failures.
      successCount: created.length + skipped.length,
      failedCount: 0,
      failures: [],
      createdCount: created.length,
      skippedCount: skipped.length,
      created,
      skipped,
      dryRun: Boolean(body.dryRun),
    });
  }),
];
