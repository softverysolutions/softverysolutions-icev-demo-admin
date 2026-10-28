// Mock API for discounts (provider-funded price reductions on programmes) and promo codes.
import { http } from "msw";
import catalog from "demo/seed/catalog.json";
import { db } from "../db";
import { mediaUrl } from "../media";
import {
  API,
  json,
  notFound,
  badRequest,
  readJson,
  newId,
  nowIso,
  paginate,
  includesText,
  sortBy,
  demoImage,
  daysAgoIso,
} from "../utils";

const NEVER_EXPIRES = { start: "1970-01-01T00:00:00.000Z", end: "2099-12-31T23:59:59.999Z" };

const isoInDays = (days, endOfDay = false) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  if (endOfDay) d.setUTCHours(23, 59, 59, 999);
  else d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
};

const TEAM = {
  mara: { id: "team-mara", firstName: "Mara", lastName: "Keller", email: "mara.keller@softvery.example" },
  jonas: { id: "team-jonas", firstName: "Jonas", lastName: "Weber", email: "jonas.weber@softvery.example" },
};

// `live` reads the current programme name from the database; the seed itself must not
// (the database is being built at that point).
const programmeName = (id, live = true) => {
  const fromDb = live ? db.get("courses", id) : null;
  if (fromDb?.name) return fromDb.name;
  const seed = catalog.programmes.find((p) => p.id === id);
  if (!seed) return id;
  const campus = catalog.campuses.find((c) => c.id === seed.campusId);
  const city = campus && catalog.cities.find((c) => c.id === campus.cityId);
  return city ? `${seed.name} (${city.name})` : seed.name;
};

const courseLinks = (courseIds = [], live = true) =>
  courseIds.map((courseId) => ({
    courseId,
    course: { id: courseId, name: programmeName(courseId, live) },
  }));

/* ---- seed --------------------------------------------------------------------- */

const DISCOUNTS = [
  {
    id: "disc-tech-early-bird",
    title: "Tech early bird −10%",
    description: "Book a tech bootcamp at least six weeks before the cohort starts.",
    image: "tech-classroom",
    type: "percent",
    value: 10,
    tuition: true,
    window: [-30, 120],
    travel: [30, 240],
    programmes: ["web-dev-berlin", "data-science-ai-amsterdam", "ux-ui-sprint-barcelona", "mobile-dev-valencia"],
  },
  {
    id: "disc-sport-season",
    title: "Sport season deal −10%",
    description: "Spring and winter-season camps for football, fitness and ski.",
    image: "sport-football",
    type: "percent",
    value: 10,
    tuition: true,
    window: [-14, 90],
    travel: [7, 200],
    programmes: ["football-camp-valencia", "fitness-instructor-barcelona", "ski-camp-innsbruck"],
  },
  {
    id: "disc-surf-swell",
    title: "Surf swell week −15%",
    description: "Ericeira surf camp: 15% off the weekly price.",
    image: "sport-surf",
    type: "percent",
    value: 15,
    tuition: true,
    window: [-7, 60],
    travel: [0, 180],
    programmes: ["surf-camp-ericeira"],
  },
  {
    id: "disc-analytics-launch",
    title: "Data analytics launch −15%",
    description: "Introductory price for the new short analytics course in Amsterdam.",
    image: "tech-datascience",
    type: "percent",
    value: 15,
    tuition: true,
    window: [-20, 45],
    travel: [14, 150],
    programmes: ["data-analytics-amsterdam"],
  },
  {
    id: "disc-ski-launch-2026",
    title: "Ski opening weekend €100 off",
    description: "Last season's opening offer for ski and snowboard camps.",
    image: "sport-ski",
    type: "fixed",
    value: 100,
    tuition: true,
    status: "inactive",
    window: [-260, -170],
    travel: [-240, -150],
    programmes: ["ski-camp-innsbruck", "snowboard-camp-innsbruck"],
  },
];

const PROMO_CODES = [
  {
    code: "BERLIN10",
    description: "10% off any programme or package booked in the app (booth code).",
    discountType: "percent",
    discountValue: 10,
    applyingScope: "TUITION_ONLY",
    totalUsageLimit: 500,
    perUserLimit: 1,
    usageCount: 37,
    start: -45,
    end: 120,
    createdBy: TEAM.mara,
    createdDaysAgo: 45,
  },
  {
    code: "SURFUP15",
    description: "15% off the Ericeira surf camps.",
    discountType: "percent",
    discountValue: 15,
    applyingScope: "TUITION_ONLY",
    totalUsageLimit: 100,
    perUserLimit: 1,
    usageCount: 22,
    start: -20,
    end: 70,
    rule: { countryIds: ["pt"], courseIds: ["surf-camp-ericeira", "surf-coaching-ericeira"] },
    createdBy: TEAM.jonas,
    createdDaysAgo: 20,
  },
  {
    code: "CODECAMP50",
    description: "€50 off tech bootcamps and their mandatory fees.",
    discountType: "fixed",
    discountValue: 50,
    applyingScope: "TUITION_AND_MANDATORY",
    totalUsageLimit: 200,
    perUserLimit: 1,
    usageCount: 64,
    start: -60,
    end: 30,
    rule: { minDurationWeeks: 8 },
    createdBy: TEAM.mara,
    createdDaysAgo: 60,
  },
  {
    code: "STAYLONGER",
    description: "10% off accommodation for stays booked with a programme.",
    discountType: "percent",
    discountValue: 10,
    applyingScope: "ACCOMMODATION",
    totalUsageLimit: null,
    perUserLimit: 2,
    usageCount: 18,
    start: -30,
    end: 90,
    createdBy: TEAM.jonas,
    createdDaysAgo: 30,
  },
  {
    code: "SNOW2026",
    description: "Last winter's ski launch code.",
    discountType: "percent",
    discountValue: 12,
    applyingScope: "TUITION_ONLY",
    totalUsageLimit: 80,
    perUserLimit: 1,
    usageCount: 80,
    start: -260,
    end: -170,
    rule: { countryIds: ["at"] },
    createdBy: TEAM.mara,
    createdDaysAgo: 265,
  },
  {
    code: "TEAMDEMO",
    description: "Internal test code (paused).",
    discountType: "percent",
    discountValue: 100,
    applyingScope: "TUITION_ONLY",
    status: "inactive",
    totalUsageLimit: 5,
    perUserLimit: 1,
    usageCount: 2,
    start: -10,
    end: 50,
    createdBy: TEAM.jonas,
    createdDaysAgo: 10,
  },
];

const emptyRule = () => ({
  countryIds: [],
  campusIds: [],
  courseIds: [],
  accommodationIds: [],
  serviceIds: [],
  minDurationWeeks: null,
  maxDurationWeeks: null,
});

export function seed() {
  const discounts = DISCOUNTS.map((d) => ({
    id: d.id,
    title: d.title,
    description: d.description,
    image: demoImage(d.image),
    type: d.type,
    value: d.value,
    tuition: d.tuition,
    status: d.status || "active",
    startDay: isoInDays(d.window[0]),
    endDay: isoInDays(d.window[1], true),
    eligibleTravelStartDay: isoInDays(d.travel[0]),
    eligibleTravelEndDay: isoInDays(d.travel[1]),
    courseIds: d.programmes,
    courses: courseLinks(d.programmes, false),
    currency: "EUR",
    createdAt: daysAgoIso(40),
    updatedAt: daysAgoIso(10),
  }));

  const promoCodes = PROMO_CODES.map((p, i) => ({
    id: `promo-${p.code.toLowerCase()}`,
    code: p.code,
    description: p.description,
    status: p.status || "active",
    discountType: p.discountType,
    discountValue: p.discountValue,
    applyingScope: p.applyingScope,
    combinableWithSchoolDiscount: i % 2 === 0,
    totalUsageLimit: p.totalUsageLimit,
    perUserLimit: p.perUserLimit,
    usageCount: p.usageCount,
    startDate: isoInDays(p.start),
    endDate: isoInDays(p.end, true),
    eligibilityRule: { ...emptyRule(), ...(p.rule || {}) },
    assignedUserId: null,
    assignedUserEmail: null,
    currency: "EUR",
    createdBy: p.createdBy,
    createdAt: daysAgoIso(p.createdDaysAgo),
    updatedAt: daysAgoIso(Math.max(1, p.createdDaysAgo - 3)),
  }));

  return {
    discounts,
    promoCodes,
    newUserPromoConfig: {
      isEnabled: true,
      discountValue: 5,
      expiryHours: 72,
      combinableWithSchoolDiscount: false,
    },
  };
}

/* ---- helpers --------------------------------------------------------------------- */

const isExpired = (promo) => promo.endDate && new Date(promo.endDate) < new Date();

const operator = (request) => {
  const uid = (request.headers.get("Authorization") || "").split("demo-token.")[1];
  const user = uid && db.get("users", uid);
  return user
    ? { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email }
    : TEAM.mara;
};

function normaliseDiscount(body, existing = {}) {
  const next = { ...body };
  if (Array.isArray(body.courseIds)) next.courses = courseLinks(body.courseIds);
  if (next.startDay === undefined && !existing.startDay) next.startDay = NEVER_EXPIRES.start;
  if (next.endDay === undefined && !existing.endDay) next.endDay = NEVER_EXPIRES.end;
  return next;
}

function validatePromo(body, id) {
  const code = String(body.code || "").trim().toUpperCase();
  if (!code) return "Code is required";
  const clash = db.find("promoCodes", (p) => p.code.toUpperCase() === code && p.id !== id);
  return clash ? `Promo code ${code} already exists` : null;
}

/* ---- handlers --------------------------------------------------------------------- */

export const handlers = [
  // Discounts
  http.get(`${API}/admin/discounts/active`, () => {
    const now = new Date();
    return json(
      db.filter(
        "discounts",
        (d) => d.status === "active" && new Date(d.startDay) <= now && new Date(d.endDay) >= now
      )
    );
  }),
  http.post(`${API}/admin/discounts/:id/image/upload`, async ({ params, request }) => {
    const { contentType } = await readJson(request);
    if (!db.get("discounts", params.id)) return notFound("Discount not found");
    const key = `discounts/${params.id}/${Date.now()}.${String(contentType || "image/jpeg").split("/")[1] || "jpg"}`;
    const url = mediaUrl(key);
    return json({ url, uploadUrl: url, publicUrl: url, key, bucket: "demo-media" });
  }),
  http.get(`${API}/admin/discounts`, ({ request }) => {
    const params = new URL(request.url).searchParams;
    const status = params.get("status");
    const type = params.get("type");
    const list = sortBy(db.all("discounts"), "createdAt", "desc").filter(
      (d) => (!status || d.status === status) && (!type || d.type === type)
    );
    return json(list);
  }),
  http.get(`${API}/admin/discounts/:id`, ({ params }) => {
    const discount = db.get("discounts", params.id);
    return discount ? json(discount) : notFound("Discount not found");
  }),
  http.post(`${API}/admin/discounts`, async ({ request }) => {
    const body = await readJson(request);
    const created = db.insert("discounts", {
      id: newId("disc"),
      status: "active",
      image: null,
      currency: "EUR",
      ...normaliseDiscount(body),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return json(created, { status: 201 });
  }),
  http.put(`${API}/admin/discounts/:id`, async ({ params, request }) => {
    const existing = db.get("discounts", params.id);
    if (!existing) return notFound("Discount not found");
    const body = await readJson(request);
    return json(db.update("discounts", params.id, normaliseDiscount(body, existing)));
  }),
  http.delete(`${API}/admin/discounts/:id`, ({ params }) =>
    db.remove("discounts", params.id) ? json({ success: true }) : notFound("Discount not found")
  ),

  // Promo codes
  http.get(`${API}/admin/promo-codes/new-user-promo-config`, () =>
    json(db.getValue("newUserPromoConfig"))
  ),
  http.put(`${API}/admin/promo-codes/new-user-promo-config`, async ({ request }) => {
    const next = { ...db.getValue("newUserPromoConfig", {}), ...(await readJson(request)) };
    db.setValue("newUserPromoConfig", next);
    return json(next);
  }),
  http.post(`${API}/admin/promo-codes/search`, async ({ request }) => {
    const body = await readJson(request);
    const status = body.filter?.status;
    let list = db
      .all("promoCodes")
      .filter((p) => includesText(p.code, body.search) || includesText(p.description, body.search))
      .filter((p) => {
        if (!status || status === "all") return true;
        if (status === "expired") return isExpired(p);
        if (status === "active") return p.status === "active" && !isExpired(p);
        return p.status === status;
      });
    list = sortBy(list, body.sortBy || "code", body.sortDirection);
    return json(paginate(list, { page: body.page, limit: body.limit }));
  }),
  http.get(`${API}/admin/promo-codes/:id`, ({ params }) => {
    const promo = db.get("promoCodes", params.id);
    return promo ? json(promo) : notFound("Promo code not found");
  }),
  http.post(`${API}/admin/promo-codes`, async ({ request }) => {
    const body = await readJson(request);
    const error = validatePromo(body);
    if (error) return badRequest(error);
    const created = db.insert("promoCodes", {
      id: newId("promo"),
      ...body,
      code: String(body.code).trim().toUpperCase(),
      eligibilityRule: { ...emptyRule(), ...(body.eligibilityRule || {}) },
      usageCount: 0,
      currency: "EUR",
      createdBy: operator(request),
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return json(created, { status: 201 });
  }),
  http.put(`${API}/admin/promo-codes/:id`, async ({ params, request }) => {
    const existing = db.get("promoCodes", params.id);
    if (!existing) return notFound("Promo code not found");
    const body = await readJson(request);
    if (body.code !== undefined) {
      const error = validatePromo(body, params.id);
      if (error) return badRequest(error);
      body.code = String(body.code).trim().toUpperCase();
    }
    return json(db.update("promoCodes", params.id, body));
  }),
  http.delete(`${API}/admin/promo-codes/:id`, ({ params }) =>
    db.remove("promoCodes", params.id) ? json({ success: true }) : notFound("Promo code not found")
  ),
];
