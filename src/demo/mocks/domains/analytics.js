// Mock API for the analytics dashboard: plausible, deterministic numbers for the selected
// period (7 days, 30 days, 12 months) with card and wallet payments only.
import { http } from "msw";
import { db } from "../db";
import { API, json, readJson, toDay } from "../utils";

// Small deterministic generator so the same period always shows the same numbers.
function generator(seed) {
  let state = seed % 2147483647 || 1;
  return () => {
    state = (state * 48271) % 2147483647;
    return state / 2147483647;
  };
}

// Relative demand per month (Jan..Dec): ski in winter, surf and camps in summer, tech all year.
const SEASON = [1.05, 1.0, 0.95, 1.0, 1.1, 1.25, 1.35, 1.3, 1.15, 1.05, 0.9, 0.85];

const AVG = { courses: 2350, accommodation: 980, services: 310 };
const DAYS_PER_MONTH = 30;

function bucket(date, weight, rnd) {
  const orders = Math.max(0, Math.round(weight * (7 + rnd() * 8)));
  const scale = orders * (0.85 + rnd() * 0.3);
  const split = (avg) => Math.round(avg * scale);
  return {
    date,
    orders,
    statuses: {
      registration: Math.round(orders * 0.38),
      readyForTheStart: Math.round(orders * 0.24),
      inProgress: Math.round(orders * 0.18),
      finished: Math.round(orders * 0.14),
    },
    courses: split(AVG.courses),
    accommodation: split(AVG.accommodation),
    services: split(AVG.services),
  };
}

function series(period) {
  const now = new Date();
  if (period === "last_year" || period === "total") {
    const rnd = generator(now.getFullYear() * 100 + now.getMonth());
    return {
      granularity: "month",
      rows: Array.from({ length: 12 }, (_, i) => {
        const d = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
        return bucket(toDay(d), SEASON[d.getMonth()] * DAYS_PER_MONTH, rnd);
      }),
    };
  }
  const days = period === "last_week" ? 7 : 30;
  const rnd = generator(Number(toDay(now).replace(/-/g, "")) + days);
  return {
    granularity: "day",
    rows: Array.from({ length: days }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1) + i);
      const weekend = d.getDay() === 0 || d.getDay() === 6 ? 0.7 : 1;
      return bucket(toDay(d), SEASON[d.getMonth()] * weekend, rnd);
    }),
  };
}

export function seed() {
  return {};
}

export const handlers = [
  http.post(`${API}/admin/analytics`, async ({ request }) => {
    const body = await readJson(request);
    const period = body.travelFilter?.period || "last_month";
    const { granularity, rows } = series(period);
    const totalOrders = rows.reduce((sum, r) => sum + r.orders, 0);
    const revenueTotal = rows.reduce((sum, r) => sum + r.courses + r.accommodation + r.services, 0);
    const failed = Math.round(totalOrders * 0.04);
    const refunded = Math.round(totalOrders * 0.03);
    const customers = db.all("customers").length;

    return json({
      totalUsers: 18640 + customers,
      totalPurchasers: 5210 + db.all("orders").length,
      totalOrders,
      revenueTotal,
      travel: {
        granularity,
        data: rows.map(({ date, statuses }) => ({ date, statuses })),
      },
      revenue: {
        granularity,
        data: rows.map(({ date, courses, accommodation, services }) => ({
          date,
          courses,
          accommodation,
          services,
        })),
      },
      payment: {
        total: totalOrders,
        byStatus: { success: totalOrders - failed - refunded, failed, refunded },
        byMethod: { card: Math.round(totalOrders * 0.68), wallet: totalOrders - Math.round(totalOrders * 0.68) },
      },
    });
  }),
];
