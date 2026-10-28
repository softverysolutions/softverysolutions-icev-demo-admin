import { CourseService } from "services/courseService";
import { CoursePriceListService } from "services/coursePriceListService";
import { CourseFeeService } from "services/courseFeeService";

export async function buildDuplicateCoursePayload(course) {
  if (!course?.id) {
    throw new Error("Course id is required for duplication");
  }

  CourseService.invalidateCourseCache(course.id);

  const fullCourseData = await CourseService.getCourseById(course.id);
  if (!fullCourseData) {
    throw new Error("Failed to load course for duplication");
  }

  let priceLists = [];
  try {
    priceLists = await CoursePriceListService.listByCourse(course.id);
  } catch (error) {
    console.warn("Price lists not available for duplication:", error.message);
  }

  let highSeasonFees = [];
  try {
    highSeasonFees = await CourseFeeService.getCourseFees(course.id);
  } catch (error) {
    console.warn("High season fees not available for duplication:", error.message);
  }

  if (!priceLists.length && Array.isArray(fullCourseData.priceLists)) {
    priceLists = fullCourseData.priceLists;
  }

  if (!highSeasonFees.length && Array.isArray(fullCourseData.highSeasonFees)) {
    highSeasonFees = fullCourseData.highSeasonFees;
  }

  return {
    ...fullCourseData,
    id: undefined,
    name: `${fullCourseData.name} (Copy)`,
    priceLists,
    highSeasonFees,
  };
}
