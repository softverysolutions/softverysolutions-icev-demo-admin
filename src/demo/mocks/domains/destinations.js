// Mock API for the destinations screens: countries, cities, FAQs, country programme formats
// and the country/city image galleries.
import { http } from "msw";
import { db } from "../db";
import { mediaUrl } from "../media";
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
} from "../utils";

const CREATED_AT = "2026-01-15T09:00:00.000Z";

/* ---- flags (inline SVG, no network) --------------------------------------- */

const svg = (body, w = 30, h = 20) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w * 4}" height="${
      h * 4
    }">${body}</svg>`
  )}`;
const hBands = (colors) =>
  svg(
    colors
      .map(
        (c, i) =>
          `<rect y="${(20 / colors.length) * i}" width="30" height="${20 / colors.length}" fill="${c}"/>`
      )
      .join("")
  );

const FLAGS = {
  de: hBands(["#000000", "#DD0000", "#FFCE00"]),
  nl: hBands(["#AE1C28", "#FFFFFF", "#21468B"]),
  at: hBands(["#C8102E", "#FFFFFF", "#C8102E"]),
  es: svg('<rect width="30" height="20" fill="#AA151B"/><rect y="5" width="30" height="10" fill="#F1BF00"/>'),
  pt: svg(
    '<rect width="30" height="20" fill="#DA291C"/><rect width="12" height="20" fill="#046A38"/><circle cx="12" cy="10" r="3.5" fill="#FFE900"/>'
  ),
  gb: svg(
    '<rect width="30" height="20" fill="#012169"/><path d="M0,0 30,20M30,0 0,20" stroke="#fff" stroke-width="4"/><path d="M0,0 30,20M30,0 0,20" stroke="#C8102E" stroke-width="1.5"/><path d="M15,0V20M0,10H30" stroke="#fff" stroke-width="6"/><path d="M15,0V20M0,10H30" stroke="#C8102E" stroke-width="3.5"/>'
  ),
};

/* ---- seed content ---------------------------------------------------------- */

// Tech scene and sport seasons per country (shown on the country form).
const COUNTRY_EXTRAS = {
  de: {
    techScene:
      "Berlin hosts 3,000+ startups, weekly meetups and hiring days with scale-ups; English is the working language in most tech teams.",
    surfSeason: "No ocean surf; river surfing on the Eisbach (Munich) all year",
    idealForStudyAndTravel:
      "Affordable big-city life, a huge startup ecosystem and fast trains to the rest of Europe.",
    climate: "Four seasons: cold winters (0–4 °C) and warm summers (20–28 °C).",
    tags: ["Startups", "Meetups", "Engineering"],
    sportTags: ["Football", "Fitness"],
  },
  pt: {
    techScene:
      "Lisbon is Europe's remote-work hub: Web Summit, coworking everywhere and a fast-growing developer community.",
    surfSeason: "All year; best swell September–April, beginner-friendly waves May–September",
    idealForStudyAndTravel: "Sunshine 300 days a year, Atlantic waves and a relaxed, affordable lifestyle.",
    climate: "Mild winters (10–15 °C) and hot, dry summers (25–32 °C).",
    tags: ["Remote work", "Web development", "UX/UI"],
    sportTags: ["Surf", "Yoga"],
  },
  es: {
    techScene:
      "Barcelona and Valencia mix design studios, mobile-app agencies and a growing gaming industry.",
    surfSeason: "Mediterranean wind swell October–March; tennis and football outdoors all year",
    idealForStudyAndTravel: "Beach, football and design culture with a late-evening social life.",
    climate: "Mediterranean: mild winters (10–16 °C), hot summers (26–31 °C).",
    tags: ["Design", "Mobile apps", "Product"],
    sportTags: ["Football", "Tennis", "Fitness"],
  },
  nl: {
    techScene:
      "Amsterdam is a data and AI hub with European HQs of big tech companies and a strong analytics community.",
    surfSeason: "North Sea surf September–April for experienced riders (wetsuit needed)",
    idealForStudyAndTravel: "Everyone speaks English, everything is reachable by bike, and data jobs are everywhere.",
    climate: "Maritime: cool winters (2–6 °C), mild summers (18–23 °C), frequent showers.",
    tags: ["Data science", "AI", "Analytics"],
    sportTags: ["Cycling"],
  },
  gb: {
    techScene:
      "London is a fintech and cyber-security capital with frequent CTFs, security meetups and graduate schemes.",
    surfSeason: "Cornwall surf season September–November; city sports all year",
    idealForStudyAndTravel: "World-class security labs, fintech employers and a huge international community.",
    climate: "Temperate: mild winters (5–8 °C), pleasant summers (18–24 °C).",
    tags: ["Cyber security", "Fintech"],
    sportTags: ["Football", "Tennis"],
  },
  at: {
    techScene: "Innsbruck and Vienna have a small but active startup scene around sports tech and tourism.",
    surfSeason: "No surf; ski and snowboard season December–April on the Nordkette and Stubai glacier",
    idealForStudyAndTravel: "Alpine slopes 20 minutes from the old town and a lively student city.",
    climate: "Alpine: snowy winters (-5–3 °C), warm summers (18–26 °C).",
    tags: ["Sports tech"],
    sportTags: ["Ski", "Snowboard", "Hiking"],
  },
};

const COUNTRY_FAQS = {
  de: [
    ["Do I need to speak German?", "No. All programmes are taught in English and most tech teams in Berlin work in English."],
    ["Is a laptop included?", "Bring your own laptop or add the laptop rental extra when you book."],
  ],
  pt: [
    ["When is the best time to surf?", "Waves are good all year. Beginners enjoy May–September; experienced surfers come for the autumn swell."],
    ["Can I combine a bootcamp with surf lessons?", "Yes — the Code & Surf package adds a surf weekend in Ericeira to the Lisbon web bootcamp."],
  ],
  es: [
    ["Which language are classes in?", "English. Football and tennis coaches also speak Spanish."],
    ["What should I pack for the sport camps?", "Sports clothes, trainers and sunscreen. Rackets, balls and kits are provided."],
  ],
  nl: [["Do I need a bike?", "Not required, but a weekly bike rental is the easiest way to get around Amsterdam."]],
  gb: [["Is there a security clearance check?", "No. The cyber-security bootcamp only uses lab environments built for training."]],
  at: [
    ["Is ski equipment included?", "Skis or a board, boots and helmet are included in every ski and snowboard camp."],
    ["When does the season run?", "Weekly camps start every Monday from December to April."],
  ],
};

const CITY_EXTRAS = {
  berlin: { techScene: "Factory Berlin, weekly JS and Python meetups, demo days with 300+ hiring partners", surfSeason: "—" },
  lisbon: { techScene: "LX Factory coworking, Web Summit every November, active React and Rails meetups", surfSeason: "Carcavelos and Costa da Caparica all year; best September–April" },
  ericeira: { techScene: "Small remote-worker community and coworking cafés", surfSeason: "World Surfing Reserve: consistent waves all year, big swell October–March" },
  barcelona: { techScene: "22@ innovation district, design studios and gaming companies", surfSeason: "Wind swell October–March at Barceloneta" },
  valencia: { techScene: "Growing mobile-app and startup scene around Lanzadera", surfSeason: "Occasional swell in autumn; tennis and football outdoors all year" },
  amsterdam: { techScene: "European HQs of big tech, AI labs and a large analytics meetup scene", surfSeason: "North Sea surf at Zandvoort September–April" },
  london: { techScene: "Fintech capital; CTFs and security meetups every week", surfSeason: "—" },
  innsbruck: { techScene: "Sports-tech startups around the university", surfSeason: "Ski season December–April; glacier skiing from October" },
};

const CITY_BENEFITS = {
  berlin: ["Startup capital of Europe", "Affordable rent for a capital", "Meetups every night"],
  lisbon: ["300 days of sunshine", "Surf 20 minutes from the city", "Remote-work friendly"],
  ericeira: ["World Surfing Reserve", "Small-town surf village vibe"],
  barcelona: ["Beach and city in one", "Design and football culture"],
  valencia: ["Mediterranean sport city", "Lower cost of living than Barcelona"],
  amsterdam: ["Everyone speaks English", "Data and AI employers"],
  london: ["Fintech and security capital", "Huge international community"],
  innsbruck: ["Slopes 20 minutes from the city", "Lively student town"],
};

// Duration-based programme types per country (the old "program types" block).
const PROGRAM_TYPES = {
  shortCamp: {
    name: "Short camp",
    fromWeeks: 1,
    toWeeks: 4,
    shortDescription: "Weekly sport camps and short tech courses",
    rules: ["Starts every Monday", "Equipment included where listed"],
    tags: ["1–4 weeks"],
  },
  bootcamp: {
    name: "Bootcamp",
    fromWeeks: 5,
    toWeeks: 16,
    shortDescription: "Full-time cohort programmes with a final project",
    rules: ["Cohorts start every six weeks", "Laptop required (rental available)"],
    tags: ["Career change", "Full time"],
  },
  certification: {
    name: "Certification track",
    fromWeeks: null,
    toWeeks: null,
    shortDescription: "Instructor and professional certificates",
    rules: ["Final assessment with an external examiner"],
    tags: ["Certificate"],
  },
};

const COUNTRY_PROGRAM_TYPES = {
  de: ["shortCamp", "bootcamp"],
  pt: ["shortCamp", "bootcamp", "certification"],
  es: ["shortCamp", "bootcamp", "certification"],
  nl: ["shortCamp", "bootcamp"],
  gb: ["shortCamp", "bootcamp"],
  at: ["shortCamp", "certification"],
};

/* ---- builders --------------------------------------------------------------- */

export function seed({ catalog }) {
  const countryFaqs = [];
  const programTypes = [];

  const countries = catalog.countries.map((c) => {
    const extra = COUNTRY_EXTRAS[c.id] || {};
    (COUNTRY_FAQS[c.id] || []).forEach(([question, answer], order) =>
      countryFaqs.push({
        id: `faq-${c.id}-${order + 1}`,
        countryId: c.id,
        question,
        answer,
        order,
        createdAt: CREATED_AT,
        updatedAt: CREATED_AT,
      })
    );
    (COUNTRY_PROGRAM_TYPES[c.id] || []).forEach((typeKey) =>
      programTypes.push({ id: `pt-${c.id}-${typeKey}`, countryId: c.id, typeKey, ...PROGRAM_TYPES[typeKey], note: null, longDescription: null })
    );
    const cityImages = catalog.cities.filter((city) => city.countryId === c.id).map((city) => city.image);
    return {
      id: c.id,
      name: c.name,
      engName: c.name,
      subtitle: c.subtitle,
      code: c.code,
      order: c.order,
      description: c.subtitle,
      idealForStudyAndTravel: extra.idealForStudyAndTravel || "",
      highlights: [...(extra.tags || []), ...(extra.sportTags || [])].join(" · "),
      climate: extra.climate || "",
      visaInfo: "EU citizens need only an ID card. Most other visitors can stay up to 90 days visa-free.",
      benefits: [],
      techScene: extra.techScene || "",
      surfSeason: extra.surfSeason || "",
      tagsShortTerm: extra.tags || [],
      tagsLongTerm: extra.sportTags || [],
      highlightsShortTerm: [],
      highlightsLongTerm: [],
      isActive: true,
      localEmergencyNumber: c.emergency,
      image: FLAGS[c.id] || null,
      media: [...new Set([c.image, ...cityImages])].map((key, i) => ({
        id: `cm-${c.id}-${i + 1}`,
        url: demoImage(key),
      })),
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    };
  });

  const cities = catalog.cities.map((city) => {
    const country = catalog.countries.find((c) => c.id === city.countryId);
    const extra = CITY_EXTRAS[city.id] || {};
    return {
      id: city.id,
      name: city.name,
      engName: city.name,
      subtitle: city.subtitle,
      description: city.description,
      longDescription: `<p>${city.description}</p>`,
      climateDescription: city.climate?.summer ? `Summer: ${city.climate.summer}` : "",
      climateWinter: city.climate?.winter || "",
      climateSpring: city.climate?.spring || "",
      climateSummer: city.climate?.summer || "",
      climateAutumn: city.climate?.autumn || "",
      costMonthlyAverage: city.cost?.average || "",
      costRent: city.cost?.rent || "",
      costUtilities: city.cost?.utilities || "",
      costFood: city.cost?.food || "",
      costTransport: city.cost?.transport || "",
      climateImageUrl: null,
      costOfLivingImageUrl: null,
      techScene: extra.techScene || "",
      surfSeason: extra.surfSeason || "",
      benefits: CITY_BENEFITS[city.id] || [],
      countryId: city.countryId,
      country: country ? { id: country.id, name: country.name, code: country.code } : null,
      isActive: true,
      image: demoImage(city.image),
      media: [{ id: `cim-${city.id}-1`, url: demoImage(city.image) }],
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
    };
  });

  return { countries, cities, countryFaqs, countryProgramTypes: programTypes };
}

/* ---- helpers ----------------------------------------------------------------- */

const withCountryFaqs = (country) => ({
  ...country,
  faqs: db
    .filter("countryFaqs", (f) => f.countryId === country.id)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
});

const countryRef = (countryId) => {
  const c = db.get("countries", countryId);
  return c ? { id: c.id, name: c.name, code: c.code } : null;
};

const slug = (value) =>
  String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const uniqueId = (collection, base, prefix) => {
  let id = slug(base) || newId(prefix);
  if (db.get(collection, id)) id = `${id}-${Date.now().toString(36)}`;
  return id;
};

const COUNTRY_FIELDS = [
  "name",
  "engName",
  "subtitle",
  "code",
  "description",
  "idealForStudyAndTravel",
  "highlights",
  "climate",
  "visaInfo",
  "benefits",
  "techScene",
  "surfSeason",
  "tagsShortTerm",
  "tagsLongTerm",
  "highlightsShortTerm",
  "highlightsLongTerm",
  "isActive",
  "localEmergencyNumber",
];

const pick = (body, fields) =>
  Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

const addMedia = (collection, ownerId, contentType) => {
  const owner = db.get(collection, ownerId);
  if (!owner) return null;
  const key = `${collection}/${ownerId}/${Date.now()}.${String(contentType || "image/jpeg").split("/")[1] || "jpg"}`;
  const url = mediaUrl(key);
  db.update(collection, ownerId, { media: [...(owner.media || []), { id: newId("media"), url }] });
  return { url, uploadUrl: url, publicUrl: url, key, bucket: "demo-media" };
};

const removeMedia = (collection, mediaId) => {
  const owner = db.find(collection, (row) => (row.media || []).some((m) => m.id === mediaId));
  if (!owner) return false;
  db.update(collection, owner.id, { media: owner.media.filter((m) => m.id !== mediaId) });
  return true;
};

/* ---- handlers ----------------------------------------------------------------- */

export const handlers = [
  // Countries
  http.post(`${API}/admin/countries/search`, async ({ request }) => {
    const body = await readJson(request);
    let list = db.all("countries").filter(
      (c) => includesText(c.name, body.search) || includesText(c.code, body.search)
    );
    list =
      !body.sortBy || body.sortBy === "order"
        ? sortBy(list, "order")
        : sortBy(list, body.sortBy, body.sortDirection);
    return json(paginate(list.map(withCountryFaqs), { page: body.page, limit: body.limit || 100 }));
  }),
  http.patch(`${API}/admin/countries/reorder`, async ({ request }) => {
    const { items = [] } = await readJson(request);
    items.forEach((item, index) =>
      db.update("countries", item.id, { order: item.order ?? item.sortOrder ?? index + 1 })
    );
    return json({ success: true });
  }),
  http.get(`${API}/admin/countries/:id/program-types`, ({ params }) =>
    json(db.filter("countryProgramTypes", (p) => p.countryId === params.id))
  ),
  http.put(`${API}/admin/countries/:id/program-types`, async ({ params, request }) => {
    const body = await readJson(request);
    const existing = db.find(
      "countryProgramTypes",
      (p) => p.countryId === params.id && p.typeKey === body.typeKey
    );
    const saved = existing
      ? db.update("countryProgramTypes", existing.id, body)
      : db.insert("countryProgramTypes", {
          id: newId("pt"),
          countryId: params.id,
          ...body,
        });
    return json(saved);
  }),
  http.delete(`${API}/admin/countries/:id/program-types/:typeKey`, ({ params }) => {
    const existing = db.find(
      "countryProgramTypes",
      (p) => p.countryId === params.id && p.typeKey === params.typeKey
    );
    if (existing) db.remove("countryProgramTypes", existing.id);
    return noContent();
  }),
  http.post(`${API}/admin/countries/:id/image/upload`, async ({ params, request }) => {
    const { contentType } = await readJson(request);
    if (!db.get("countries", params.id)) return notFound("Country not found");
    const key = `countries/${params.id}/flag-${Date.now()}.${String(contentType || "image/png").split("/")[1] || "png"}`;
    const url = mediaUrl(key);
    db.update("countries", params.id, { image: url });
    return json({ url, uploadUrl: url, publicUrl: url, key, bucket: "demo-media" });
  }),
  http.get(`${API}/admin/countries/:id`, ({ params }) => {
    const country = db.get("countries", params.id);
    if (!country) return notFound("Country not found");
    return json({
      ...withCountryFaqs(country),
      programTypes: db.filter("countryProgramTypes", (p) => p.countryId === country.id),
    });
  }),
  http.post(`${API}/admin/countries`, async ({ request }) => {
    const body = await readJson(request);
    const created = db.insert("countries", {
      id: uniqueId("countries", body.code || body.name, "country"),
      ...pick(body, COUNTRY_FIELDS),
      engName: body.engName || body.name,
      order: db.all("countries").length + 1,
      media: [],
      image: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return json(created, { status: 201 });
  }),
  http.patch(`${API}/admin/countries/:id`, async ({ params, request }) => {
    const body = await readJson(request);
    if (!db.get("countries", params.id)) return notFound("Country not found");
    const updated = db.update("countries", params.id, {
      ...pick(body, COUNTRY_FIELDS),
      ...(body.name ? { engName: body.engName || body.name } : {}),
    });
    // Keep the denormalised country on its cities in sync.
    db.filter("cities", (c) => c.countryId === params.id).forEach((city) =>
      db.update("cities", city.id, { country: countryRef(params.id) })
    );
    return json(withCountryFaqs(updated));
  }),
  http.delete(`${API}/admin/countries/:id`, ({ params }) => {
    if (!db.remove("countries", params.id)) return notFound("Country not found");
    db.filter("cities", (c) => c.countryId === params.id).forEach((c) => db.remove("cities", c.id));
    db.filter("countryFaqs", (f) => f.countryId === params.id).forEach((f) =>
      db.remove("countryFaqs", f.id)
    );
    return json({ success: true });
  }),
  http.post(`${API}/admin/country-media/upload`, async ({ request }) => {
    const { countryId, contentType } = await readJson(request);
    const result = addMedia("countries", countryId, contentType);
    return result ? json(result) : notFound("Country not found");
  }),
  http.delete(`${API}/admin/country-media/:mediaId`, ({ params }) =>
    removeMedia("countries", params.mediaId) ? noContent() : notFound("Image not found")
  ),

  // Country FAQs
  http.get(`${API}/admin/country-faqs/country/:countryId`, ({ params }) =>
    json(
      db
        .filter("countryFaqs", (f) => f.countryId === params.countryId)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    )
  ),
  http.post(`${API}/admin/country-faqs`, async ({ request }) => {
    const body = await readJson(request);
    return json(
      db.insert("countryFaqs", { id: newId("faq"), ...body, createdAt: nowIso(), updatedAt: nowIso() }),
      { status: 201 }
    );
  }),
  http.patch(`${API}/admin/country-faqs/:id`, async ({ params, request }) => {
    const updated = db.update("countryFaqs", params.id, await readJson(request));
    return updated ? json(updated) : notFound("FAQ not found");
  }),
  http.delete(`${API}/admin/country-faqs/:id`, ({ params }) =>
    db.remove("countryFaqs", params.id) ? json({ success: true }) : notFound("FAQ not found")
  ),

  // Cities
  http.post(`${API}/admin/cities/search`, async ({ request }) => {
    const body = await readJson(request);
    const filters = body.filters || body.filter || {};
    const countryIds = filters.countryIds || (filters.countryId ? [filters.countryId] : null);
    let list = db
      .all("cities")
      .filter((c) => includesText(c.name, body.search))
      .filter((c) => !countryIds?.length || countryIds.includes(c.countryId));
    list = sortBy(list, body.sortBy || "name", body.sortDirection);
    const page = paginate(list, { page: body.page, limit: body.limit || 100 });
    page.meta.hasNextPage = page.meta.currentPage < page.meta.totalPages;
    return json(page);
  }),
  http.get(`${API}/admin/cities/:id`, ({ params }) => {
    const city = db.get("cities", params.id);
    return city ? json(city) : notFound("City not found");
  }),
  http.post(`${API}/admin/cities`, async ({ request }) => {
    const body = await readJson(request);
    const created = db.insert("cities", {
      ...body,
      id: uniqueId("cities", body.name, "city"),
      engName: body.engName || body.name,
      isActive: body.isActive !== false,
      country: countryRef(body.countryId),
      media: [],
      image: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
    return json(created, { status: 201 });
  }),
  http.patch(`${API}/admin/cities/:id`, async ({ params, request }) => {
    const body = await readJson(request);
    if (!db.get("cities", params.id)) return notFound("City not found");
    const updated = db.update("cities", params.id, {
      ...body,
      engName: body.engName || body.name,
      ...(body.countryId ? { country: countryRef(body.countryId) } : {}),
    });
    return json(updated);
  }),
  http.delete(`${API}/admin/cities/:id`, ({ params }) =>
    db.remove("cities", params.id) ? json({ success: true }) : notFound("City not found")
  ),
  http.post(`${API}/admin/city-media/upload`, async ({ request }) => {
    const { cityId, contentType } = await readJson(request);
    const result = addMedia("cities", cityId, contentType);
    if (result) {
      const city = db.get("cities", cityId);
      if (!city.image) db.update("cities", cityId, { image: result.url });
    }
    return result ? json(result) : notFound("City not found");
  }),
  http.delete(`${API}/admin/city-media/:mediaId`, ({ params }) =>
    removeMedia("cities", params.mediaId) ? noContent() : notFound("Image not found")
  ),
];
