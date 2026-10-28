import { useState, useEffect } from "react";
import { formatProviderType } from "utils/courseTypeUtils";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

import dataTableData from "layouts/schools/schools-list/data/dataTableData";
import { useCan } from "permissions/useCan";
import { F } from "permissions/features";
import SchoolModal from "../add-school-modal";
import { SchoolService } from "services/schoolService";
import { CampusService } from "services/campusService";
import { API_BASE_URL } from "config/api";

const formatSchoolType = (schoolType) => formatProviderType(schoolType);

function SchoolsList() {
  const { can } = useCan();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [schools, setSchools] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [schoolToDelete, setSchoolToDelete] = useState(null);
  const [listBusy, setListBusy] = useState(false);
  const [globalSearchFilter, setGlobalSearchFilter] = useState("");
  const [filteredSchools, setFilteredSchools] = useState([]);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);

  const handleOpenModal = (mode = "add", schoolData = null) => {
    setModalMode(mode);
    setSelectedSchool(schoolData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedSchool(null);
  };

  const loadSchools = async () => {
    setIsLoading(true);
    try {
      const response = await SchoolService.getSchools({
        page: 1,
        limit: 1000,
        sortBy: "name",
        sortDirection: "asc",
      });

      const schoolsData = response.data || [];

      const processedSchools = schoolsData.map((school) => ({
        ...school,
        campusesCount: 0,
      }));

      setSchools(processedSchools);
      setFilteredSchools(processedSchools);
    } catch (error) {
      console.error("Error loading providers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const filterSchools = (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === "") {
      setFilteredSchools(schools);
      return;
    }

    const filtered = schools.filter((school) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        school.name?.toLowerCase().includes(searchLower) ||
        school.schoolType?.toLowerCase().includes(searchLower) ||
        formatSchoolType(school.schoolType)?.toLowerCase().includes(searchLower)
      );
    });

    setFilteredSchools(filtered);
  };

  const handleSearchChange = (value) => {
    setGlobalSearchFilter(value);
    filterSchools(value);
  };

  const handleSuccess = async (newSchool, mode) => {
    await loadSchools();
  };

  const handleRowClick = (row) => {
    const school = schools.find((school) => school.id === row.id);
    if (school) {
      navigate(`/schools/view/${school.id}`);
    }
  };

  const handleView = (school) => {
    handleOpenModal("view", school);
  };

  const handleEdit = (school) => {
    handleOpenModal("edit", school);
  };

  const handleDeleteClick = (school) => {
    setSchoolToDelete(school);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!schoolToDelete || listBusy) return;

    const deleted = schoolToDelete;
    setListBusy(true);

    setSchools((prev) => prev.filter((school) => school.id !== deleted.id));
    setFilteredSchools((prev) => prev.filter((school) => school.id !== deleted.id));

    setDeleteDialogOpen(false);
    setSchoolToDelete(null);

    try {
      const { SchoolAwardsService } = await import("services/schoolAwardsService");
      const awards = await SchoolAwardsService.getSchoolAwards(deleted.id);

      for (const award of awards) {
        try {
          await SchoolAwardsService.deleteSchoolAward(award.id);
        } catch (awardError) {
          console.error("Failed to delete award:", award.id, awardError);
        }
      }

      await SchoolService.deleteSchool(deleted.id);
    } catch (error) {
      console.error("Error deleting provider:", error);
      setSchools((prev) => [...prev, deleted]);
      setFilteredSchools((prev) => [...prev, deleted]);
      alert(`Failed to delete provider: ${error.message}`);
    } finally {
      setListBusy(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSchoolToDelete(null);
  };

  const handleToggleStatus = async (school) => {
    if (statusUpdateLoading) return;

    const newStatus = !school.isActive;
    setStatusUpdateLoading(true);

    setSchools((prevSchools) =>
      prevSchools.map((item) => (item.id === school.id ? { ...item, isActive: newStatus } : item))
    );
    setFilteredSchools((prevFiltered) =>
      prevFiltered.map((item) => (item.id === school.id ? { ...item, isActive: newStatus } : item))
    );

    try {
      await SchoolService.updateSchool(school.id, {
        ...school,
        isActive: newStatus,
      });
    } catch (error) {
      console.error("Error updating provider status:", error);
      setSchools((prevSchools) =>
        prevSchools.map((item) => (item.id === school.id ? { ...item, isActive: school.isActive } : item))
      );
      setFilteredSchools((prevFiltered) =>
        prevFiltered.map((item) => (item.id === school.id ? { ...item, isActive: school.isActive } : item))
      );
      alert(`Failed to update provider status: ${error.message}`);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const hideRowMutations = !can(F.SCHOOLS_ROW_MUTATE);
  const canAddSchool = can(F.SCHOOLS_ADD);

  const customDataTableData = {
    ...dataTableData,
    rows: filteredSchools.map((school) => ({
      id: school.id,
      logo: school.logo,
      name: school.name,
      type: formatSchoolType(school.schoolType),
      actions: {
        row: school,
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDeleteClick,
        onToggleStatus: handleToggleStatus,
        isUpdating: statusUpdateLoading,
        hideRowMutations,
      },
    })),
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox my={3}>
        <Card>
          <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" p={3}>
            <SoftBox lineHeight={1}>
              <SoftTypography variant="h5" fontWeight="medium">
                Provider Management
              </SoftTypography>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                Manage all providers with search, pagination and advanced filtering.
              </SoftTypography>
            </SoftBox>
            <Stack spacing={1} direction="row">
              {canAddSchool && (
                <SoftButton
                  variant="gradient"
                  color="info"
                  size="small"
                  onClick={() => handleOpenModal("add")}
                >
                  + Add Provider
                </SoftButton>
              )}
            </Stack>
          </SoftBox>
          {isLoading ? (
            <SoftBox display="flex" justifyContent="center" alignItems="center" p={4}>
              <SoftTypography variant="body2" color="text.secondary">
                Loading providers...
              </SoftTypography>
            </SoftBox>
          ) : (
            <SoftBox sx={{ position: "relative" }}>
              {listBusy && (
                <SoftBox
                  sx={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 2,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: "rgba(255,255,255,0.72)",
                    borderRadius: 1,
                  }}
                >
                  <CircularProgress size={36} />
                </SoftBox>
              )}
              <DataTable
                table={customDataTableData}
                entriesPerPage={{
                  defaultValue: 10,
                  entries: [5, 10, 15, 20, 25],
                }}
                canSearch
                initialSearchValue={globalSearchFilter}
                onServerSearchChange={handleSearchChange}
                serverPagination={{
                  currentPage: 1,
                  totalPages: 1,
                  totalItems: filteredSchools.length,
                  itemsPerPage: 10,
                }}
                onRowClick={handleRowClick}
              />
            </SoftBox>
          )}
        </Card>
      </SoftBox>

      <SchoolModal
        open={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        schoolData={selectedSchool}
        onSuccess={handleSuccess}
      />

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color="error">
            Confirm Delete
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the school{" "}
            <strong>&ldquo;{schoolToDelete?.name}&rdquo;</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit" disabled={listBusy}>
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            autoFocus
            disabled={listBusy}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default SchoolsList;
