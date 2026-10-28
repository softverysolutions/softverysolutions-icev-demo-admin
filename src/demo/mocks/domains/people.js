// Mock API for customers, the team (operators) and the signed-in profile.
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
  daysAgoIso,
  nowIso,
  newId,
} from "../utils";

// Team ids match the demo sign-in operators in src/demo/session.js.
const TEAM = [
  { id: "team-mara", firstName: "Mara", lastName: "Keller", email: "mara.keller@softvery.example", role: "SuperAdmin", isActive: true, created: 300, seen: 0 },
  { id: "team-jonas", firstName: "Jonas", lastName: "Weber", email: "jonas.weber@softvery.example", role: "Admin", isActive: true, created: 240, seen: 0 },
  { id: "team-sofia", firstName: "Sofia", lastName: "Lindqvist", email: "sofia.lindqvist@softvery.example", role: "Consultant", isActive: true, created: 180, seen: 1 },
  { id: "team-priya", firstName: "Priya", lastName: "Nair", email: "priya.nair@softvery.example", role: "Admin", isActive: true, created: 120, seen: 2 },
  { id: "team-ben", firstName: "Ben", lastName: "Carter", email: "ben.carter@softvery.example", role: "Consultant", isActive: true, created: 90, seen: 4 },
  { id: "team-elif", firstName: "Elif", lastName: "Yilmaz", email: "elif.yilmaz@softvery.example", role: "Consultant", isActive: false, created: 210, seen: 64 },
];

const API_ROLES = ["SuperAdmin", "Admin", "Consultant"];

export function seed() {
  return {
    users: TEAM.map(({ created, seen, ...member }) => ({
      ...member,
      createdAt: daysAgoIso(created),
      updatedAt: daysAgoIso(seen),
      lastActivityAt: daysAgoIso(seen, 9),
    })),
  };
}

const withOrderCount = (customer) => ({
  ...customer,
  travelsCount: db.filter("orders", (o) => o.userId === customer.id).length,
  lastActivityDate: customer.updatedAt,
});

const findPerson = (id) => db.get("users", id) || db.get("customers", id);

const activeSuperAdmins = (exceptId) =>
  db.filter("users", (u) => u.role === "SuperAdmin" && u.isActive && u.id !== exceptId).length;

const errorResponse = (status, code, message) => json({ statusCode: status, code, message }, { status });

export const handlers = [
  http.get(`${API}/currencies`, () => json([{ code: "EUR", symbol: "€", name: "Euro" }])),
  http.get(`${API}/health`, () => json({ status: "ok" })),

  // Customers
  http.post(`${API}/admin/users/search`, async ({ request }) => {
    const body = await readJson(request);
    let rows = db.all("customers").map(withOrderCount);
    if (body.search) {
      rows = rows.filter((c) =>
        [`${c.firstName} ${c.lastName}`, c.email].some((v) => includesText(v, body.search))
      );
    }
    rows = sortBy(rows, body.sortBy || "createdAt", body.sortDirection || "desc");
    return json(paginate(rows, body));
  }),
  http.get(`${API}/admin/users/:id`, ({ params }) => {
    const person = findPerson(params.id);
    if (!person) return notFound("User not found");
    return json(person.role === "Customer" ? withOrderCount(person) : person);
  }),
  http.get(`${API}/users/:id`, ({ params }) => {
    const person = findPerson(params.id);
    return person ? json(person) : notFound("User not found");
  }),

  // Team and roles
  http.post(`${API}/admin/users/admin-management/search`, async ({ request }) => {
    const body = await readJson(request);
    let rows = db.all("users");
    if (Array.isArray(body.roles) && body.roles.length) rows = rows.filter((u) => body.roles.includes(u.role));
    if (body.search) {
      rows = rows.filter((u) =>
        [`${u.firstName} ${u.lastName}`, u.email].some((v) => includesText(v, body.search))
      );
    }
    rows = sortBy(rows, "createdAt", body.sortDirection || "asc");
    return json(paginate(rows, body));
  }),
  http.post(`${API}/admin/users/admin-management`, async ({ request }) => {
    const body = await readJson(request);
    if (!body.email || !body.firstName) return badRequest("First name and email are required");
    if (!API_ROLES.includes(body.role)) return badRequest("Unknown role");
    const email = String(body.email).trim().toLowerCase();
    if (db.find("users", (u) => u.email.toLowerCase() === email)) {
      return errorResponse(409, "USER_ALREADY_EXISTS", "A team member with this email already exists");
    }
    const now = nowIso();
    const member = {
      id: newId("team"),
      firstName: body.firstName,
      lastName: body.lastName || "",
      email,
      role: body.role,
      isActive: body.isActive !== false,
      createdAt: now,
      updatedAt: now,
      lastActivityAt: null,
    };
    return json(db.insert("users", member), { status: 201 });
  }),
  http.patch(`${API}/admin/users/role`, async ({ request }) => {
    const { userId, role } = await readJson(request);
    const member = db.get("users", userId);
    if (!member) return errorResponse(404, "USER_NOT_FOUND", "User not found");
    if (!API_ROLES.includes(role)) return badRequest("Unknown role");
    if (member.role === "SuperAdmin" && role !== "SuperAdmin" && activeSuperAdmins(userId) === 0) {
      return errorResponse(400, "USER_UNAUTHORIZED_SUPER_ADMIN_CREATION", "At least one active Super Admin is required");
    }
    return json(db.update("users", userId, { role }));
  }),
  http.patch(`${API}/admin/users/admin-management/:id/deactivate`, ({ params }) => {
    const member = db.get("users", params.id);
    if (!member) return errorResponse(404, "USER_NOT_FOUND", "User not found");
    if (!member.isActive) return badRequest("User is already inactive");
    if (member.role === "SuperAdmin" && activeSuperAdmins(params.id) === 0) {
      return badRequest("At least one active Super Admin is required");
    }
    return json(db.update("users", params.id, { isActive: false }));
  }),
  http.patch(`${API}/admin/users/admin-management/:id/activate`, ({ params }) => {
    const member = db.get("users", params.id);
    if (!member) return errorResponse(404, "USER_NOT_FOUND", "User not found");
    return json(db.update("users", params.id, { isActive: true }));
  }),
];
