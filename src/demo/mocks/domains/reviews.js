// Mock API for review moderation. One review per finished booking, rated on the five
// Tech & Sport categories (instructors, curriculum, facilities, equipment, organisation).
import { http } from "msw";
import { db } from "../db";
import { API, json, notFound, readJson, paginate, includesText, daysAgoIso, demoImage } from "../utils";

const CRITERIA = ["instructors", "curriculum", "facilities", "equipment", "organisation"];

// [programmeId, memberIndex, ratings (same order as CRITERIA), status, daysAgo, comment]
const REVIEWS = [
  ["web-dev-berlin", 0, [5, 5, 4, 5, 5], "pending", 1, "Twelve intense weeks and I now ship React and Node apps on my own. The mentors reviewed every pull request and the demo day got me two interviews."],
  ["surf-camp-ericeira", 1, [5, 4, 5, 5, 4], "pending", 2, "Perfect first surf week. Boards and wetsuits were in great shape and the coaches picked the right beach for our level every single morning."],
  ["ux-ui-sprint-barcelona", 2, [4, 5, 4, 4, 5], "pending", 3, "Loved the research-to-prototype flow. Figma sessions were hands-on and the final usability test with real users was the highlight."],
  ["data-science-ai-amsterdam", 3, [5, 5, 4, 4, 4], "pending", 4, "Great balance of statistics and machine learning. The capstone with a real dataset from a partner company made it feel like a job."],
  ["tennis-camp-valencia", 4, [4, 4, 5, 4, 3], "pending", 5, "Excellent courts and coaching. The schedule changed twice in the first week, which was a bit confusing, but it settled down."],
  ["ski-camp-innsbruck", 5, [5, 4, 4, 3, 5], "pending", 6, "Fantastic instructors and fresh snow all week. Rental skis were okay but the boots could be newer. Would come back for the instructor course."],
  ["cybersecurity-london", 6, [5, 5, 4, 5, 5], "approved", 9, "The lab environment is superb: we attacked and defended real infrastructure every day. Instructors are working security engineers."],
  ["football-academy-barcelona", 7, [5, 4, 5, 5, 5], "approved", 12, "Top-level facilities and video analysis after every session. My first touch and positioning improved a lot in three weeks."],
  ["yoga-teacher-lisbon", 8, [5, 5, 5, 4, 5], "approved", 15, "A beautiful studio and a very well structured 200-hour programme. Practice teaching from week two built my confidence quickly."],
  ["mobile-dev-valencia", 9, [4, 5, 4, 5, 4], "approved", 18, "Published my first app to the stores by week eight. Loaner devices for testing were a nice touch."],
  ["web-dev-lisbon", 10, [5, 4, 4, 5, 5], "approved", 21, "Coding by day, surfing by evening. The cohort was international and the career coaching afterwards really helped."],
  ["surf-yoga-ericeira", 11, [5, 4, 5, 4, 5], "approved", 25, "Morning yoga, afternoon surf, great food at the house. The organisation was flawless from airport pickup to the last session."],
  ["ml-engineering-berlin", 0, [4, 5, 4, 4, 4], "approved", 30, "Deep dive into MLOps and model deployment. Demanding but fair, and the GPU cluster for projects was a great resource."],
  ["snowboard-camp-innsbruck", 2, [5, 4, 4, 5, 4], "approved", 34, "Went from falling every turn to linking carves on red runs. Equipment rental at the base was quick and the boards were brand new."],
  ["product-design-barcelona", 4, [3, 4, 4, 4, 3], "declined", 10, "Good course overall. Message me on +34 600 000 000 and I'll share my notes and the course files for cheap."],
  ["fitness-instructor-barcelona", 6, [2, 2, 3, 3, 2], "declined", 14, "Not what I expected, I actually booked a different city and this review is for my hotel."],
  ["ethical-hacking-london", 8, [4, 4, 3, 4, 4], "hidden", 40, "Good labs. One of the instructors shared a tool that later turned out to be against the venue rules, so I'd rather not name them here."],
  ["football-camp-valencia", 10, [4, 4, 4, 4, 4], "hidden", 45, "Solid camp. Duplicate of the review I already left last month."],
];

const average = (values) => Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;

export function seed({ catalog, community }) {
  const byId = (list) => Object.fromEntries(list.map((item) => [item.id, item]));
  const programmes = byId(catalog.programmes);
  const campuses = byId(catalog.campuses);
  const providers = byId(catalog.providers);
  const cities = byId(catalog.cities);
  const packageProgrammes = new Set(catalog.packages.map((p) => p.programmeId));

  const reviews = REVIEWS.map(([programmeId, memberIndex, scores, status, daysAgo, comment], index) => {
    const programme = programmes[programmeId];
    const campus = campuses[programme.campusId];
    const member = community.members[memberIndex];
    const [firstName, ...rest] = member.name.split(" ");
    const id = `review-${String(index + 1).padStart(2, "0")}`;
    const createdAt = daysAgoIso(daysAgo, 9 + (index % 8));
    return {
      id,
      travelId: id,
      orderNumber: `SD-${2410 + index * 7}`,
      status,
      createdAt,
      moderatedAt: status === "pending" ? null : daysAgoIso(Math.max(0, daysAgo - 1), 15),
      user: {
        id: `customer-${member.id.replace(/^m-/, "")}`,
        firstName,
        lastName: rest.join(" "),
        email: `${member.name.toLowerCase().replace(/[^a-z]+/g, ".")}@example.com`,
        avatarUrl: demoImage(member.avatar),
      },
      isFixedPackage: packageProgrammes.has(programmeId) && index % 3 === 0,
      campusId: campus.id,
      courseId: programme.id,
      schoolId: campus.providerId,
      schoolTitle: providers[campus.providerId].name,
      campusTitle: campus.name,
      courseTitle: programme.name,
      cityTitle: cities[campus.cityId].name,
      category: programme.category,
      ratings: Object.fromEntries(CRITERIA.map((key, i) => [key, scores[i]])),
      totalRating: average(scores),
      comment,
      blocked: false,
    };
  });

  return { reviews };
}

export const handlers = [
  http.post(`${API}/admin/reviews/search`, async ({ request }) => {
    const body = await readJson(request);
    const statuses = Array.isArray(body.status) ? body.status : body.status ? [body.status] : null;
    let list = db
      .all("reviews")
      .filter((r) => !statuses || statuses.includes(r.status))
      .filter((r) => !body.campusId || r.campusId === body.campusId)
      .filter((r) => !body.courseId || r.courseId === body.courseId)
      .filter((r) => !body.fixedPackageOnly || r.isFixedPackage)
      .filter(
        (r) =>
          !body.search ||
          [r.comment, r.courseTitle, r.schoolTitle, r.user.firstName, r.user.lastName, r.cityTitle].some(
            (value) => includesText(value, body.search)
          )
      );
    list = list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const page = paginate(list, { page: body.page, limit: body.limit || 20 });
    page.meta.hasNextPage = page.meta.currentPage < page.meta.totalPages;
    return json(page);
  }),

  http.patch(`${API}/admin/reviews/:id/status`, async ({ params, request }) => {
    const { status } = await readJson(request);
    const review = db.get("reviews", params.id);
    if (!review) return notFound("Review not found");
    return json(db.update("reviews", params.id, { status, moderatedAt: new Date().toISOString() }));
  }),

  // Lets the participant of an order submit a fresh review (e.g. after a support case).
  http.post(`${API}/admin/orders/:orderId/review/unblock`, ({ params }) => {
    const review = db.get("reviews", params.orderId);
    if (review) db.update("reviews", params.orderId, { blocked: false, unblockedAt: new Date().toISOString() });
    return json({ success: true, orderId: params.orderId });
  }),
];
