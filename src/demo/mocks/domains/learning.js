// Mock API for course plans: one plan per programme type, made of weeks (stages) with lesson
// topics. Seeded from the same curricula the Softvery Demo app shows on a trip's Course plan.
import { http } from "msw";
import { db } from "../db";
import { API, json, notFound, badRequest, noContent, readJson, newId } from "../utils";

const BASE = `${API}/admin/learning-journey`;

export const PROGRAMME_TYPES = {
  webDevelopment: { label: "Web development", category: "tech" },
  dataScience: { label: "Data science & AI", category: "tech" },
  uxUi: { label: "UX/UI design", category: "tech" },
  cybersecurity: { label: "Cybersecurity", category: "tech" },
  mobileDevelopment: { label: "Mobile development", category: "tech" },
  surf: { label: "Surf", category: "sport" },
  football: { label: "Football", category: "sport" },
  tennis: { label: "Tennis", category: "sport" },
  yogaFitness: { label: "Yoga & fitness", category: "sport" },
  skiSnowboard: { label: "Ski & snowboard", category: "sport" },
};

const HOMEWORK = {
  tech: [
    (t) => `Finish the "${t}" exercise and push it to your project repository.`,
    (t) => `Write a short summary of "${t}" and post one open question in the cohort channel.`,
    (t) => `Complete the "${t}" practice set before the next session.`,
    (t) => `Pair up, review a classmate's "${t}" exercise and leave two comments.`,
  ],
  sport: [
    (t) => `Repeat today's "${t}" drills for 20 minutes on your own.`,
    (t) => `Watch the session video of "${t}" and note two things to improve.`,
    (t) => `Log how "${t}" felt in your training diary, including energy and soreness.`,
    (t) => `Stretch for 15 minutes, then walk through the "${t}" sequence in your head.`,
  ],
};

export function seed({ curricula, catalog }) {
  const coursePlanStages = [];
  Object.entries(curricula).forEach(([programType, weeks]) => {
    const category = PROGRAMME_TYPES[programType]?.category || "tech";
    weeks.forEach((week, weekIndex) => {
      const stageId = `plan-${programType}-w${weekIndex + 1}`;
      coursePlanStages.push({
        id: stageId,
        programType,
        name: week.topic,
        order: weekIndex,
        lessons: week.lessons.map(([name, goal], lessonIndex) => ({
          id: `${stageId}-l${lessonIndex + 1}`,
          stageId,
          name,
          goal,
          homework: HOMEWORK[category][(weekIndex + lessonIndex) % 4](name),
          durationMinutes: category === "tech" ? 180 : 90,
          order: lessonIndex,
        })),
      });
    });
  });
  const cities = Object.fromEntries(catalog.cities.map((c) => [c.id, c.name]));
  const campusCity = Object.fromEntries(catalog.campuses.map((c) => [c.id, cities[c.cityId]]));
  const coursePlanProgrammes = catalog.programmes.map((p) => ({
    id: p.id,
    programType: p.programType,
    name: `${p.name}, ${campusCity[p.campusId]}`,
  }));
  return { coursePlanStages, coursePlanProgrammes };
}

const stagesOf = (programType) =>
  db
    .filter("coursePlanStages", (s) => s.programType === programType)
    .sort((a, b) => a.order - b.order);

const findLesson = (lessonId) => {
  for (const stage of db.all("coursePlanStages")) {
    const lesson = (stage.lessons || []).find((l) => l.id === lessonId);
    if (lesson) return { stage, lesson };
  }
  return null;
};

const LESSON_FIELDS = ["name", "goal", "homework", "durationMinutes"];
const pick = (body, fields) =>
  Object.fromEntries(fields.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));

export const handlers = [
  http.get(`${BASE}/plans`, () => {
    const programmes = db.all("coursePlanProgrammes");
    const stages = db.all("coursePlanStages");
    return json(
      Object.entries(PROGRAMME_TYPES).map(([value, meta]) => {
        const own = stages.filter((s) => s.programType === value);
        return {
          programType: value,
          label: meta.label,
          category: meta.category,
          weeks: own.length,
          lessons: own.reduce((sum, s) => sum + (s.lessons?.length || 0), 0),
          programmes: programmes.filter((p) => p.programType === value).map((p) => p.name),
        };
      })
    );
  }),

  http.get(`${BASE}/stages`, ({ request }) => {
    const programType = new URL(request.url).searchParams.get("programType");
    if (!programType) return badRequest("programType is required");
    return json(stagesOf(programType));
  }),

  http.post(`${BASE}/stages`, async ({ request }) => {
    const body = await readJson(request);
    if (!body.programType || !String(body.name || "").trim()) {
      return badRequest("programType and name are required");
    }
    const stage = {
      id: newId(`plan-${body.programType}`),
      programType: body.programType,
      name: String(body.name).trim(),
      order: Number.isFinite(body.order) ? body.order : stagesOf(body.programType).length,
      lessons: [],
    };
    return json(db.insert("coursePlanStages", stage), { status: 201 });
  }),

  http.put(`${BASE}/stages/reorder`, async ({ request }) => {
    const { stageIds = [] } = await readJson(request);
    stageIds.forEach((id, order) => db.update("coursePlanStages", id, { order }));
    return noContent();
  }),

  http.patch(`${BASE}/stages/:id`, async ({ params, request }) => {
    if (!db.get("coursePlanStages", params.id)) return notFound("Week not found");
    const body = await readJson(request);
    return json(db.update("coursePlanStages", params.id, pick(body, ["name"])));
  }),

  http.delete(`${BASE}/stages/:id`, ({ params }) => {
    const stage = db.get("coursePlanStages", params.id);
    if (!stage) return notFound("Week not found");
    db.remove("coursePlanStages", params.id);
    stagesOf(stage.programType).forEach((s, order) => db.update("coursePlanStages", s.id, { order }));
    return noContent();
  }),

  http.post(`${BASE}/stages/:id/lessons`, async ({ params, request }) => {
    const stage = db.get("coursePlanStages", params.id);
    if (!stage) return notFound("Week not found");
    const body = await readJson(request);
    const lesson = {
      id: newId(`${stage.id}-l`),
      stageId: stage.id,
      name: String(body.name || "New lesson").trim(),
      goal: body.goal || "",
      homework: body.homework || "",
      durationMinutes: body.durationMinutes || 120,
      order: stage.lessons.length,
    };
    db.update("coursePlanStages", stage.id, { lessons: [...stage.lessons, lesson] });
    return json(lesson, { status: 201 });
  }),

  http.put(`${BASE}/stages/:id/lessons/reorder`, async ({ params, request }) => {
    const stage = db.get("coursePlanStages", params.id);
    if (!stage) return notFound("Week not found");
    const { lessonIds = [] } = await readJson(request);
    const lessons = stage.lessons.map((l) => ({ ...l, order: lessonIds.indexOf(l.id) }));
    db.update("coursePlanStages", stage.id, { lessons });
    return noContent();
  }),

  http.patch(`${BASE}/lessons/:id`, async ({ params, request }) => {
    const found = findLesson(params.id);
    if (!found) return notFound("Lesson not found");
    const body = await readJson(request);
    const updated = { ...found.lesson, ...pick(body, LESSON_FIELDS) };
    db.update("coursePlanStages", found.stage.id, {
      lessons: found.stage.lessons.map((l) => (l.id === params.id ? updated : l)),
    });
    return json(updated);
  }),

  http.delete(`${BASE}/lessons/:id`, ({ params }) => {
    const found = findLesson(params.id);
    if (!found) return notFound("Lesson not found");
    const lessons = found.stage.lessons
      .filter((l) => l.id !== params.id)
      .sort((a, b) => a.order - b.order)
      .map((l, order) => ({ ...l, order }));
    db.update("coursePlanStages", found.stage.id, { lessons });
    return noContent();
  }),
];
