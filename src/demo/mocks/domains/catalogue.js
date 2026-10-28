// Mock API for the catalogue screens: providers (schools), locations (campuses), programmes
// (courses) with their price lists, high-season supplements and extras, facilities (amenities),
// provider awards and location FAQs.
import { http } from "msw";
import catalogSeed from "demo/seed/catalog.json";
import { db } from "../db";
import {
  API,
  json,
  notFound,
  noContent,
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

const CREATED_AT = "2026-01-15T09:00:00.000Z";
const CREATED_BY = "team-mara";

const slug = (text) =>
  String(text)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

// Small violet tile with the facility's initial, so the facilities list has an icon offline.
const facilityIcon = (name) => {
  const letter = String(name || "?").trim().charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="16" fill="#F1EDFF"/><text x="32" y="42" font-family="Arial, sans-serif" font-size="28" font-weight="700" text-anchor="middle" fill="#6D4AFF">${letter}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

/* ---- programme details that the shared seed does not carry ---------------- */

const EQUIPMENT = {
  webDevelopment: "Your own laptop (8 GB RAM or more). Laptop rental available as an extra.",
  dataScience: "Laptop with 16 GB RAM; GPU workstations are provided on site.",
  uxUi: "Laptop with Figma installed; drawing tablets available in the studio.",
  cybersecurity: "Laptop able to run virtual machines; lab hardware provided.",
  mobileDevelopment: "Laptop (a Mac for iOS tracks); test devices provided in the device lab.",
  surf: "Board and wetsuit included for all levels.",
  football: "Boots and shin pads; training kit is included.",
  tennis: "Racket (rental available) and court shoes.",
  yogaFitness: "Mat and props provided; bring comfortable training clothes.",
  skiSnowboard: "Skis or board, boots and helmet included; bring your own ski clothing.",
};

const CERTIFICATE = {
  webDevelopment: "Certificate of completion and a reviewed portfolio project",
  dataScience: "Certificate of completion with capstone project",
  uxUi: "Certificate of completion and a case-study portfolio",
  cybersecurity: "Certificate of completion; prepares for an entry-level security exam",
  mobileDevelopment: "Certificate of completion and a published demo app",
  surf: "Surf level certificate (ISA scale)",
  football: "Player development report and certificate of attendance",
  tennis: "Coach's progress report and certificate of attendance",
  yogaFitness: "Certificate of attendance (teacher track: 200 h certificate)",
  skiSnowboard: "Ski school level badge",
};

const SCHEDULE_TIMES = {
  morning: ["09:00", "13:00"],
  afternoon: ["14:00", "18:00"],
  evening: ["18:30", "21:30"],
  fullTime: ["09:00", "17:00"],
};

const timeIso = (hhmm) => `1970-01-01T${hhmm}:00.000Z`;

// Cohorts start every six weeks from the first Monday a month out, as in the app.
const cohortDates = (count = 6) => {
  const first = nextMonday(addDays(today(), 30));
  return Array.from({ length: count }, (_, i) => addDays(first, i * 42));
};

/* ---- lookups into collections other screens own --------------------------- */

const seedCity = (id) => catalogSeed.cities.find((c) => c.id === id);
const seedCountry = (id) => catalogSeed.countries.find((c) => c.id === id);

function cityView(id) {
  const row = db.get("cities", id) || seedCity(id);
  if (!row) return null;
  return { id: row.id, name: row.name, engName: row.engName || row.name, countryId: row.countryId };
}

function countryView(id) {
  const row = db.get("countries", id) || seedCountry(id);
  if (!row) return null;
  return { id: row.id, name: row.name, engName: row.engName || row.name, code: row.code };
}

function serviceView(id) {
  const row = db.get("services", id);
  if (row) return row;
  const seed = catalogSeed.services.find((s) => s.id === id);
  if (!seed) return { id, name: id, type: "other", isActive: true, currency: "EUR" };
  return {
    id: seed.id,
    name: seed.name,
    type: seed.type,
    description: seed.description,
    isActive: true,
    currency: "EUR",
  };
}

/* ---- seed ------------------------------------------------------------------ */

function priceListFor(programme) {
  const [minWeeks, maxWeeks] = programme.weeks;
  const id = `pl-${programme.id}`;
  const fixed = minWeeks === maxWeeks;
  return {
    id,
    courseId: programme.id,
    status: "active",
    startDate: `${addDays(today(), -60)}T00:00:00.000Z`,
    endDate: `${addDays(today(), 400)}T00:00:00.000Z`,
    simplePrices: [],
    fixedDurationPrices: fixed
      ? [
          {
            id: `fx-${programme.id}`,
            coursePriceListId: id,
            durationWeeks: minWeeks,
            totalPrice: programme.pricePerWeek * minWeeks,
          },
        ]
      : [],
    flexibleDurationPrices: fixed
      ? []
      : [
          {
            id: `fl-${programme.id}`,
            coursePriceListId: id,
            minWeeks,
            maxWeeks,
            pricePerWeek: programme.pricePerWeek,
          },
        ],
    fullPaymentDiscount: null,
    createdAt: CREATED_AT,
  };
}

function courseFor(programme) {
  const campus = catalogSeed.campuses.find((c) => c.id === programme.campusId);
  const cohort = programme.start === "cohort";
  const [startTime, endTime] = SCHEDULE_TIMES[programme.schedule] || SCHEDULE_TIMES.fullTime;
  const cohorts = cohortDates();
  return {
    id: programme.id,
    campusId: programme.campusId,
    name: programme.name,
    types: [{ name: programme.category, programTypes: [{ name: programme.programType }] }],
    startMode: cohort ? "manually" : "pattern",
    periodicity: programme.schedule,
    durationUnit: "hours",
    durationType: "perWeek",
    durationCount: programme.hoursPerWeek,
    minAge: 16,
    description: programme.description,
    isActive: true,
    startTime: timeIso(startTime),
    endTime: timeIso(endTime),
    firstStartDate: `${cohort ? cohorts[0] : nextMonday(addDays(today(), 30))}T00:00:00.000Z`,
    bestSeller: Boolean(programme.bestSeller),
    isFeatured: Boolean(programme.featured),
    averageRating: campus?.rating ?? null,
    recommendedLevel: programme.level,
    classSize: campus ? `Up to ${campus.classSize}` : "",
    recommendedFor: programme.recommendedFor || "",
    notRecommendedFor: programme.notRecommendedFor || "",
    workload: programme.hoursPerWeek,
    equipment: EQUIPMENT[programme.programType] || "",
    certificate: CERTIFICATE[programme.programType] || "",
    durationWeeks: programme.weeks,
    courseHighlights: (programme.highlights || []).map((text, i) => ({
      id: `${programme.id}-hl-${i}`,
      text,
    })),
    startPatterns: cohort
      ? []
      : [
          {
            id: `${programme.id}-pattern`,
            patternType: "weekDay",
            repeatEvery: 1,
            weekDays: [{ weekDay: "monday" }],
            monthDays: [],
          },
        ],
    startManuals: cohort
      ? cohorts.map((date, i) => ({ id: `${programme.id}-start-${i}`, startDate: `${date}T00:00:00.000Z` }))
      : [],
    downloadDocuments: [],
    image: demoImage(programme.image),
    createdById: CREATED_BY,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  };
}

function courseServicesFor(programme) {
  return catalogSeed.services
    .filter((s) => !s.category || s.category === programme.category)
    .map((service) => ({
      id: `${programme.id}__${service.id}`,
      courseId: programme.id,
      serviceId: service.id,
      isMandatory: Boolean(service.mandatory),
      price: service.price,
      period: service.period === "week" ? "week" : null,
      durationPrices: [
        {
          id: `${programme.id}__${service.id}__dp`,
          minWeeks: 1,
          maxWeeks: Math.max(...programme.weeks, 4),
          price: service.price,
          mode: service.period === "week" ? "PER_WEEK" : "FIXED",
        },
      ],
    }));
}

// Where participants come from, per location (shown as "Participants from").
const PARTICIPANTS = [
  [
    ["Germany", 22],
    ["Spain", 16],
    ["United States", 12],
    ["France", 10],
    ["Other", 40],
  ],
  [
    ["United Kingdom", 18],
    ["Netherlands", 15],
    ["Italy", 14],
    ["Poland", 11],
    ["Other", 42],
  ],
  [
    ["Portugal", 20],
    ["Germany", 17],
    ["Sweden", 12],
    ["Canada", 9],
    ["Other", 42],
  ],
];

const LOCATION_FAQS = (campus, provider) => [
  {
    question: "What should I bring on the first day?",
    answer:
      provider.type === "tech"
        ? "Your laptop and charger, a valid ID and your booking confirmation."
        : "Training clothes, sun protection and your booking confirmation. Equipment is ready on site.",
  },
  {
    question: "What time does the first day start?",
    answer: `Check-in opens at 08:30 at ${campus.address}. A welcome session starts at 09:00.`,
  },
  {
    question: "Can I change my start date?",
    answer: "Yes, free of charge up to 14 days before the start, subject to availability.",
  },
];

export function seed({ catalog }) {
  const providerCountry = (providerId) => {
    const campus = catalog.campuses.find((c) => c.providerId === providerId);
    return campus ? catalog.cities.find((c) => c.id === campus.cityId)?.countryId : "de";
  };

  const facilityNames = [...new Set(catalog.campuses.flatMap((c) => c.amenities))];
  const amenities = facilityNames.map((name) => ({
    id: `fac-${slug(name)}`,
    name,
    iconUrl: facilityIcon(name),
  }));

  const schools = catalog.providers.map((p) => ({
    id: p.id,
    name: p.name,
    logo: demoImage(p.logo),
    schoolType: p.type,
    description: p.description,
    contactEmail: `hello@${p.id}.example`,
    contactPhone: "+49 30 1234 5678",
    isActive: true,
    countryId: providerCountry(p.id),
    createdById: CREATED_BY,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
  }));

  const campuses = catalog.campuses.map((c, index) => {
    const city = catalog.cities.find((x) => x.id === c.cityId);
    const provider = catalog.providers.find((p) => p.id === c.providerId);
    return {
      id: c.id,
      name: c.name,
      address: c.address,
      schoolId: c.providerId,
      cityId: c.cityId,
      countryId: city?.countryId,
      avgStudentsPerClass: c.classSize,
      numberOfStudents: c.students,
      isActive: true,
      website: `https://${c.providerId}.example`,
      videoUrl: "",
      lat: "",
      lon: "",
      currency: "EUR",
      description: `${provider.description} ${city ? `Our ${city.name} location — ${city.subtitle}.` : ""}`.trim(),
      averageRating: c.rating,
      arriveByTime: "08:30",
      arriveByText: "Check in at reception on your first Monday; the welcome session starts at 09:00.",
      whatToBring:
        provider.type === "tech"
          ? "<p>Laptop and charger, ID, booking confirmation.</p>"
          : "<p>Training clothes, sun protection, ID, booking confirmation.</p>",
      highlights: c.amenities.slice(0, 3).map((text, i) => ({ id: `${c.id}-hl-${i}`, text })),
      images: c.images.map((key, i) => ({ id: `${c.id}-img-${i}`, imageUrl: demoImage(key) })),
      nationalities: PARTICIPANTS[index % PARTICIPANTS.length].map(([name, percent], i) => ({
        id: `${c.id}-nat-${i}`,
        name,
        percent,
      })),
      amenityIds: c.amenities.map((name) => `fac-${slug(name)}`),
      createdById: CREATED_BY,
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    };
  });

  const programmes = catalog.programmes;

  return {
    amenities,
    schools,
    campuses,
    courses: programmes.map(courseFor),
    coursePriceLists: programmes.map(priceListFor),
    courseFees: programmes
      .filter((p) => p.category === "sport" && p.start !== "cohort")
      .map((p) => ({
        id: `fee-${p.id}`,
        courseId: p.id,
        startDate: `${new Date().getFullYear() + (new Date().getMonth() > 6 ? 1 : 0)}-07-01T00:00:00.000Z`,
        endDate: `${new Date().getFullYear() + (new Date().getMonth() > 6 ? 1 : 0)}-08-31T00:00:00.000Z`,
        supplementPerWeek: 40,
        active: true,
        createdAt: CREATED_AT,
      })),
    courseServices: programmes.flatMap(courseServicesFor),
    schoolAwards: [
      { id: "award-codeforge", schoolId: "codeforge", imageUrl: demoImage("tech-hackathon"), caption: "Best Coding Bootcamp Berlin 2025" },
      { id: "award-atlantic", schoolId: "atlantic", imageUrl: demoImage("sport-surf"), caption: "Top Surf School Portugal 2025" },
    ],
    campusFaqs: catalog.campuses.flatMap((c) => {
      const provider = catalog.providers.find((p) => p.id === c.providerId);
      return LOCATION_FAQS(c, provider).map((faq, i) => ({
        id: `${c.id}-faq-${i}`,
        campusId: c.id,
        order: i + 1,
        ...faq,
      }));
    }),
  };
}

/* ---- views (API response shapes) ------------------------------------------ */

function schoolView(school, { withAwards = false } = {}) {
  if (!school) return null;
  const view = { ...school };
  if (withAwards) view.awards = db.filter("schoolAwards", (a) => a.schoolId === school.id);
  return view;
}

function campusView(campus) {
  if (!campus) return null;
  const amenities = (campus.amenityIds || [])
    .map((id) => db.get("amenities", id))
    .filter(Boolean)
    .map((a) => ({ id: a.id, amenityId: a.id, name: a.name, iconUrl: a.iconUrl ?? null }));
  const { amenityIds, ...rest } = campus;
  return {
    ...rest,
    school: schoolView(db.get("schools", campus.schoolId)),
    city: cityView(campus.cityId),
    country: countryView(campus.countryId),
    amenities,
    shorts: [],
  };
}

const priceListStatus = (pl) => {
  const now = new Date().toISOString();
  if (pl.endDate && pl.endDate < now) return "expired";
  if (pl.startDate && pl.startDate > now) return "future";
  return "active";
};

function weeklyPrice(priceList) {
  if (!priceList) return null;
  const flex = priceList.flexibleDurationPrices?.[0];
  if (flex) return { perWeek: Number(flex.pricePerWeek) || 0, minWeeks: Number(flex.minWeeks) || 1 };
  const fixed = priceList.fixedDurationPrices?.[0];
  if (fixed) {
    const weeks = Number(fixed.durationWeeks) || 1;
    return { perWeek: (Number(fixed.totalPrice) || 0) / weeks, minWeeks: weeks };
  }
  const simple = priceList.simplePrices?.[0];
  if (simple) {
    const divisor = { week: 1, month: 4, semester: 20, year: 40 }[simple.period] || 1;
    return { perWeek: (Number(simple.price) || 0) / divisor, minWeeks: 1 };
  }
  return null;
}

function courseServicesView(courseId) {
  return db
    .filter("courseServices", (cs) => cs.courseId === courseId)
    .map((cs) => ({ ...cs, service: serviceView(cs.serviceId) }));
}

function courseView(course, { full = true } = {}) {
  if (!course) return null;
  const campus = campusView(db.get("campuses", course.campusId));
  const priceLists = db
    .filter("coursePriceLists", (pl) => pl.courseId === course.id)
    .map((pl) => ({ ...pl, status: priceListStatus(pl) }));
  const currentPriceList = priceLists.find((pl) => pl.status === "active") || priceLists[0] || null;
  const price = weeklyPrice(currentPriceList);
  const services = courseServicesView(course.id);
  const mandatoryPerWeek = services
    .filter((s) => s.isMandatory)
    .reduce((sum, s) => sum + (s.period === "week" ? Number(s.price) || 0 : 0), 0);
  const mandatoryFixed = services
    .filter((s) => s.isMandatory && s.period !== "week")
    .reduce((sum, s) => sum + (Number(s.price) || 0), 0);
  const minWeeks = price?.minWeeks || 1;
  const base = price ? Math.round(price.perWeek * minWeeks) : 0;
  const mandatory = Math.round(mandatoryPerWeek * minWeeks + mandatoryFixed);

  const view = {
    ...course,
    currency: "EUR",
    campus,
    school: campus?.school || null,
    city: campus?.city || null,
    country: campus?.country || null,
    minWeekPrice: price ? Math.round(price.perWeek) : null,
    summary: {
      courseBasePrice: base,
      courseTuitionPrice: base,
      courseTotalPrice: base + mandatory,
      mandatoryServiceTotal: mandatory,
      courseFeesTotal: 0,
      courseMinBasePricePerWeek: price ? Math.round(price.perWeek) : 0,
      courseMinTotalPricePerWeek: price ? Math.round((base + mandatory) / minWeeks) : 0,
      courseMinDurationWeeks: minWeeks,
    },
    currentPriceList,
  };
  if (full) {
    view.priceLists = priceLists;
    view.services = services;
    view.courseServices = services;
    view.fees = db.filter("courseFees", (f) => f.courseId === course.id);
  }
  return view;
}

/* ---- request → record ------------------------------------------------------ */

const withIds = (list, prefix) =>
  (Array.isArray(list) ? list : []).map((item) => ({ id: item.id || newId(prefix), ...item }));

function campusFromBody(body, existing = {}) {
  const { highlights, images, nationalities, amenities, ...rest } = body;
  const record = { ...existing, ...rest, currency: "EUR" };
  if (highlights !== undefined) {
    record.highlights = withIds(
      highlights.map((h) => (typeof h === "string" ? { text: h } : h)),
      "hl"
    );
  }
  if (images !== undefined) record.images = withIds(images, "img");
  if (nationalities !== undefined) record.nationalities = withIds(nationalities, "nat");
  if (amenities !== undefined) {
    record.amenityIds = amenities
      .map((a) => (typeof a === "string" ? a : a.amenityId || a.id))
      .filter(Boolean);
  }
  return record;
}

function courseFromBody(body, existing = {}) {
  const { services, ...rest } = body;
  const record = { ...existing, ...rest };
  record.courseHighlights = withIds(record.courseHighlights, "hl");
  record.startPatterns = withIds(record.startPatterns, "pattern");
  record.startManuals = withIds(record.startManuals, "start");
  return { record, services };
}

function replaceCourseServices(courseId, services) {
  if (!Array.isArray(services)) return;
  const keep = db.filter("courseServices", (cs) => cs.courseId !== courseId);
  const next = services.map((s) => ({
    id: newId("cs"),
    courseId,
    serviceId: s.serviceId,
    isMandatory: Boolean(s.isMandatory),
    price: Number(s.price) || 0,
    period: s.period || null,
    durationPrices: [],
  }));
  db.set("courseServices", [...keep, ...next]);
}

function courseServiceFromItem(item, existing = {}) {
  const durationPrices = withIds(item.durationPrices || existing.durationPrices || [], "dp");
  const first = durationPrices[0];
  return {
    ...existing,
    courseId: item.courseId || existing.courseId,
    serviceId: item.serviceId || existing.serviceId,
    isMandatory: item.isMandatory !== undefined ? Boolean(item.isMandatory) : Boolean(existing.isMandatory),
    durationPrices,
    price: first ? Number(first.price) || 0 : Number(item.price ?? existing.price) || 0,
    period: first ? (first.mode === "PER_WEEK" ? "week" : null) : item.period ?? existing.period ?? null,
  };
}

/* ---- search helpers -------------------------------------------------------- */

const has = (list) => Array.isArray(list) && list.length > 0;

function searchCampuses(body) {
  const f = body.filters || {};
  let rows = db.all("campuses");
  if (has(f.schoolIds)) rows = rows.filter((c) => f.schoolIds.includes(c.schoolId));
  if (has(f.cityIds)) rows = rows.filter((c) => f.cityIds.includes(c.cityId));
  if (has(f.countryIds)) rows = rows.filter((c) => f.countryIds.includes(c.countryId));
  if (has(f.campusIds)) rows = rows.filter((c) => f.campusIds.includes(c.id));
  if (body.search) rows = rows.filter((c) => includesText(`${c.name} ${c.address}`, body.search));
  rows = sortBy(rows, body.sortBy || "name", body.sortDirection);
  return paginate(rows.map(campusView), { page: body.page, limit: body.limit || 100 });
}

function searchCourses(body) {
  const f = body.filters || {};
  const campuses = db.all("campuses");
  const campusById = Object.fromEntries(campuses.map((c) => [c.id, c]));
  let rows = db.all("courses");
  if (has(f.courseIds)) rows = rows.filter((c) => f.courseIds.includes(c.id));
  if (has(f.campusIds)) rows = rows.filter((c) => f.campusIds.includes(c.campusId));
  if (has(f.schoolIds)) rows = rows.filter((c) => f.schoolIds.includes(campusById[c.campusId]?.schoolId));
  if (has(f.cityIds)) rows = rows.filter((c) => f.cityIds.includes(campusById[c.campusId]?.cityId));
  if (has(f.countryIds)) {
    rows = rows.filter((c) => f.countryIds.includes(campusById[c.campusId]?.countryId));
  }
  if (has(f.programTypes)) {
    rows = rows.filter((c) =>
      (c.types || []).some(
        (t) =>
          f.programTypes.includes(t.name) ||
          (t.programTypes || []).some((pt) => f.programTypes.includes(pt.name))
      )
    );
  }
  if (f.bestSeller !== undefined) rows = rows.filter((c) => Boolean(c.bestSeller) === f.bestSeller);
  if (body.search) {
    rows = rows.filter((c) =>
      includesText(`${c.name} ${campusById[c.campusId]?.name || ""}`, body.search)
    );
  }
  let views = rows.map((c) => courseView(c));
  if (f.minPrice !== undefined) views = views.filter((c) => (c.minWeekPrice ?? 0) >= f.minPrice);
  if (f.maxPrice !== undefined) views = views.filter((c) => (c.minWeekPrice ?? 0) <= f.maxPrice);
  const sortField = body.sortBy === "price" ? "minWeekPrice" : body.sortBy || "name";
  views = sortBy(views, sortField, body.sortDirection);
  return paginate(views, { page: body.page, limit: body.limit || 100 });
}

/* ---- handlers -------------------------------------------------------------- */

const removeCourse = (id) => {
  db.remove("courses", id);
  for (const name of ["coursePriceLists", "courseFees", "courseServices"]) {
    db.set(
      name,
      db.filter(name, (row) => row.courseId !== id)
    );
  }
};

const removeCampus = (id) => {
  db.filter("courses", (c) => c.campusId === id).forEach((c) => removeCourse(c.id));
  db.set("campusFaqs", db.filter("campusFaqs", (f) => f.campusId !== id));
  db.remove("campuses", id);
};

export const handlers = [
  /* providers */
  http.post(`${API}/admin/schools/search`, async ({ request }) => {
    const body = await readJson(request);
    const f = body.filters || {};
    let rows = db.all("schools");
    if (has(f.countryIds)) rows = rows.filter((s) => f.countryIds.includes(s.countryId));
    if (has(f.cityIds)) {
      const schoolIds = new Set(
        db.filter("campuses", (c) => f.cityIds.includes(c.cityId)).map((c) => c.schoolId)
      );
      rows = rows.filter((s) => schoolIds.has(s.id));
    }
    if (body.search) rows = rows.filter((s) => includesText(s.name, body.search));
    rows = sortBy(rows, body.sortBy || "name", body.sortDirection);
    return json(paginate(rows.map((s) => schoolView(s)), { page: body.page, limit: body.limit || 100 }));
  }),
  http.get(`${API}/admin/schools/:id`, ({ params }) => {
    const school = db.get("schools", params.id);
    return school ? json(schoolView(school, { withAwards: true })) : notFound("Provider not found");
  }),
  http.post(`${API}/admin/schools`, async ({ request }) => {
    const body = await readJson(request);
    const school = db.insert("schools", {
      ...body,
      id: newId("provider"),
      createdById: CREATED_BY,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return json(schoolView(school), { status: 201 });
  }),
  http.patch(`${API}/admin/schools/:id`, async ({ params, request }) => {
    if (!db.get("schools", params.id)) return notFound("Provider not found");
    return json(schoolView(db.update("schools", params.id, await readJson(request))));
  }),
  http.delete(`${API}/admin/schools/:id`, ({ params }) => {
    db.filter("campuses", (c) => c.schoolId === params.id).forEach((c) => removeCampus(c.id));
    db.set("schoolAwards", db.filter("schoolAwards", (a) => a.schoolId !== params.id));
    db.remove("schools", params.id);
    return noContent();
  }),

  /* provider awards */
  http.get(`${API}/admin/school-awards/school/:schoolId`, ({ params }) =>
    json(db.filter("schoolAwards", (a) => a.schoolId === params.schoolId))
  ),
  http.post(`${API}/admin/school-awards`, async ({ request }) => {
    const body = await readJson(request);
    return json(db.insert("schoolAwards", { ...body, id: newId("award") }), { status: 201 });
  }),
  http.patch(`${API}/admin/school-awards/:id`, async ({ params, request }) => {
    if (!db.get("schoolAwards", params.id)) return notFound("Award not found");
    return json(db.update("schoolAwards", params.id, await readJson(request)));
  }),
  http.delete(`${API}/admin/school-awards/:id`, ({ params }) => {
    db.remove("schoolAwards", params.id);
    return noContent();
  }),

  /* locations */
  http.post(`${API}/admin/campuses/search`, async ({ request }) =>
    json(searchCampuses(await readJson(request)))
  ),
  http.post(`${API}/campuses/search`, async ({ request }) =>
    json(searchCampuses(await readJson(request)))
  ),
  http.get(`${API}/campuses/:id`, ({ params }) => {
    const campus = db.get("campuses", params.id);
    return campus ? json(campusView(campus)) : notFound("Location not found");
  }),
  http.get(`${API}/admin/campuses/:id`, ({ params }) => {
    const campus = db.get("campuses", params.id);
    return campus ? json(campusView(campus)) : notFound("Location not found");
  }),
  http.post(`${API}/admin/campuses`, async ({ request }) => {
    const body = await readJson(request);
    const campus = db.insert("campuses", {
      ...campusFromBody(body),
      id: newId("location"),
      createdById: CREATED_BY,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return json(campusView(campus), { status: 201 });
  }),
  http.put(`${API}/admin/campuses/:id`, async ({ params, request }) => {
    const existing = db.get("campuses", params.id);
    if (!existing) return notFound("Location not found");
    const record = campusFromBody(await readJson(request), existing);
    return json(campusView(db.update("campuses", params.id, record)));
  }),
  http.delete(`${API}/admin/campuses/:id`, ({ params }) => {
    removeCampus(params.id);
    return noContent();
  }),

  /* location FAQs */
  http.get(`${API}/admin/campus-faqs/campus/:campusId`, ({ params }) =>
    json(
      sortBy(
        db.filter("campusFaqs", (f) => f.campusId === params.campusId),
        "order"
      )
    )
  ),
  http.get(`${API}/admin/campus-faqs/:id`, ({ params }) => {
    const faq = db.get("campusFaqs", params.id);
    return faq ? json(faq) : notFound("FAQ not found");
  }),
  http.post(`${API}/admin/campus-faqs`, async ({ request }) => {
    const body = await readJson(request);
    const order =
      body.order ?? db.filter("campusFaqs", (f) => f.campusId === body.campusId).length + 1;
    return json(db.insert("campusFaqs", { ...body, order, id: newId("faq") }), { status: 201 });
  }),
  http.patch(`${API}/admin/campus-faqs/:id`, async ({ params, request }) => {
    if (!db.get("campusFaqs", params.id)) return notFound("FAQ not found");
    return json(db.update("campusFaqs", params.id, await readJson(request)));
  }),
  http.delete(`${API}/admin/campus-faqs/:id`, ({ params }) => {
    db.remove("campusFaqs", params.id);
    return noContent();
  }),

  /* facilities */
  http.get(`${API}/admin/amenities`, () => json(sortBy(db.all("amenities"), "name"))),
  http.get(`${API}/admin/amenities/:id`, ({ params }) => {
    const amenity = db.get("amenities", params.id);
    return amenity ? json(amenity) : notFound("Facility not found");
  }),
  http.post(`${API}/admin/amenities`, async ({ request }) => {
    const body = await readJson(request);
    const amenity = {
      id: newId("fac"),
      name: body.name,
      iconUrl: body.iconUrl || facilityIcon(body.name),
    };
    return json(db.insert("amenities", amenity), { status: 201 });
  }),
  http.patch(`${API}/admin/amenities/:id`, async ({ params, request }) => {
    const existing = db.get("amenities", params.id);
    if (!existing) return notFound("Facility not found");
    const body = await readJson(request);
    return json(
      db.update("amenities", params.id, {
        name: body.name ?? existing.name,
        iconUrl: body.iconUrl || facilityIcon(body.name ?? existing.name),
      })
    );
  }),
  http.delete(`${API}/admin/amenities/:id`, ({ params }) => {
    db.remove("amenities", params.id);
    db.set(
      "campuses",
      db.all("campuses").map((c) => ({
        ...c,
        amenityIds: (c.amenityIds || []).filter((id) => id !== params.id),
      }))
    );
    return noContent();
  }),

  /* programmes: extras linked to a programme (before /admin/courses/:id) */
  http.post(`${API}/admin/courses/services/bulk`, async ({ request }) => {
    const body = await readJson(request);
    const items = body.items || body.courseServices || (Array.isArray(body) ? body : []);
    const created = items.map((item) =>
      db.insert("courseServices", { id: newId("cs"), ...courseServiceFromItem(item) })
    );
    return json(created, { status: 201 });
  }),
  http.put(`${API}/admin/courses/services/bulk`, async ({ request }) => {
    const body = await readJson(request);
    const items = body.items || body.courseServices || (Array.isArray(body) ? body : []);
    const updated = items
      .map((item) => {
        const id = item.courseServiceId || item.id;
        const existing = db.get("courseServices", id);
        return existing ? db.update("courseServices", id, courseServiceFromItem(item, existing)) : null;
      })
      .filter(Boolean);
    return json(updated);
  }),
  http.get(`${API}/admin/courses/services/:serviceId`, ({ params }) => {
    const links = db.filter("courseServices", (cs) => cs.serviceId === params.serviceId);
    return json(
      links.map((cs) => ({ ...cs, course: courseView(db.get("courses", cs.courseId), { full: false }) }))
    );
  }),
  http.post(`${API}/admin/courses/:courseId/services`, async ({ params, request }) => {
    const body = await readJson(request);
    const items = body.items || body.services || (Array.isArray(body) ? body : [body]);
    const created = items.map((item) =>
      db.insert("courseServices", {
        id: newId("cs"),
        ...courseServiceFromItem({ ...item, courseId: params.courseId }),
      })
    );
    return json(created, { status: 201 });
  }),
  http.delete(`${API}/admin/courses/:courseId/services`, async ({ params, request }) => {
    const url = new URL(request.url);
    const body = await readJson(request);
    const ids = [
      ...(body.ids || body.courseServiceIds || []),
      ...url.searchParams.getAll("ids"),
      ...(url.searchParams.get("courseServiceId") ? [url.searchParams.get("courseServiceId")] : []),
      ...(body.courseServiceId ? [body.courseServiceId] : []),
    ];
    db.set(
      "courseServices",
      db.filter(
        "courseServices",
        (cs) => !(cs.courseId === params.courseId && (ids.length === 0 || ids.includes(cs.id)))
      )
    );
    return noContent();
  }),

  /* programme high-season supplements */
  http.get(`${API}/courses/:courseId/fees`, ({ params }) =>
    json(db.filter("courseFees", (f) => f.courseId === params.courseId))
  ),
  http.post(`${API}/admin/courses/:courseId/fees`, async ({ params, request }) => {
    const { items = [] } = await readJson(request);
    const created = items.map((item) =>
      db.insert("courseFees", {
        active: true,
        ...item,
        id: newId("fee"),
        courseId: params.courseId,
        createdAt: nowIso(),
      })
    );
    return json(created, { status: 201 });
  }),
  http.patch(`${API}/admin/courses/:courseId/fees`, async ({ params, request }) => {
    const { items = [] } = await readJson(request);
    const keep = db.filter("courseFees", (f) => f.courseId !== params.courseId);
    const next = items.map((item) => ({
      active: true,
      ...item,
      id: item.id || newId("fee"),
      courseId: params.courseId,
      createdAt: item.createdAt || nowIso(),
    }));
    db.set("courseFees", [...keep, ...next]);
    return json(next);
  }),
  http.delete(`${API}/admin/courses/:courseId/fees`, ({ params }) => {
    db.set("courseFees", db.filter("courseFees", (f) => f.courseId !== params.courseId));
    return noContent();
  }),

  /* programme price lists */
  http.get(`${API}/admin/course-price-lists/course/:courseId`, ({ params }) =>
    json(
      sortBy(
        db
          .filter("coursePriceLists", (pl) => pl.courseId === params.courseId)
          .map((pl) => ({ ...pl, status: priceListStatus(pl) })),
        "startDate"
      )
    )
  ),
  http.post(`${API}/admin/course-price-lists`, async ({ request }) => {
    const body = await readJson(request);
    const id = newId("pl");
    const priceList = {
      simplePrices: [],
      flexibleDurationPrices: [],
      fixedDurationPrices: [],
      fullPaymentDiscount: null,
      ...body,
      id,
      createdAt: nowIso(),
    };
    for (const key of ["simplePrices", "flexibleDurationPrices", "fixedDurationPrices"]) {
      priceList[key] = withIds(priceList[key], key).map((row) => ({ ...row, coursePriceListId: id }));
    }
    priceList.status = priceListStatus(priceList);
    return json(db.insert("coursePriceLists", priceList), { status: 201 });
  }),
  http.patch(`${API}/admin/course-price-lists/:id`, async ({ params, request }) => {
    const existing = db.get("coursePriceLists", params.id);
    if (!existing) return notFound("Price list not found");
    const body = await readJson(request);
    const next = { ...existing, ...body };
    for (const key of ["simplePrices", "flexibleDurationPrices", "fixedDurationPrices"]) {
      next[key] = withIds(next[key], key).map((row) => ({ ...row, coursePriceListId: params.id }));
    }
    next.status = priceListStatus(next);
    return json(db.update("coursePriceLists", params.id, next));
  }),
  http.delete(`${API}/admin/course-price-lists/:id`, ({ params }) => {
    db.remove("coursePriceLists", params.id);
    return noContent();
  }),

  /* programmes */
  http.post(`${API}/admin/courses/search`, async ({ request }) =>
    json(searchCourses(await readJson(request)))
  ),
  http.get(`${API}/admin/courses/:id`, ({ params }) => {
    const course = db.get("courses", params.id);
    return course ? json(courseView(course)) : notFound("Programme not found");
  }),
  http.get(`${API}/courses/:id`, ({ params }) => {
    const course = db.get("courses", params.id);
    return course ? json(courseView(course)) : notFound("Programme not found");
  }),
  http.post(`${API}/admin/courses`, async ({ request }) => {
    const { record, services } = courseFromBody(await readJson(request));
    const id = newId("programme");
    const course = db.insert("courses", {
      ...record,
      id,
      createdById: CREATED_BY,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    replaceCourseServices(id, services);
    return json(courseView(course), { status: 201 });
  }),
  http.put(`${API}/admin/courses/:id`, async ({ params, request }) => {
    const existing = db.get("courses", params.id);
    if (!existing) return notFound("Programme not found");
    const { record, services } = courseFromBody(await readJson(request), existing);
    const course = db.update("courses", params.id, record);
    replaceCourseServices(params.id, services);
    return json(courseView(course));
  }),
  http.delete(`${API}/admin/courses/:id`, ({ params }) => {
    removeCourse(params.id);
    return noContent();
  }),
];
