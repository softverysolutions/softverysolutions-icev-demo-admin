import { useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { useAuth } from "context/AuthContext";
import { normalizeRole } from "permissions/role";
import { PromoCodeService } from "services/promoCodeService";
import { getScopeLabel } from "../utils/promoMappers";
import { createPromoTableColumns } from "./promoTableColumns";
import { FILTER_ALL } from "./constants";

const promoListPageCache = new Map();

export function clearPromoListPageCache() {
  promoListPageCache.clear();
}

function normalizePromoListRow(row) {
  if (!row || typeof row !== "object") return row;
  const assignedUserId = row.assignedUserId ?? row.assigned_user_id ?? null;
  const assignedUserEmail = row.assignedUserEmail ?? row.assigned_user_email ?? null;
  return {
    ...row,
    ...(assignedUserId != null && assignedUserId !== "" ? { assignedUserId } : {}),
    ...(assignedUserEmail != null && assignedUserEmail !== "" ? { assignedUserEmail } : {}),
    totalUsageLimit: row.totalUsageLimit ?? row.total_usage_limit ?? null,
    usageCount: row.usageCount ?? row.usage_count ?? 0,
  };
}

function computeUsagePercent(usedRaw, totalLimitRaw) {
  const used = Number(usedRaw);
  const u = Number.isFinite(used) && used >= 0 ? used : 0;
  if (totalLimitRaw == null || totalLimitRaw === "") return 0;
  const t = Number(totalLimitRaw);
  if (!Number.isFinite(t) || t <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((u / t) * 100)));
}

function buildListCacheKey({ search, page, pageSize, filter }) {
  return JSON.stringify({
    search: search || "",
    page,
    pageSize,
    filter,
    sortBy: "code",
    sortDirection: "asc",
  });
}

/** API stores `expiryHours` only; UI allows hours or days */
function hoursToDisplay(expiryHours) {
  const h = Math.floor(Number(expiryHours));
  if (!Number.isFinite(h) || h < 1) return { value: "72", unit: "hours" };
  if (h % 24 === 0) return { value: String(h / 24), unit: "days" };
  return { value: String(h), unit: "hours" };
}

function displayToExpiryHours(valueStr, unit) {
  const n = Math.floor(Number(String(valueStr ?? "").trim()));
  const safe = Number.isFinite(n) && n > 0 ? n : 1;
  return unit === "days" ? safe * 24 : safe;
}

export function usePromoCodesList() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const isSuperAdmin = normalizeRole(userProfile?.role) === "super_admin";
  const [searchInput, setSearchInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [filter, setFilter] = useState(FILTER_ALL);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);
  const [statusUpdatingId, setStatusUpdatingId] = useState(null);
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState({
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0,
    totalPages: 1,
  });

  const [newUserEnabled, setNewUserEnabled] = useState(true);
  const [newUserAmount, setNewUserAmount] = useState("50");
  const [newUserExpiryValue, setNewUserExpiryValue] = useState("3");
  const [newUserExpiryUnit, setNewUserExpiryUnit] = useState("days");
  const [newUserCombineWithSchool, setNewUserCombineWithSchool] = useState(false);
  const [loadingNewUserConfig, setLoadingNewUserConfig] = useState(false);
  const [savingNewUserConfig, setSavingNewUserConfig] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;

    let cancelled = false;
    (async () => {
      setLoadingNewUserConfig(true);
      try {
        const cfg = await PromoCodeService.getNewUserPromoConfig();
        if (cancelled) return;
        if (cfg && typeof cfg === "object") {
          setNewUserEnabled(Boolean(cfg.isEnabled));
          setNewUserAmount(
            cfg.discountValue != null && cfg.discountValue !== "" ? String(cfg.discountValue) : "0"
          );
          const { value, unit } = hoursToDisplay(cfg.expiryHours);
          setNewUserExpiryValue(value);
          setNewUserExpiryUnit(unit);
          setNewUserCombineWithSchool(Boolean(cfg.combinableWithSchoolDiscount));
        }
      } catch (e) {
        if (!cancelled) {
          Swal.fire({
            icon: "error",
            title: "Could not load new-user promo settings",
            text: e.message || "Unknown error",
            confirmButtonColor: "#6D4AFF",
          });
        }
      } finally {
        if (!cancelled) setLoadingNewUserConfig(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  const handleSaveNewUserPromo = useCallback(async () => {
    const discountValue = parseFloat(String(newUserAmount).trim());
    if (!Number.isFinite(discountValue) || discountValue < 0) {
      Swal.fire({
        icon: "warning",
        title: "Invalid discount",
        text: "Enter a valid non-negative number for the discount amount.",
        confirmButtonColor: "#6D4AFF",
      });
      return;
    }

    const expiryHours = displayToExpiryHours(newUserExpiryValue, newUserExpiryUnit);
    if (!Number.isInteger(expiryHours) || expiryHours < 1) {
      Swal.fire({
        icon: "warning",
        title: "Invalid expiry",
        text: "Expiry must be at least 1 hour.",
        confirmButtonColor: "#6D4AFF",
      });
      return;
    }

    setSavingNewUserConfig(true);
    try {
      await PromoCodeService.updateNewUserPromoConfig({
        isEnabled: newUserEnabled,
        discountValue,
        expiryHours,
        combinableWithSchoolDiscount: newUserCombineWithSchool,
      });
      Swal.fire({
        icon: "success",
        title: "New-user promo settings saved",
        confirmButtonColor: "#6D4AFF",
      });
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Could not save",
        text: e.message || "Unknown error",
        confirmButtonColor: "#6D4AFF",
      });
    } finally {
      setSavingNewUserConfig(false);
    }
  }, [
    newUserEnabled,
    newUserAmount,
    newUserExpiryValue,
    newUserExpiryUnit,
    newUserCombineWithSchool,
  ]);

  const fetchList = useCallback(
    async ({ force = false } = {}) => {
      const cacheKey = buildListCacheKey({
        search: appliedSearch,
        page,
        pageSize,
        filter,
      });
      if (!force && promoListPageCache.has(cacheKey)) {
        const cached = promoListPageCache.get(cacheKey);
        setRows(cached.rows.map(normalizePromoListRow));
        setMeta(cached.meta);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const body = {
          search: appliedSearch || "",
          page,
          limit: pageSize,
          sortBy: "code",
          sortDirection: "asc",
          filter:
            filter === FILTER_ALL
              ? {}
              : {
                  status: filter,
                },
        };
        const res = await PromoCodeService.searchPromoCodes(body);
        const nextRows = (Array.isArray(res.data) ? res.data : []).map(normalizePromoListRow);
        const nextMeta = res.meta || {
          currentPage: page,
          itemsPerPage: pageSize,
          totalItems: 0,
          totalPages: 1,
        };
        setRows(nextRows);
        setMeta(nextMeta);
        promoListPageCache.set(cacheKey, { rows: nextRows, meta: nextMeta });
      } catch (e) {
        console.error(e);
        Swal.fire({
          icon: "error",
          title: "Failed to load promo codes",
          text: e.message || "Unknown error",
          confirmButtonColor: "#6D4AFF",
        });
        setRows([]);
        setMeta({
          currentPage: page,
          itemsPerPage: pageSize,
          totalItems: 0,
          totalPages: 1,
        });
      } finally {
        setLoading(false);
      }
    },
    [appliedSearch, page, pageSize, filter]
  );

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const handleSearchSubmit = useCallback(() => {
    setPage(1);
    setAppliedSearch(searchInput.trim());
  }, [searchInput]);

  const handleSearchKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        handleSearchSubmit();
      }
    },
    [handleSearchSubmit]
  );

  const handleToggleActive = useCallback(
    async (row) => {
      const newStatus = row.status === "active" ? "inactive" : "active";
      setStatusUpdatingId(row.id);
      try {
        await PromoCodeService.updatePromoCode(row.id, {
          status: newStatus,
        });
        const cacheKey = buildListCacheKey({
          search: appliedSearch,
          page,
          pageSize,
          filter,
        });
        setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, status: newStatus } : r)));
        if (promoListPageCache.has(cacheKey)) {
          const cached = promoListPageCache.get(cacheKey);
          promoListPageCache.set(cacheKey, {
            ...cached,
            rows: cached.rows.map((r) => (r.id === row.id ? { ...r, status: newStatus } : r)),
          });
        }
      } catch (e) {
        Swal.fire({
          icon: "error",
          title: "Could not update status",
          text: e.message || "Unknown error",
          confirmButtonColor: "#6D4AFF",
        });
      } finally {
        setStatusUpdatingId(null);
      }
    },
    [appliedSearch, page, pageSize, filter]
  );

  const handleView = useCallback(
    (r) => {
      navigate(`/promo-codes/edit/${r.id}?view=1`);
    },
    [navigate]
  );

  const handleEdit = useCallback(
    (r) => {
      navigate(`/promo-codes/edit/${r.id}`);
    },
    [navigate]
  );

  const tableRows = useMemo(
    () =>
      rows.map((row) => {
        const total = row.totalUsageLimit;
        const used = row.usageCount ?? 0;
        const pct = computeUsagePercent(used, total);
        const discountDisplay =
          row.discountType === "percent" ? `${row.discountValue}%` : `€${row.discountValue}`;

        return {
          id: row.id,
          code: row,
          discount: discountDisplay,
          scope: getScopeLabel(row.applyingScope),
          eligibility: row,
          usage: { used, total, pct },
          period: { start: row.startDate, end: row.endDate },
          created: row,
          status: row.status,
          actions: {
            row,
            onView: handleView,
            onEdit: handleEdit,
            onToggleActive: handleToggleActive,
            isActive: row.status === "active",
            isUpdating: statusUpdatingId === row.id,
          },
        };
      }),
    [rows, handleView, handleEdit, handleToggleActive, statusUpdatingId]
  );

  const columns = useMemo(() => createPromoTableColumns(), []);

  const handleRowClick = useCallback(
    (tblRow) => {
      if (tblRow?.id) navigate(`/promo-codes/edit/${tblRow.id}`);
    },
    [navigate]
  );

  const serverPagination = {
    currentPage: meta.currentPage,
    totalPages: meta.totalPages || 1,
    totalItems: meta.totalItems ?? 0,
    itemsPerPage: meta.itemsPerPage ?? pageSize,
  };

  return {
    isSuperAdmin,
    searchInput,
    setSearchInput,
    handleSearchSubmit,
    handleSearchKeyDown,
    filter,
    setFilter: (f) => {
      setPage(1);
      setFilter(f);
    },
    newUserEnabled,
    setNewUserEnabled,
    newUserAmount,
    setNewUserAmount,
    newUserExpiryValue,
    setNewUserExpiryValue,
    newUserExpiryUnit,
    setNewUserExpiryUnit,
    newUserCombineWithSchool,
    setNewUserCombineWithSchool,
    handleSaveNewUserPromo,
    loadingNewUserConfig,
    savingNewUserConfig,
    tableRows,
    columns,
    handleRowClick,
    loading,
    serverPagination,
    onPageChange: (p) => setPage(p),
    onPageSizeChange: (n) => {
      setPage(1);
      setPageSize(n);
    },
  };
}
