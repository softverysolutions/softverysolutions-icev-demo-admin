import { useCallback, useEffect, useState } from "react";
import { CommunityService } from "services/communityService";
import { useAuth } from "context/AuthContext";
import { POST_STATUS, STATUS_TABS } from "../constants";

const LIMIT = 100;
const EMPTY_FILTERS = { cityId: "", tag: "" };

const buildBody = (status, search, filters) => ({
  status: [status],
  page: 1,
  limit: LIMIT,
  sortBy: status === POST_STATUS.FLAGGED ? "reports" : "createdAt",
  search: search.trim() || undefined,
  cityId: filters.cityId || undefined,
  tag: filters.tag || undefined,
});

export function useCommunityPosts() {
  const { userProfile } = useAuth();
  const [activeStatus, setActiveStatus] = useState(POST_STATUS.FLAGGED);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [rows, setRows] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterOptions, setFilterOptions] = useState({ cities: [], tags: [] });

  const load = useCallback(async (status, term, flt, { silent = false } = {}) => {
    if (!silent) setLoading(true);
    setError("");
    try {
      const res = await CommunityService.search(buildBody(status, term, flt));
      setRows(res?.data || []);
    } catch (err) {
      setError(err.message || "Failed to load posts.");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCounts = useCallback(async (term, flt) => {
    const results = await Promise.all(
      STATUS_TABS.map((t) =>
        CommunityService.search({ ...buildBody(t.value, term, flt), limit: 1 })
          .then((res) => [t.value, res?.meta?.totalItems ?? 0])
          .catch(() => [t.value, undefined])
      )
    );
    setCounts(Object.fromEntries(results.filter(([, v]) => v !== undefined)));
  }, []);

  useEffect(() => {
    load(activeStatus, search, filters);
  }, [activeStatus, search, filters, load]);

  useEffect(() => {
    loadCounts(search, filters);
  }, [search, filters, loadCounts]);

  useEffect(() => {
    CommunityService.search({ page: 1, limit: 200 })
      .then((res) => {
        const cities = new Map();
        const tags = new Set();
        (res?.data || []).forEach((p) => {
          if (p.cityId) cities.set(p.cityId, p.cityName || p.cityId);
          if (p.tag) tags.add(p.tag);
        });
        setFilterOptions({
          cities: [...cities.entries()]
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => a.label.localeCompare(b.label)),
          tags: [...tags].sort(),
        });
      })
      .catch(() => setFilterOptions({ cities: [], tags: [] }));
  }, []);

  const moderatedBy =
    [userProfile?.firstName, userProfile?.lastName].filter(Boolean).join(" ") || "Demo operator";

  const moderate = useCallback(
    async (post, payload) => {
      const updated = await CommunityService.moderate(post.id, { ...payload, moderatedBy });
      await Promise.all([load(activeStatus, search, filters, { silent: true }), loadCounts(search, filters)]);
      return updated;
    },
    [activeStatus, search, filters, load, loadCounts, moderatedBy]
  );

  const hasActiveFilters = !!(search.trim() || filters.cityId || filters.tag);

  return {
    activeStatus,
    changeStatusTab: setActiveStatus,
    search,
    changeSearch: setSearch,
    filters,
    changeFilter: (name, value) => setFilters((prev) => ({ ...prev, [name]: value })),
    clearFilters: () => {
      setFilters(EMPTY_FILTERS);
      setSearch("");
    },
    hasActiveFilters,
    filterOptions,
    rows,
    counts,
    loading,
    error,
    moderate,
  };
}
