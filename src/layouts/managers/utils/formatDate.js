export function formatTableDate(value) {
  if (value == null || value === "") return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (isNaN(date.getTime())) return "—";
  return date.toISOString().split("T")[0];
}
