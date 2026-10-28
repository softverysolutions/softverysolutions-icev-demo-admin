export function mapTravelExperiences(travelData) {
  const rows = travelData?.travelExperiences ?? travelData?.experiences ?? [];
  if (!Array.isArray(rows) || rows.length === 0) return [];

  return [...rows]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((row) => {
      const exp = row.experience || {};
      const id = row.experienceId || exp.id || row.id;
      if (!id) return null;
      return {
        id,
        travelExperienceId: row.id,
        name: exp.name || row.name || "Experience",
        type: exp.type || null,
        location: exp.location || null,
        duration: exp.duration || null,
      };
    })
    .filter(Boolean);
}
