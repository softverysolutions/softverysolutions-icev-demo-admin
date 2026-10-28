// Mock API for community moderation: the posts from the Softvery Demo app's Community tab,
// with member reports. Moderators keep (dismiss reports), hide or restore posts.
import { http } from "msw";
import { db } from "../db";
import { API, json, notFound, readJson, paginate, includesText, demoImage } from "../utils";

export const POST_STATUS = { FLAGGED: "flagged", PUBLISHED: "published", HIDDEN: "hidden" };

// Seed posts that members reported, and posts a moderator already hid.
const FLAGGED = {
  "post-06": [{ reason: "Off-topic", count: 2 }],
  "post-13": [{ reason: "Misleading information", count: 1 }],
  "post-21": [{ reason: "Off-topic", count: 1 }, { reason: "Spam", count: 1 }],
};
const HIDDEN = {
  "post-27": { reports: [{ reason: "Personal information", count: 3 }], note: "Shared a phone number publicly." },
};

// Extra posts that only exist for moderation (the app rejects these before they go live).
const EXTRA_POSTS = [
  {
    id: "post-flag-01",
    author: "m-oliver",
    city: "berlin",
    tag: "careers",
    hoursAgo: 2,
    likes: 0,
    text: "Guaranteed job offer after ANY bootcamp!!! Pay 99 € for my secret CV template, link in my profile 💸💸",
    reports: [{ reason: "Spam", count: 5 }],
    status: POST_STATUS.FLAGGED,
  },
  {
    id: "post-flag-02",
    author: "m-daniel",
    city: "valencia",
    tag: "events",
    hoursAgo: 6,
    likes: 3,
    text: "Selling my spot in the Tennis Intensive for half price, payment by bank transfer only, DM me before Friday.",
    reports: [{ reason: "Suspicious offer", count: 2 }],
    status: POST_STATUS.FLAGGED,
  },
  {
    id: "post-hidden-01",
    author: "m-lucas",
    city: "lisbon",
    tag: "lifestyle",
    hoursAgo: 96,
    likes: 1,
    text: "Crypto meetup tonight, bring your wallet seed phrase so we can set you up with the new coin 🚀",
    reports: [{ reason: "Scam", count: 4 }],
    status: POST_STATUS.HIDDEN,
    note: "Scam attempt, member warned.",
  },
];

const hoursAgoIso = (hours) => new Date(Date.now() - hours * 3600 * 1000).toISOString();

export function seed({ catalog, community }) {
  const members = Object.fromEntries(community.members.map((m) => [m.id, m]));
  const cities = Object.fromEntries(catalog.cities.map((c) => [c.id, c.name]));
  const toAuthor = (memberId) => {
    const member = members[memberId];
    return { id: memberId, name: member?.name || "Member", avatarUrl: demoImage(member?.avatar) };
  };

  const build = (post, extra = {}) => ({
    id: post.id,
    author: toAuthor(post.author),
    cityId: post.city,
    cityName: cities[post.city] || post.city,
    tag: post.tag,
    text: post.text,
    imageUrl: post.image ? demoImage(post.image) : null,
    likes: post.likes || 0,
    comments: (post.comments || []).map(([memberId, text], i) => ({
      id: `${post.id}-c${i + 1}`,
      author: toAuthor(memberId),
      text,
    })),
    createdAt: hoursAgoIso(post.hoursAgo || 1),
    status: POST_STATUS.PUBLISHED,
    reports: [],
    moderationNote: "",
    moderatedAt: null,
    moderatedBy: null,
    ...extra,
  });

  const posts = community.posts.map((post) => {
    if (FLAGGED[post.id]) return build(post, { status: POST_STATUS.FLAGGED, reports: FLAGGED[post.id] });
    if (HIDDEN[post.id]) {
      return build(post, {
        status: POST_STATUS.HIDDEN,
        reports: HIDDEN[post.id].reports,
        moderationNote: HIDDEN[post.id].note,
        moderatedAt: hoursAgoIso(post.hoursAgo - 2),
        moderatedBy: "Sofia Lindqvist",
      });
    }
    return build(post);
  });

  EXTRA_POSTS.forEach(({ reports, status, note, ...post }) => {
    posts.push(
      build(post, {
        status,
        reports,
        moderationNote: note || "",
        moderatedAt: status === POST_STATUS.HIDDEN ? hoursAgoIso(post.hoursAgo - 3) : null,
        moderatedBy: status === POST_STATUS.HIDDEN ? "Jonas Weber" : null,
      })
    );
  });

  return { communityPosts: posts };
}

const reportCount = (post) => (post.reports || []).reduce((sum, r) => sum + (r.count || 1), 0);

export const handlers = [
  http.post(`${API}/admin/community/posts/search`, async ({ request }) => {
    const body = await readJson(request);
    const statuses = Array.isArray(body.status) ? body.status : body.status ? [body.status] : null;
    let list = db
      .all("communityPosts")
      .filter((p) => !statuses || statuses.includes(p.status))
      .filter((p) => !body.cityId || p.cityId === body.cityId)
      .filter((p) => !body.tag || p.tag === body.tag)
      .filter((p) => !body.search || [p.text, p.author?.name, p.cityName, p.tag].some((v) => includesText(v, body.search)))
      .map((p) => ({ ...p, reportCount: reportCount(p) }));
    // Flagged posts: most reported first; the rest newest first.
    list = list.sort((a, b) =>
      body.sortBy === "reports" && b.reportCount !== a.reportCount
        ? b.reportCount - a.reportCount
        : a.createdAt < b.createdAt
        ? 1
        : -1
    );
    const page = paginate(list, { page: body.page, limit: body.limit || 20 });
    page.meta.hasNextPage = page.meta.currentPage < page.meta.totalPages;
    return json(page);
  }),

  http.get(`${API}/admin/community/posts/:id`, ({ params }) => {
    const post = db.get("communityPosts", params.id);
    return post ? json({ ...post, reportCount: reportCount(post) }) : notFound("Post not found");
  }),

  http.patch(`${API}/admin/community/posts/:id`, async ({ params, request }) => {
    const { status, note, dismissReports, moderatedBy } = await readJson(request);
    const post = db.get("communityPosts", params.id);
    if (!post) return notFound("Post not found");
    const patch = { moderatedAt: new Date().toISOString(), moderatedBy: moderatedBy || "Demo operator" };
    if (status) patch.status = status;
    if (note !== undefined) patch.moderationNote = note;
    if (dismissReports) patch.reports = [];
    const updated = db.update("communityPosts", params.id, patch);
    return json({ ...updated, reportCount: reportCount(updated) });
  }),
];
