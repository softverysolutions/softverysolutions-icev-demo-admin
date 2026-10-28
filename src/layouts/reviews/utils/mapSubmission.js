function userName(user) {
  if (!user) return "Unknown participant";
  const full = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return full || user.email || "Unknown participant";
}

export function mapSubmission(item) {
  return {
    id: item.travelId,
    travelId: item.travelId,
    orderNumber: item.orderNumber || "",
    status: item.status,
    user: item.user,
    userName: userName(item.user),
    avatarUrl: item.user?.avatarUrl || "",
    submittedAt: item.createdAt,
    isFixedPackage: !!item.isFixedPackage,
    campusId: item.campusId,
    courseId: item.courseId,
    schoolName: item.schoolTitle || "",
    campusName: item.campusTitle || "",
    courseName: item.courseTitle || "",
    cityName: item.cityTitle || "",
    category: item.category || "",
    ratings: item.ratings || {},
    rating: typeof item.totalRating === "number" ? item.totalRating : null,
    comment: item.comment || "",
  };
}
