import { useState, useEffect, useCallback, useRef } from "react";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import { useAuth } from "context/AuthContext";
import { normalizeRole } from "permissions/role";
import { useCan } from "permissions/useCan";
import { F } from "permissions/features";
import PageHeader from "./components/PageHeader";
import ManagersTable from "./components/ManagersTable";
import AddUserModal from "./components/AddUserModal";
import ChangeRoleModal from "./components/ChangeRoleModal";
import DeactivateConfirmDialog from "./components/DeactivateConfirmDialog";
import ActivateConfirmDialog from "./components/ActivateConfirmDialog";

import {
  searchAdminUsers,
  createAdminUser,
  updateAdminUserRole,
  deactivateAdminUser,
  activateAdminUser,
} from "services/adminManagementService";

const DEFAULT_MANAGERS_PAGE_SIZE = 10;

function ManagersList() {
  const { userProfile } = useAuth();
  const { can } = useCan();
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: DEFAULT_MANAGERS_PAGE_SIZE,
  });
  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;
  const managersCacheRef = useRef(new Map());
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [changeRoleModalOpen, setChangeRoleModalOpen] = useState(false);
  const [managerToChangeRole, setManagerToChangeRole] = useState(null);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [managerToDeactivate, setManagerToDeactivate] = useState(null);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [updatingDeactivate, setUpdatingDeactivate] = useState(false);
  const [managerToActivate, setManagerToActivate] = useState(null);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [updatingActivate, setUpdatingActivate] = useState(false);
  const [successSnackbar, setSuccessSnackbar] = useState({ open: false, message: "" });

  const roleKey = normalizeRole(userProfile?.role);
  const canViewManagers = roleKey === "super_admin";
  const canStaffActions = can(F.MANAGERS_STAFF_ACTIONS);

  const getManagersCacheKey = (page, limit) => `${page}_${limit}`;

  const invalidateManagersCache = useCallback(() => {
    managersCacheRef.current.clear();
  }, []);

  const loadPage = useCallback(
    async (page, limit) => {
      if (!canViewManagers) return;
      const key = getManagersCacheKey(page, limit);
      const cached = managersCacheRef.current.get(key);
      if (cached) {
        setManagers(cached.data);
        setPagination(cached.pagination);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const res = await searchAdminUsers({
          page,
          limit,
          sortDirection: "asc",
        });
        const meta = res.meta || {};
        const paginationData = {
          currentPage: meta.currentPage ?? page,
          totalPages: Math.max(1, meta.totalPages ?? 1),
          totalItems: meta.totalItems ?? 0,
          itemsPerPage: meta.itemsPerPage ?? limit,
        };
        const list = res.data || [];
        managersCacheRef.current.set(key, { data: list, pagination: paginationData });
        setManagers(list);
        setPagination(paginationData);
      } catch (err) {
        console.error("Failed to load admin users:", err);
        setManagers([]);
        setPagination((prev) => ({
          ...prev,
          currentPage: page,
          itemsPerPage: limit,
          totalItems: 0,
          totalPages: 1,
        }));
      } finally {
        setLoading(false);
      }
    },
    [canViewManagers]
  );

  useEffect(() => {
    if (!canViewManagers) return;
    loadPage(1, DEFAULT_MANAGERS_PAGE_SIZE);
  }, [canViewManagers, loadPage]);

  const handleAddUser = () => {
    setAddModalOpen(true);
  };

  const handleAddUserSubmit = async (values) => {
    setSubmitting(true);
    try {
      const nameTrim = (values.name || "").trim();
      const parts = nameTrim.split(/\s+/).filter(Boolean);
      const firstName = parts[0] || nameTrim || "";
      const lastName = parts.slice(1).join(" ") || undefined;
      await createAdminUser({
        firstName,
        lastName,
        email: (values.email || "").trim(),
        role: values.role,
        password: (values.password || "").trim(),
        isActive: true,
      });
      invalidateManagersCache();
      await loadPage(1, paginationRef.current.itemsPerPage);
      setAddModalOpen(false);
      setSuccessSnackbar({ open: true, message: "User created successfully." });
    } catch (err) {
      const code = err?.code;
      const msg = err?.message || "Failed to create user";
      if (code === "USER_EMAIL_EXISTS" || msg.toLowerCase().includes("email") && msg.toLowerCase().includes("exist")) {
        throw new Error("This email is already used by another admin user.");
      }
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeRole = (row) => {
    setManagerToChangeRole(row);
    setChangeRoleModalOpen(true);
  };

  const handleChangeRoleSave = async (newRole) => {
    if (!managerToChangeRole?.id) return;
    setUpdatingRole(true);
    try {
      await updateAdminUserRole(managerToChangeRole.id, newRole);
      invalidateManagersCache();
      setManagers((prev) =>
        prev.map((m) => (m.id === managerToChangeRole.id ? { ...m, role: newRole } : m))
      );
      setChangeRoleModalOpen(false);
      setManagerToChangeRole(null);
    } catch (err) {
      console.error("Failed to change role:", err);
      const code = err?.code;
      if (code === "USER_NOT_FOUND") {
        alert("User not found. The list may be outdated.");
        invalidateManagersCache();
        loadPage(
          paginationRef.current.currentPage,
          paginationRef.current.itemsPerPage
        );
      } else if (code === "USER_UNAUTHORIZED_SUPER_ADMIN_CREATION") {
        alert("Cannot change role: at least one active Super Admin is required.");
      } else {
        alert(err?.message || "Failed to change role");
      }
    } finally {
      setUpdatingRole(false);
    }
  };

  const handleDeactivate = (row) => {
    setManagerToDeactivate(row);
    setDeactivateDialogOpen(true);
  };

  const handleDeactivateConfirm = async (manager) => {
    const target = manager || managerToDeactivate;
    if (!target?.id) return;
    setUpdatingDeactivate(true);
    try {
      await deactivateAdminUser(target.id);
      invalidateManagersCache();
      setManagers((prev) =>
        prev.map((m) => (m.id === target.id ? { ...m, status: "inactive" } : m))
      );
      setDeactivateDialogOpen(false);
      setManagerToDeactivate(null);
    } catch (err) {
      console.error("Failed to deactivate:", err);
      const code = err?.code;
      const msg = err?.message || "";
      if (code === "USER_NOT_FOUND" || msg.includes("not found")) {
        alert("User not found. Refreshing list.");
        invalidateManagersCache();
        loadPage(
          paginationRef.current.currentPage,
          paginationRef.current.itemsPerPage
        );
      } else if (msg.includes("already inactive")) {
        setManagers((prev) =>
          prev.map((m) => (m.id === target.id ? { ...m, status: "inactive" } : m))
        );
        setDeactivateDialogOpen(false);
        setManagerToDeactivate(null);
      } else if (msg.includes("Super Admin") || code === "USER_UNAUTHORIZED_SUPER_ADMIN_CREATION") {
        alert("Cannot deactivate: at least one active Super Admin is required.");
      } else {
        alert(err?.message || "Failed to deactivate user");
      }
    } finally {
      setUpdatingDeactivate(false);
    }
  };

  const handleActivate = (row) => {
    setManagerToActivate(row);
    setActivateDialogOpen(true);
  };

  const handleActivateConfirm = async () => {
    if (!managerToActivate?.id) return;
    setUpdatingActivate(true);
    try {
      await activateAdminUser(managerToActivate.id);
      invalidateManagersCache();
      setManagers((prev) =>
        prev.map((m) =>
          m.id === managerToActivate.id ? { ...m, status: "active" } : m
        )
      );
      setActivateDialogOpen(false);
      setManagerToActivate(null);
    } catch (err) {
      console.error("Failed to activate:", err);
      const msg = err?.message || "";
      if (msg.includes("already active")) {
        setManagers((prev) =>
          prev.map((m) =>
            m.id === managerToActivate.id ? { ...m, status: "active" } : m
          )
        );
        setActivateDialogOpen(false);
        setManagerToActivate(null);
      } else {
        alert(err?.message || "Failed to activate user");
      }
    } finally {
      setUpdatingActivate(false);
    }
  };

  if (!canViewManagers) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox py={3} px={3}>
          <SoftTypography variant="body1" color="text.secondary">
            You do not have access to this page.
          </SoftTypography>
        </SoftBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3}>
          <PageHeader
            onAddUser={handleAddUser}
            addButtonDisabled={loading}
            showAddUser={canStaffActions}
          />
        </SoftBox>
        <ManagersTable
          managers={managers}
          loading={loading}
          onChangeRole={handleChangeRole}
          onDeactivate={handleDeactivate}
          onActivate={handleActivate}
          showStaffActions={canStaffActions}
          itemsPerPage={pagination.itemsPerPage}
          serverPagination={{
            currentPage: pagination.currentPage,
            totalPages: pagination.totalPages,
            totalItems: pagination.totalItems,
            itemsPerPage: pagination.itemsPerPage,
          }}
          onPageChange={(page) =>
            loadPage(page, paginationRef.current.itemsPerPage)
          }
          onPageSizeChange={(size) => {
            invalidateManagersCache();
            loadPage(1, size);
          }}
        />
      </SoftBox>

      <AddUserModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddUserSubmit}
        isSubmitting={submitting}
      />

      <ChangeRoleModal
        open={changeRoleModalOpen}
        onClose={() => {
          setChangeRoleModalOpen(false);
          setManagerToChangeRole(null);
        }}
        manager={managerToChangeRole}
        currentRole={managerToChangeRole?.role}
        onSave={handleChangeRoleSave}
        isSubmitting={updatingRole}
      />

      <DeactivateConfirmDialog
        open={deactivateDialogOpen}
        onClose={() => {
          setDeactivateDialogOpen(false);
          setManagerToDeactivate(null);
        }}
        manager={managerToDeactivate}
        onConfirm={handleDeactivateConfirm}
        isSubmitting={updatingDeactivate}
      />

      <ActivateConfirmDialog
        open={activateDialogOpen}
        onClose={() => {
          setActivateDialogOpen(false);
          setManagerToActivate(null);
        }}
        manager={managerToActivate}
        onConfirm={handleActivateConfirm}
        isSubmitting={updatingActivate}
      />

      <Snackbar
        open={successSnackbar.open}
        autoHideDuration={5000}
        onClose={() => setSuccessSnackbar((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setSuccessSnackbar((s) => ({ ...s, open: false }))}
          severity="success"
          variant="filled"
        >
          {successSnackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}

export default ManagersList;
