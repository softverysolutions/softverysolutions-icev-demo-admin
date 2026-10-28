import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ReviewsService } from "services/reviewsService";
import { REVIEW_STATUS, STATUS_TABS } from "../constants";
import { mapSubmission } from "../utils/mapSubmission";

const PAGE_SIZE = 20;
const EMPTY_FILTERS = { campusId: "", courseId: "", fixedPackageOnly: false };

const filtersKey = (f) => `${f.campusId}|${f.courseId}|${f.fixedPackageOnly ? 1 : 0}`;
const keyFor = (status, search, filters) => `${status}|${search.trim()}|${filtersKey(filters)}`;

function buildBody(status, search, filters, page) {
  return {
    status: [status],
    page,
    limit: PAGE_SIZE,
    sortBy: "createdAt",
    sortDirection: "desc",
    search: search.trim() || undefined,
    campusId: filters.campusId || undefined,
    courseId: filters.courseId || undefined,
    fixedPackageOnly: filters.fixedPackageOnly || undefined,
  };
}

export function useReviews() {
  const [activeStatus, setActiveStatus] = useState(REVIEW_STATUS.PENDING);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [filterOptions, setFilterOptions] = useState({ campuses: [], courses: [] });

  // Cache accumulated results per (status + search + filters) so re-selecting an
  // unchanged tab reuses the previous response instead of refetching.
  const cacheRef = useRef(new Map());

  const loadFirst = useCallback(
    async (status, term, flt, { force = false } = {}) => {
      const key = keyFor(status, term, flt);
      if (!force && cacheRef.current.has(key)) {
        const c = cacheRef.current.get(key);
        setRows(c.rows);
        setPage(c.page);
        setHasMore(c.hasMore);
        setCounts((prev) => ({ ...prev, [status]: c.total }));
        setLoading(false);
        setError("");
        return;
      }
      setLoading(true);
      setError("");
      try {
        const res = await ReviewsService.search(buildBody(status, term, flt, 1));
        const mapped = (res?.data || []).map(mapSubmission);
        const meta = res?.meta || {};
        setRows(mapped);
        setPage(meta.currentPage || 1);
        setHasMore(!!meta.hasNextPage);
        setCounts((prev) => ({ ...prev, [status]: meta.totalItems ?? mapped.length }));
        cacheRef.current.set(key, {
          rows: mapped,
          page: meta.currentPage || 1,
          hasMore: !!meta.hasNextPage,
          total: meta.totalItems ?? mapped.length,
        });
      } catch (err) {
        setError(err.message || "Failed to load reviews.");
        setRows([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadFirst(activeStatus, search, filters);
  }, [activeStatus, search, filters, loadFirst]);

  // All four tab counts (cheap limit:1 calls). Runs on mount and when the
  // search/filters change — not on tab switch (a tab switch doesn't change them).
  const loadCounts = useCallback(async (term, flt) => {
    const results = await Promise.all(
      STATUS_TABS.map((t) =>
        ReviewsService.search({ ...buildBody(t.value, term, flt, 1), limit: 1 })
          .then((res) => [t.value, res?.meta?.totalItems ?? 0])
          .catch(() => [t.value, undefined])
      )
    );
    setCounts((prev) => {
      const next = { ...prev };
      results.forEach(([k, v]) => {
        if (v !== undefined) next[k] = v;
      });
      return next;
    });
  }, []);

  useEffect(() => {
    loadCounts(search, filters);
  }, [search, filters, loadCounts]);

  // Distinct campuses/courses that actually have reviews — one facet fetch.
  useEffect(() => {
    ReviewsService.search({ page: 1, limit: 200 })
      .then((res) => {
        const campuses = new Map();
        const courses = new Map();
        (res?.data || []).forEach((it) => {
          if (it.campusId && !campuses.has(it.campusId)) {
            campuses.set(it.campusId, it.campusTitle || it.campusId);
          }
          if (it.courseId && !courses.has(it.courseId)) {
            courses.set(it.courseId, it.courseTitle || it.courseId);
          }
        });
        const toOpts = (m) => [...m.entries()].map(([value, label]) => ({ value, label }));
        setFilterOptions({ campuses: toOpts(campuses), courses: toOpts(courses) });
      })
      .catch(() => setFilterOptions({ campuses: [], courses: [] }));
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const next = page + 1;
      const res = await ReviewsService.search(buildBody(activeStatus, search, filters, next));
      const mapped = (res?.data || []).map(mapSubmission);
      const meta = res?.meta || {};
      setRows((prev) => {
        const merged = [...prev, ...mapped];
        cacheRef.current.set(keyFor(activeStatus, search, filters), {
          rows: merged,
          page: meta.currentPage || next,
          hasMore: !!meta.hasNextPage,
          total: meta.totalItems ?? merged.length,
        });
        return merged;
      });
      setPage(meta.currentPage || next);
      setHasMore(!!meta.hasNextPage);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [activeStatus, search, filters, page, hasMore, loadingMore]);

  const reload = useCallback(
    () => loadFirst(activeStatus, search, filters, { force: true }),
    [activeStatus, search, filters, loadFirst]
  );

  const applyStatus = useCallback(
    async (row, toStatus) => {
      const fromStatus = row.status;
      await ReviewsService.updateStatus(row.travelId, toStatus);
      // Drop cache + counts for the two affected tabs so they refetch fresh.
      [fromStatus, toStatus].forEach((st) => {
        [...cacheRef.current.keys()].forEach((k) => {
          if (k.startsWith(`${st}|`)) cacheRef.current.delete(k);
        });
      });
      await Promise.all([
        loadFirst(activeStatus, search, filters, { force: true }),
        loadCounts(search, filters),
      ]);
    },
    [activeStatus, search, filters, loadFirst, loadCounts]
  );

  const unblock = useCallback((travelId) => ReviewsService.unblockForOrder(travelId), []);

  const changeStatusTab = useCallback((status) => setActiveStatus(status), []);
  const changeSearch = useCallback((value) => setSearch(value), []);
  const changeFilter = useCallback((name, value) => {
    setFilters((prev) => ({ ...prev, [name]: value }));
  }, []);
  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS);
    setSearch("");
  }, []);

  const hasActiveFilters = useMemo(
    () => !!(search.trim() || filters.campusId || filters.courseId || filters.fixedPackageOnly),
    [search, filters]
  );

  return {
    activeStatus,
    changeStatusTab,
    search,
    changeSearch,
    filters,
    changeFilter,
    clearFilters,
    hasActiveFilters,
    filterOptions,
    rows,
    hasMore,
    loadMore,
    loadingMore,
    counts,
    loading,
    error,
    reload,
    applyStatus,
    unblock,
  };
}
