export function formatPeriod(start, end) {
  const opts = { month: "short", day: "numeric", year: "numeric" };
  try {
    const a = new Date(start).toLocaleDateString("en-US", opts);
    const b = new Date(end).toLocaleDateString("en-US", opts);
    return `${a} → ${b}`;
  } catch {
    return "—";
  }
}
