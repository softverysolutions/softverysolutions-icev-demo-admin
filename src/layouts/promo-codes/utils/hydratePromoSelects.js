import { CountryService } from "services/countryService";
import { SchoolService } from "services/schoolService";
import { CampusService } from "services/campusService";
import { CourseService } from "services/courseService";
import { ServiceService } from "services/serviceService";
import { AccommodationService } from "services/accommodationService";

async function mapIds(ids, resolver) {
  const list = ids || [];
  const results = await Promise.all(
    list.map(async (id) => {
      try {
        const opt = await resolver(id);
        return opt || { value: id, label: id };
      } catch {
        return { value: id, label: id };
      }
    })
  );
  return results;
}

export async function hydrateEligibilityFromDto(dto) {
  const rule = dto.eligibilityRule || {};

  const [countries, campuses, programs, selectedAccommodations, selectedServices] = await Promise.all([
    mapIds(rule.countryIds, async (id) => {
      const c = await CountryService.getCountryById(id);
      return c ? { value: c.id, label: c.name || id } : null;
    }),
    mapIds(rule.campusIds, async (id) => {
      const c = await CampusService.getCampusById(id);
      return c
        ? { value: c.id, label: c.name || id, countryId: c.countryId, schoolId: c.schoolId }
        : null;
    }),
    mapIds(rule.courseIds, async (id) => {
      const c = await CourseService.getCourseById(id);
      if (!c) return null;
      const label = c.title || c.name || id;
      return { value: c.id, label, campusId: c.campusId };
    }),
    mapIds(rule.accommodationIds, async (id) => {
      const a = await AccommodationService.getAccommodationById(id);
      if (!a) return null;
      const campusId =
        a.campusId || (Array.isArray(a.campuses) && a.campuses[0] && a.campuses[0].campusId) || null;
      const countryId = a.countryId || (a.city && a.city.countryId);
      return {
        value: a.id,
        label: a.name || id,
        countryId,
        campusId,
      };
    }),
    mapIds(rule.serviceIds, async (id) => {
      const s = await ServiceService.getServiceById(id);
      return s ? { value: s.id, label: s.name || id } : null;
    }),
  ]);

  const schoolIds = new Set();
  campuses.forEach((c) => {
    if (c?.schoolId) schoolIds.add(c.schoolId);
  });

  let schools = await mapIds([...schoolIds], async (id) => {
    const s = await SchoolService.getSchoolById(id);
    return s ? { value: s.id, label: s.name || id, countryId: s.countryId } : null;
  });

  if (schoolIds.size === 0 && rule.courseIds?.length) {
    const { default: OptimizedDataService } = await import("services/optimizedDataService");
    const related = await OptimizedDataService.getRelatedDataForCourses(rule.courseIds);
    if (related.schools?.length) {
      schools = related.schools;
    }
  }

  let accommodationCountryFilter = null;
  let accommodationCampusFilter = null;
  if (rule.accommodationIds?.length) {
    const firstAcc = await AccommodationService.getAccommodationById(rule.accommodationIds[0]);
    if (firstAcc) {
      const countryId = firstAcc.countryId || (firstAcc.city && firstAcc.city.countryId);
      const campusId =
        firstAcc.campusId ||
        (Array.isArray(firstAcc.campuses) && firstAcc.campuses[0] && firstAcc.campuses[0].campusId);
      if (countryId) {
        const co = await CountryService.getCountryById(countryId);
        if (co) {
          accommodationCountryFilter = { value: co.id, label: co.name || countryId };
        }
      }
      if (campusId) {
        const cp = await CampusService.getCampusById(campusId);
        if (cp) {
          accommodationCampusFilter = {
            value: cp.id,
            label: cp.name || campusId,
            countryId: cp.countryId,
            schoolId: cp.schoolId,
          };
        }
      }
    }
  } else if (dto.applyingScope === "ACCOMMODATION" && rule.campusIds?.length) {
    const campusId = rule.campusIds[0];
    const cp = await CampusService.getCampusById(campusId);
    if (cp) {
      accommodationCampusFilter = {
        value: cp.id,
        label: cp.name || campusId,
        countryId: cp.countryId,
        schoolId: cp.schoolId,
      };
      if (cp.countryId) {
        const co = await CountryService.getCountryById(cp.countryId);
        if (co) {
          accommodationCountryFilter = { value: co.id, label: co.name || cp.countryId };
        }
      }
    }
  }

  return {
    countries,
    schools,
    campuses,
    programs,
    selectedAccommodations,
    selectedServices,
    accommodationCountryFilter,
    accommodationCampusFilter,
  };
}
