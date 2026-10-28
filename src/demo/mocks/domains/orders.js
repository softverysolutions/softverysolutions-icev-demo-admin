// Mock API for orders (travels): the bookings a visitor can make in the Softvery Demo app,
// priced from the shared catalogue seed, with edits that recalculate the price and an audit log.
import { http } from "msw";
import { db } from "../db";
import {
  API,
  json,
  notFound,
  badRequest,
  readJson,
  paginate,
  includesText,
  sortBy,
  demoImage,
  today,
  addDays,
  nextMonday,
  daysAgoIso,
  nowIso,
  newId,
} from "../utils";
import catalog from "demo/seed/catalog.json";

const CURRENCY = "EUR";
const PROMOS = Object.fromEntries(catalog.promoCodes.map((p) => [p.code, p]));

const byId = (list) => Object.fromEntries(list.map((item) => [item.id, item]));
const programmes = byId(catalog.programmes);
const campuses = byId(catalog.campuses);
const providers = byId(catalog.providers);
const cities = byId(catalog.cities);
const countries = byId(catalog.countries);
const stays = byId(catalog.accommodations);
const services = byId(catalog.services);
const experiences = byId(catalog.experiences);
const packages = byId(catalog.packages);

/* ---- customers -------------------------------------------------------------- */

// Customers who booked in the app. Ids of community members match community.json so the
// same people show up in community moderation.
export const CUSTOMERS = [
  { id: "cus-alex", firstName: "Alex", lastName: "Morgan", country: "Ireland", avatar: null, skill: "beginner" },
  { id: "m-lena", firstName: "Lena", lastName: "Hoffmann", country: "Germany", avatar: "avatar-1", skill: "beginner" },
  { id: "m-marco", firstName: "Marco", lastName: "Ruiz", country: "Spain", avatar: "avatar-2", skill: "intermediate" },
  { id: "m-aisha", firstName: "Aisha", lastName: "Khan", country: "United Kingdom", avatar: "avatar-3", skill: "intermediate" },
  { id: "m-tom", firstName: "Tom", lastName: "Becker", country: "Germany", avatar: "avatar-4", skill: "beginner" },
  { id: "m-kenji", firstName: "Kenji", lastName: "Watanabe", country: "Japan", avatar: "avatar-6", skill: "advanced" },
  { id: "m-nora", firstName: "Nora", lastName: "Okafor", country: "Nigeria", avatar: "avatar-7", skill: "beginner" },
  { id: "m-lucas", firstName: "Lucas", lastName: "Martin", country: "France", avatar: "avatar-8", skill: "intermediate" },
  { id: "m-mia", firstName: "Mia", lastName: "Rossi", country: "Italy", avatar: "avatar-9", skill: "intermediate" },
  { id: "m-daniel", firstName: "Daniel", lastName: "Novak", country: "Czechia", avatar: "avatar-10", skill: "beginner" },
  { id: "m-yara", firstName: "Yara", lastName: "Haddad", country: "Lebanon", avatar: "avatar-11", skill: "beginner" },
  { id: "m-oliver", firstName: "Oliver", lastName: "Grant", country: "Canada", avatar: "avatar-12", skill: "intermediate" },
  { id: "cus-emma", firstName: "Emma", lastName: "Dubois", country: "Belgium", avatar: null, skill: "beginner" },
  { id: "cus-jakub", firstName: "Jakub", lastName: "Kowalski", country: "Poland", avatar: null, skill: "intermediate" },
  { id: "cus-freya", firstName: "Freya", lastName: "Nilsson", country: "Sweden", avatar: null, skill: "beginner" },
  { id: "cus-hannah", firstName: "Hannah", lastName: "Schmidt", country: "Austria", avatar: null, skill: "advanced" },
  { id: "cus-ravi", firstName: "Ravi", lastName: "Patel", country: "India", avatar: null, skill: "intermediate" },
  { id: "cus-ines", firstName: "Inês", lastName: "Costa", country: "Portugal", avatar: null, skill: "beginner" },
];

const emailOf = (c) =>
  c.id === "cus-alex"
    ? "alex.morgan@softvery.example"
    : `${c.firstName}.${c.lastName}`
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase() + "@example.com";

const INTERESTS = {
  tech: ["Tech · Web development", "Tech · Data & AI", "Tech · UX/UI design"],
  sport: ["Sport · Surf", "Sport · Football", "Sport · Ski & snowboard"],
};

/* ---- pricing ------------------------------------------------------------------ */

const categoryOf = (programmeId) => programmes[programmeId]?.category || "tech";

const servicesFor = (programmeId) =>
  catalog.services.filter((s) => !s.category || s.category === categoryOf(programmeId));

const serviceIdOf = (courseServiceId) => {
  const id = String(courseServiceId || "");
  if (services[id]) return id;
  // Course services created by the catalogue screens may carry their own ids.
  for (const course of db.all("courses")) {
    const match = (course.services || []).find((cs) => cs.id === id);
    if (match) return match.service?.id || match.serviceId || null;
  }
  return id.split("__").pop();
};

const servicePrice = (service, weeks) =>
  service.period === "week" ? service.price * weeks : service.price;

const programmeName = (programmeId) =>
  programmes[programmeId]?.name || db.get("courses", programmeId)?.name || "Programme";

/** Prices a booking the same way the app does (tuition, stay, extras, discounts, promo). */
export function price(draft) {
  const programme = programmes[draft.courseId];
  const pricePerWeek =
    programme?.pricePerWeek ?? db.get("courses", draft.courseId)?.pricePerWeek ?? 0;
  const weeks = Number(draft.duration) || 1;
  const pkg = draft.packageId ? packages[draft.packageId] : null;

  const courseBase = pricePerWeek * weeks;
  const courseDiscount =
    !pkg && programme?.discount ? Math.round((courseBase * programme.discount) / 100) : 0;
  const mandatory = servicesFor(draft.courseId).filter((s) => s.mandatory);
  const mandatoryTotal = mandatory.reduce((sum, s) => sum + servicePrice(s, weeks), 0);

  const stay = draft.accommodationId ? stays[draft.accommodationId] : null;
  const stayWeeks = Number(draft.accommodationWeeks) || weeks;
  const accommodationTotal = stay ? stay.pricePerWeek * stayWeeks : 0;

  const optional = (draft.serviceIds || [])
    .map((id) => services[id])
    .filter((s) => s && !s.mandatory);
  const optionalTotal = optional.reduce((sum, s) => sum + servicePrice(s, weeks), 0);
  const experiencesTotal = (draft.experienceIds || [])
    .map((id) => experiences[id])
    .filter(Boolean)
    .reduce((sum, e) => sum + e.price, 0);

  const travelBase = courseBase + mandatoryTotal + accommodationTotal + optionalTotal + experiencesTotal;
  let packageDiscount = 0;
  if (pkg) {
    packageDiscount =
      pkg.discountType === "percent"
        ? Math.round((travelBase * pkg.discountValue) / 100)
        : pkg.discountValue;
  }
  const afterDiscounts = travelBase - courseDiscount - packageDiscount;
  const promo = draft.promoCode ? PROMOS[draft.promoCode] : null;
  const promoDiscount = promo ? Math.round((afterDiscounts * promo.value) / 100) : 0;
  const total = afterDiscounts - promoDiscount;

  let discountTitle = null;
  if (pkg) {
    discountTitle =
      pkg.discountType === "percent" ? `Package ${pkg.discountValue}%` : "Package saving";
  } else if (courseDiscount) {
    discountTitle = `Early bird ${programme.discount}%`;
  }

  return {
    coursePrice: courseBase - courseDiscount + mandatoryTotal,
    mandatory,
    optional,
    summary: {
      courseBase: courseBase + mandatoryTotal,
      courseTotal: courseBase + mandatoryTotal - courseDiscount,
      accommodationTotal,
      extrasTotal: optionalTotal + experiencesTotal,
      discountAmount: courseDiscount + packageDiscount,
      discountTitle,
      promoCodeTitle: promo ? promo.code : null,
      promoCodeDiscountAmount: promoDiscount,
      promoCodeScope: promo ? (pkg ? "package" : "course") : null,
      travelBase,
      travelTotal: total,
    },
    totalPrice: total,
  };
}

/* ---- DTO --------------------------------------------------------------------- */

const accommodationDto = (stay) =>
  stay && {
    id: stay.id,
    name: stay.name,
    category: stay.category,
    type: stay.type,
    bathroomType: stay.bathroom,
    regimeType: stay.regime,
    address: stay.address,
    description: stay.description,
    image: demoImage(stay.images?.[0]),
    currency: CURRENCY,
  };

/** Recomputes every derived field of an order record from its booking choices. */
function materialize(record) {
  const programme = programmes[record.courseId];
  const campus = campuses[programme?.campusId] || {};
  const city = cities[campus.cityId] || {};
  const country = countries[city.countryId] || {};
  const pricing = price(record);
  const weeks = Number(record.duration) || 1;
  const end = addDays(record.selectedStartDate, weeks * 7 - 3);
  const stay = record.accommodationId ? stays[record.accommodationId] : null;
  const stayWeeks = Number(record.accommodationWeeks) || weeks;
  const stayStart = record.accommodationStart || addDays(record.selectedStartDate, -1);
  const pkg = record.packageId ? packages[record.packageId] : null;

  const travelServices = [...pricing.mandatory, ...pricing.optional].map((s) => ({
    id: `${record.id}-ts-${s.id}`,
    price: servicePrice(s, weeks),
    courseService: {
      id: `${record.courseId}__${s.id}`,
      isMandatory: Boolean(s.mandatory),
      service: { id: s.id, name: s.name, type: s.type, currency: CURRENCY },
    },
  }));

  return {
    ...record,
    courseName: [programmeName(record.courseId), city.name, country.name].filter(Boolean).join(" - "),
    courseImage: demoImage(programme?.image),
    campusId: campus.id,
    schoolId: campus.providerId,
    schoolName: providers[campus.providerId]?.name,
    start: record.selectedStartDate,
    end,
    coursePrice: pricing.coursePrice,
    subtotal: pricing.summary.courseBase,
    totalDiscount: pricing.summary.discountAmount || null,
    discountTitle: pricing.summary.discountTitle,
    summary: pricing.summary,
    totalPrice: pricing.totalPrice,
    currency: CURRENCY,
    packageName: pkg?.name || null,
    isFixedPackage: Boolean(pkg),
    accommodationBooking: stay
      ? {
          accommodationId: stay.id,
          accommodation: accommodationDto(stay),
          startDate: stayStart,
          endDate: addDays(stayStart, stayWeeks * 7),
          price: stay.pricePerWeek * stayWeeks,
        }
      : null,
    travelServices,
    travelExperiences: (record.experienceIds || [])
      .map((id, index) => experiences[id] && { id: `${record.id}-te-${id}`, experienceId: id, order: index, experience: experiences[id] })
      .filter(Boolean),
    studentsCount: 1,
  };
}

/* ---- seed -------------------------------------------------------------------- */

const firstCohort = () => nextMonday(addDays(today(), 30));
const mondayIn = (days) => nextMonday(addDays(today(), days));
const mondayAgo = (days) => {
  const day = addDays(today(), -days);
  return addDays(nextMonday(day), -7);
};

// What visitors booked in the app: programme, stay, extras, package, promo, state.
const ORDER_PLAN = [
  { n: 1014, customer: "cus-alex", courseId: "ux-ui-sprint-barcelona", start: () => mondayAgo(8), weeks: 4, stay: "gracia-loft", extras: ["svc-transfer"], status: "inProgress", pay: "success", method: "card", created: 46 },
  { n: 1013, customer: "m-lena", courseId: "web-dev-berlin", start: firstCohort, weeks: 12, stay: "mitte-coliving", extras: ["svc-laptop", "svc-career"], promo: "BERLIN10", status: "registration", pay: "success", method: "card", created: 2 },
  { n: 1012, customer: "m-marco", packageId: "code-and-surf-lisbon", start: firstCohort, status: "readyForTheStart", pay: "success", method: "wallet", created: 4 },
  { n: 1011, customer: "m-aisha", courseId: "data-science-ai-amsterdam", start: firstCohort, weeks: 10, stay: "canal-room", extras: ["svc-laptop"], status: "notPaid", pay: "pending", method: "card", created: 1 },
  { n: 1010, customer: "m-tom", courseId: "surf-camp-ericeira", start: () => mondayAgo(52), weeks: 2, stay: "ocean-surf-house", extras: ["svc-equipment", "svc-video"], status: "finished", pay: "success", method: "card", created: 75 },
  { n: 1009, customer: "m-kenji", courseId: "ml-engineering-berlin", start: firstCohort, weeks: 8, stay: "kreuzberg-flat", extras: ["svc-insurance"], promo: "BERLIN10", status: "readyForTheStart", pay: "success", method: "card", created: 9 },
  { n: 1008, customer: "m-nora", packageId: "alpine-ski-week", start: () => mondayIn(45), weeks: 1, status: "registration", pay: "success", method: "wallet", created: 12 },
  { n: 1007, customer: "m-lucas", courseId: "football-academy-barcelona", start: () => mondayIn(20), weeks: 2, stay: "eixample-residence", extras: ["svc-equipment"], status: "cancelled", pay: "refunded", method: "card", created: 18, cancelReason: "Injured his knee playing five-a-side; asked to cancel and rebook next season.", refundStatus: "inProgress" },
  { n: 1006, customer: "m-mia", courseId: "yoga-teacher-lisbon", start: () => mondayIn(23), weeks: 4, stay: "lx-residence", extras: ["svc-transfer"], status: "registration", pay: "success", method: "wallet", created: 21 },
  { n: 1005, customer: "m-daniel", courseId: "cybersecurity-london", start: firstCohort, weeks: 8, stay: "shoreditch-coliving", extras: ["svc-sim"], status: "notPaid", pay: "failed", method: "card", created: 3 },
  { n: 1004, customer: "m-yara", packageId: "design-and-yoga-barcelona", start: () => mondayAgo(8), status: "inProgress", pay: "success", method: "card", created: 40 },
  { n: 1003, customer: "m-oliver", courseId: "tennis-camp-valencia", start: () => mondayAgo(24), weeks: 1, stay: "beachside-sports", extras: ["svc-equipment"], status: "finished", pay: "success", method: "wallet", created: 58 },
  { n: 1002, customer: "cus-emma", packageId: "berlin-tech-starter", start: firstCohort, promo: "BERLIN10", status: "registration", pay: "success", method: "card", created: 6 },
  { n: 1001, customer: "cus-jakub", courseId: "mobile-dev-valencia", start: firstCohort, weeks: 8, stay: "ruzafa-apartment", extras: ["svc-laptop"], status: "notPaid", pay: "pending", method: "card", created: 5 },
];

const EMERGENCY = [
  ["Parent", "+49 151 2345 6789"],
  ["Partner", "+34 612 345 678"],
  ["Sibling", "+44 7700 900123"],
  ["Parent", "+33 6 12 34 56 78"],
];

function seedOrders() {
  const customers = byId(CUSTOMERS);
  return ORDER_PLAN.map((plan, index) => {
    const pkg = plan.packageId ? packages[plan.packageId] : null;
    const customer = customers[plan.customer];
    const courseId = pkg ? pkg.programmeId : plan.courseId;
    const duration = pkg ? pkg.weeks[0] : plan.weeks;
    const createdAt = daysAgoIso(plan.created, 9 + (index % 8));
    const [relationship, phone] = EMERGENCY[index % EMERGENCY.length];
    const record = {
      id: `SD-${plan.n}`,
      userId: customer.id,
      userFirstName: customer.firstName,
      userLastName: customer.lastName,
      userEmail: emailOf(customer),
      createdAt,
      updatedAt: createdAt,
      status: plan.status,
      courseId,
      selectedStartDate: plan.start(),
      duration,
      packageId: plan.packageId || null,
      accommodationId: pkg ? pkg.accommodationId : plan.stay || null,
      accommodationWeeks: duration,
      serviceIds: pkg ? pkg.serviceIds : plan.extras || [],
      experienceIds: pkg ? pkg.experienceIds : [],
      promoCode: plan.promo || null,
      paymentMethod: plan.method,
      currentPaymentStatus: plan.pay,
      refundStatus: plan.refundStatus || null,
      cancelReason: plan.cancelReason || null,
      priceDifferenceAmount: null,
      priceDifferenceBaseTotal: null,
      priceDifferenceStatus: null,
      students: [
        {
          id: `stu-${customer.id}`,
          fullName: `${customer.firstName} ${customer.lastName}`,
          email: emailOf(customer),
          nationality: customer.country,
          phoneNumber: `+${31 + index} 6${String(10000000 + index * 7654321).slice(0, 8)}`,
          gender: null,
          birthDate: `${1990 + (index % 9)}-0${1 + (index % 9)}-1${index % 9}`,
          skillLevel: customer.skill,
          emergencyContact: { fullName: `${relationship} of ${customer.firstName}`, phoneNumber: phone, relationship },
        },
      ],
      auditLogs: [
        {
          id: `log-${plan.n}-created`,
          createdAt,
          adminId: null,
          action: "ORDER_CREATED",
          changes: [{ entity: "order", field: "status", changeType: "ADDED", newValue: "Booked in the app" }],
        },
      ],
    };
    const priced = materialize(record);
    const paymentAmount = priced.totalPrice;
    record.payments = [
      {
        id: `pay-${plan.n}`,
        amount: paymentAmount,
        currency: CURRENCY,
        status: plan.pay === "refunded" ? "success" : plan.pay,
        method: plan.method,
        description: plan.method === "wallet" ? "Apple Pay" : `Card ending ${String(plan.n * 7).slice(-4)}`,
        createdAt,
        paidAt: plan.pay === "success" || plan.pay === "refunded" ? createdAt : null,
      },
    ];
    if (plan.pay === "refunded") {
      record.payments.push({
        id: `pay-${plan.n}-refund`,
        amount: paymentAmount,
        currency: CURRENCY,
        status: "refunded",
        method: plan.method,
        description: "Refund to card",
        createdAt: daysAgoIso(plan.created - 3),
      });
      record.auditLogs.push({
        id: `log-${plan.n}-cancel`,
        createdAt: daysAgoIso(plan.created - 3, 15),
        adminId: "team-jonas",
        action: "ORDER_CANCELLED",
        changes: [
          { entity: "order", field: "status", changeType: "UPDATED", newValue: "cancelled" },
          { entity: "order", field: "refundStatus", changeType: "UPDATED", newValue: "inProgress" },
        ],
      });
    }
    if (plan.status === "readyForTheStart" || plan.status === "inProgress") {
      record.auditLogs.push({
        id: `log-${plan.n}-ready`,
        createdAt: daysAgoIso(Math.max(0, plan.created - 2), 11),
        adminId: "team-sofia",
        action: "ORDER_EDITED",
        changes: [{ entity: "order", field: "status", changeType: "UPDATED", newValue: "readyForTheStart" }],
      });
    }
    return record;
  });
}

export function seed() {
  return {
    orders: seedOrders(),
    customers: CUSTOMERS.map((c, index) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      email: emailOf(c),
      phoneNumber: `+${30 + index} ${600 + index * 13} ${100 + index * 7} ${200 + index * 11}`,
      countryName: c.country,
      avatarUrl: c.avatar ? demoImage(c.avatar) : null,
      gender: null,
      birthDate: `${1989 + (index % 10)}-${String(1 + (index % 12)).padStart(2, "0")}-${String(3 + index).padStart(2, "0")}`,
      skillLevel: c.skill,
      interests: INTERESTS[index % 3 === 1 ? "sport" : "tech"].slice(0, 1 + (index % 3)),
      preferredDuration: ["1–2 weeks", "4–8 weeks", "12 weeks or longer"][index % 3],
      goal: ["Change careers", "Level up my skills", "Learn something new on holiday"][index % 3],
      interestCities: [catalog.cities[index % 8].name, catalog.cities[(index + 3) % 8].name],
      savedCount: (index * 3) % 7,
      role: "Customer",
      createdAt: daysAgoIso(30 + ((index * 17) % 200)),
      updatedAt: daysAgoIso(index % 9),
    })),
  };
}

/* ---- queries ------------------------------------------------------------------ */

const orderDto = (record) => materialize(record);

const sessionAdminId = (request) => {
  const token = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/, "");
  return token.startsWith("demo-token.") ? token.slice("demo-token.".length) : null;
};

const asArray = (value) => (value == null ? [] : Array.isArray(value) ? value : [value]);

function searchOrders(body) {
  const filter = body.filter || {};
  const statuses = asArray(filter.status);
  const payments = asArray(filter.currentPaymentStatus);
  let rows = db.all("orders").map(orderDto);
  if (filter.userId) rows = rows.filter((o) => o.userId === filter.userId);
  if (statuses.length) rows = rows.filter((o) => statuses.includes(o.status));
  if (payments.length) rows = rows.filter((o) => payments.includes(o.currentPaymentStatus));
  if (body.search) {
    rows = rows.filter((o) =>
      [o.id, `${o.userFirstName} ${o.userLastName}`, o.userEmail, o.courseName, o.packageName].some(
        (value) => includesText(value, body.search)
      )
    );
  }
  rows = sortBy(rows, body.sortBy || "createdAt", body.sortDirection || "desc");
  return paginate(rows, body);
}

const label = (value) => (value === undefined ? null : value);

/** Applies a PATCH from the order page and returns the audit-log changes it made. */
function applyEdit(record, body) {
  const changes = [];
  const note = (entity, field, oldValue, newValue) => {
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({ entity, field, changeType: "UPDATED", oldValue: label(oldValue), newValue: label(newValue) });
    }
  };
  const next = { ...record };

  if (body.student && next.students?.[0]) {
    const before = next.students[0];
    const after = { ...before, ...body.student };
    Object.keys(body.student).forEach((key) => {
      if (key === "emergencyContact") {
        ["fullName", "phoneNumber", "relationship"].forEach((k) =>
          note("student", `emergencyContact.${k}`, before.emergencyContact?.[k], after.emergencyContact?.[k])
        );
      } else {
        note("student", key, before[key], after[key]);
      }
    });
    next.students = [after];
    if (body.student.fullName) {
      const [first, ...rest] = body.student.fullName.trim().split(/\s+/);
      next.userFirstName = first;
      next.userLastName = rest.join(" ");
    }
  }
  if (body.courseId && body.courseId !== next.courseId) {
    note("course", "courseId", programmeName(next.courseId), programmeName(body.courseId));
    next.courseId = body.courseId;
    next.packageId = null;
  }
  if (body.selectedStartDate) {
    const day = String(body.selectedStartDate).slice(0, 10);
    note("course", "startDate", next.selectedStartDate, day);
    next.selectedStartDate = day;
  }
  if (body.duration !== undefined) {
    const weeks = Number(body.duration) || next.duration;
    note("course", "duration", `${next.duration} weeks`, `${weeks} weeks`);
    next.duration = weeks;
  }
  if (body.accommodationBooking === null) {
    note("accommodation", "accommodationId", stays[next.accommodationId]?.name || null, null);
    next.accommodationId = null;
  } else if (body.accommodationBooking) {
    const ab = body.accommodationBooking;
    if (ab.accommodationId && ab.accommodationId !== next.accommodationId) {
      note("accommodation", "accommodationId", stays[next.accommodationId]?.name || null, stays[ab.accommodationId]?.name || ab.accommodationId);
      next.accommodationId = ab.accommodationId;
    }
    if (ab.duration) {
      note("accommodation", "duration", `${next.accommodationWeeks} weeks`, `${Number(ab.duration)} weeks`);
      next.accommodationWeeks = Number(ab.duration);
    }
    if (ab.startDate) {
      const day = String(ab.startDate).slice(0, 10);
      if (next.accommodationStart && day !== next.accommodationStart) note("accommodation", "startDate", next.accommodationStart, day);
      next.accommodationStart = day;
    }
  }
  if (body.courseServiceIds) {
    const ids = [...new Set(body.courseServiceIds.map(serviceIdOf).filter((id) => services[id] && !services[id].mandatory))];
    const before = (next.serviceIds || []).filter((id) => !services[id]?.mandatory);
    ids.filter((id) => !before.includes(id)).forEach((id) =>
      changes.push({ entity: "extra", field: "service", changeType: "ADDED", newValue: services[id].name })
    );
    before.filter((id) => !ids.includes(id)).forEach((id) =>
      changes.push({ entity: "extra", field: services[id]?.name || id, changeType: "REMOVED" })
    );
    next.serviceIds = ids;
  }
  if (body.priceDifferenceStatus) {
    note("order", "priceDifferenceStatus", next.priceDifferenceStatus, body.priceDifferenceStatus);
    next.priceDifferenceStatus = body.priceDifferenceStatus;
  }
  return { next, changes };
}

function draftFrom(record, body) {
  const { next } = applyEdit(record, body);
  return next;
}

/* ---- handlers ------------------------------------------------------------------- */

export const handlers = [
  http.post(`${API}/admin/travels/search`, async ({ request }) => json(searchOrders(await readJson(request)))),

  http.get(`${API}/admin/travels/:id`, ({ params }) => {
    const record = db.get("orders", params.id);
    return record ? json(orderDto(record)) : notFound("Order not found");
  }),

  http.post(`${API}/admin/travels/:id/calculate-price`, async ({ params, request }) => {
    const record = db.get("orders", params.id);
    if (!record) return notFound("Order not found");
    const body = await readJson(request);
    const pricing = price(draftFrom(record, body));
    return json({ summary: pricing.summary, totalPrice: pricing.totalPrice, currency: CURRENCY });
  }),

  http.patch(`${API}/admin/travels/:id/cancel`, async ({ params, request }) => {
    const record = db.get("orders", params.id);
    if (!record) return notFound("Order not found");
    const body = await readJson(request);
    if (!body.cancelReason) return badRequest("A cancellation reason is required");
    const log = {
      id: newId("log"),
      createdAt: nowIso(),
      adminId: sessionAdminId(request),
      action: "ORDER_CANCELLED",
      changes: [
        { entity: "order", field: "status", changeType: "UPDATED", oldValue: record.status, newValue: "cancelled" },
        { entity: "order", field: "refundStatus", changeType: "UPDATED", newValue: body.refundStatus || "notStarted" },
      ],
    };
    const updated = db.update("orders", params.id, {
      status: "cancelled",
      cancelReason: body.cancelReason,
      refundStatus: body.refundStatus || "notStarted",
      auditLogs: [...(record.auditLogs || []), log],
    });
    return json(orderDto(updated));
  }),

  http.patch(`${API}/admin/travels/:id/refund-status`, async ({ params, request }) => {
    const record = db.get("orders", params.id);
    if (!record) return notFound("Order not found");
    const { refundStatus } = await readJson(request);
    const patch = {
      refundStatus,
      auditLogs: [
        ...(record.auditLogs || []),
        {
          id: newId("log"),
          createdAt: nowIso(),
          adminId: sessionAdminId(request),
          action: "PAYMENT_UPDATED",
          changes: [{ entity: "order", field: "refundStatus", changeType: "UPDATED", oldValue: record.refundStatus, newValue: refundStatus }],
        },
      ],
    };
    if (refundStatus === "completed") {
      patch.currentPaymentStatus = "refunded";
      if (!(record.payments || []).some((p) => p.status === "refunded")) {
        const paid = (record.payments || []).filter((p) => p.status === "success").reduce((s, p) => s + p.amount, 0);
        patch.payments = [
          ...(record.payments || []),
          { id: newId("pay"), amount: paid, currency: CURRENCY, status: "refunded", method: record.paymentMethod, description: "Refund", createdAt: nowIso() },
        ];
      }
    }
    return json(orderDto(db.update("orders", params.id, patch)));
  }),

  http.patch(`${API}/admin/travels/:id`, async ({ params, request }) => {
    const record = db.get("orders", params.id);
    if (!record) return notFound("Order not found");
    const body = await readJson(request);
    const { next, changes } = applyEdit(record, body);
    const oldTotal = price(record).totalPrice;
    const newTotal = price(next).totalPrice;
    if (newTotal !== oldTotal) {
      const base = next.priceDifferenceBaseTotal ?? oldTotal;
      next.priceDifferenceBaseTotal = base;
      next.priceDifferenceAmount = newTotal - base;
      if (!body.priceDifferenceStatus) next.priceDifferenceStatus = next.priceDifferenceAmount ? "notHandled" : null;
      changes.push({ entity: "order", field: "totalPrice", changeType: "UPDATED", oldValue: `€${oldTotal}`, newValue: `€${newTotal}` });
    }
    if (changes.length) {
      next.auditLogs = [
        ...(record.auditLogs || []),
        { id: newId("log"), createdAt: nowIso(), adminId: sessionAdminId(request), action: "ORDER_EDITED", changes },
      ];
    }
    const { id, ...patch } = next;
    return json(orderDto(db.update("orders", id, patch)));
  }),
];
