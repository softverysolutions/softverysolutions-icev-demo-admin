// Start-date helpers for programmes. Every programme books at least 30 days ahead, on a Monday.
const MIN_DAYS_AHEAD = 30;

export const getNextMondayOnOrAfter = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  if (day === 1) return d;
  const add = day === 0 ? 1 : 8 - day;
  d.setDate(d.getDate() + add);
  return d;
};

export const getCourseStartMinDate = () => {
  const minFromToday = new Date();
  minFromToday.setDate(minFromToday.getDate() + MIN_DAYS_AHEAD);
  return getNextMondayOnOrAfter(minFromToday);
};

export const disableNonMonday = (date) => date.getDay() !== 1;

export const getCourseStartEarliestDate = () => {
  const earliest = new Date();
  earliest.setHours(0, 0, 0, 0);
  earliest.setDate(earliest.getDate() + MIN_DAYS_AHEAD);
  return earliest;
};

const toLocalDateOnly = (date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate()
  ).padStart(2, "0")}`;

const WEEKDAY_TO_JS_DAY = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const getRepeatEvery = (pattern) => Math.abs(Number(pattern.repeatEvery) || 1);

const getWeekDayStarts = (pattern, firstStart, until) => {
  const step = getRepeatEvery(pattern) * 7;
  return (pattern.weekDays || []).flatMap(({ weekDay } = {}) => {
    const targetDay = WEEKDAY_TO_JS_DAY[String(weekDay).toLowerCase()];
    if (targetDay === undefined) return [];
    const starts = [];
    let cursor = addDays(firstStart, (targetDay + 7 - firstStart.getDay()) % 7);
    while (toLocalDateOnly(cursor) <= until) {
      starts.push(toLocalDateOnly(cursor));
      cursor = addDays(cursor, step);
    }
    return starts;
  });
};

const getMonthDayStarts = (pattern, firstStart, until) => {
  const step = getRepeatEvery(pattern);
  return (pattern.monthDays || []).flatMap(({ dayOfMonth } = {}) => {
    if (!(dayOfMonth >= 1 && dayOfMonth <= 31)) return [];
    const year = firstStart.getFullYear();
    let month = firstStart.getMonth();
    if (dayOfMonth > getDaysInMonth(year, month) || dayOfMonth < firstStart.getDate()) {
      month += 1;
      while (getDaysInMonth(year, month) < dayOfMonth) month += 1;
    }
    const starts = [];
    let cursor = new Date(year, month, dayOfMonth, 12);
    while (toLocalDateOnly(cursor) <= until) {
      starts.push(toLocalDateOnly(cursor));
      month += step;
      cursor = new Date(year, month, Math.min(dayOfMonth, getDaysInMonth(year, month)), 12);
    }
    return starts;
  });
};

/**
 * The programme start days implied by its weekly pattern and manual (cohort) dates, up to `until` (YYYY-MM-DD).
 */
export const getCourseStartDatesFromSchedule = (course, until) => {
  const firstStart = parseDateOnlyLocal(course?.firstStartDate);
  const patternStarts = firstStart
    ? (course.startPatterns || []).flatMap((pattern) => {
        if (pattern?.patternType === "weekDay") {
          return getWeekDayStarts(pattern, firstStart, until);
        }
        if (pattern?.patternType === "monthDay") {
          return getMonthDayStarts(pattern, firstStart, until);
        }
        return [];
      })
    : [];
  const manualStarts = (course?.startManuals || [])
    .map((manual) => String(manual?.startDate || manual || "").slice(0, 10))
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= until);

  return [...new Set([...patternStarts, ...manualStarts])].sort();
};

export const getCourseStartDateDisableFn = (dates, earliestDate) => {
  if (!dates) return () => true;
  const allowed = new Set(dates);
  const earliest = earliestDate ? toLocalDateOnly(earliestDate) : "";
  return (date) => {
    const day = toLocalDateOnly(date);
    return day < earliest || !allowed.has(day);
  };
};

export const parseDateOnlyLocal = (value) => {
  if (value == null || value === "") return null;
  const s = String(value).trim();
  if (!s) return null;
  const datePart = s.length >= 10 ? s.slice(0, 10) : s;
  const parts = datePart.split("-");
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10);
    const d = parseInt(parts[2], 10);
    if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
      return new Date(y, m - 1, d, 12, 0, 0, 0);
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const isSameCalendarDayLocal = (a, b) => {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

export const withStartDatePickerException = (baseDisable, currentStartRaw) => {
  const base = typeof baseDisable === "function" ? baseDisable : () => false;
  if (currentStartRaw == null || currentStartRaw === "") return base;
  return (date) => {
    const current = parseDateOnlyLocal(currentStartRaw);
    if (current && !Number.isNaN(current.getTime()) && isSameCalendarDayLocal(date, current)) {
      return false;
    }
    return base(date);
  };
};

// The app's defaults: weekly programmes start any Monday from a month out; cohorts every six weeks.
export const firstWeeklyStartDate = () => toLocalDateOnly(getCourseStartMinDate());

export const cohortStartDates = (count = 6) => {
  const first = getCourseStartMinDate();
  return Array.from({ length: count }, (_, i) => toLocalDateOnly(addDays(first, i * 42)));
};
