export const KNOWN_ROLES = ["super_admin", "admin", "consultant"];

// Unknown or missing roles fall back to the most restricted role (consultant), never to admin.
export function normalizeRole(role) {
  if (role == null || role === "") return "consultant";
  let r = String(role).trim().toLowerCase().replace(/\s+/g, "_");
  if (r === "superadmin") r = "super_admin";
  return KNOWN_ROLES.includes(r) ? r : "consultant";
}
