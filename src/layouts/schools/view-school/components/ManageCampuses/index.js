import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import Icon from "@mui/material/Icon";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import CustomDataTable from "./CustomDataTable";
import CampusModal from "../../../add-campus-modal";

import { CampusService } from "services/campusService";
import dataTableData from "./data/dataTableData";

function ManageCampuses({ schoolId, onAddCampus, hideAddCampus, hideRowMutations }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [campuses, setCampuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [campusToDelete, setCampusToDelete] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const navigate = useNavigate();

  const handleOpenModal = (mode = "add", campusData = null) => {
    setModalMode(mode);
    setSelectedCampus(campusData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedCampus(null);
  };

  const loadCampuses = async () => {
    setIsLoading(true);
    try {
      const campusesData = await CampusService.getCampuses(schoolId);
      setCampuses(campusesData);
    } catch (error) {
      // Handle error silently
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCampuses();
  }, [schoolId]);

  const handleRowClick = (row) => {
    const campus = campuses.find((campus) => campus.id === row.id);
    if (campus) {
      navigate(`/schools/view/${schoolId}/campus/${campus.id}`);
    }
  };

  const handleViewCampus = (row) => {
    handleOpenModal("view", row);
  };

  const handleEditCampus = (row) => {
    handleOpenModal("edit", row);
  };

  const handleDeleteCampus = (row) => {
    setCampusToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!campusToDelete) return;

    try {
      await CampusService.deleteCampus(campusToDelete.id);
      loadCampuses();
      setDeleteDialogOpen(false);
      setCampusToDelete(null);
    } catch (error) {
      console.error("Error deleting location:", error);
      alert(`Failed to delete location: ${error.message}`);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCampusToDelete(null);
  };

  const filteredCampuses = campuses.filter((campus) =>
    campus.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleStatus = async (campus) => {
    if (statusUpdateLoading) return;

    const newStatus = !campus.isActive;
    setStatusUpdateLoading(true);

    setCampuses((prevCampuses) =>
      prevCampuses.map((item) => (item.id === campus.id ? { ...item, isActive: newStatus } : item))
    );

    try {
      await CampusService.updateCampus(campus.id, {
        ...campus,
        isActive: newStatus,
      });
    } catch (error) {
      console.error("Error updating location status:", error);
      setCampuses((prevCampuses) =>
        prevCampuses.map((item) =>
          item.id === campus.id ? { ...item, isActive: campus.isActive } : item
        )
      );
      alert(`Failed to update location status: ${error.message}`);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const customDataTableData = {
    ...dataTableData,
    rows: filteredCampuses.map((row) => ({
      ...row,
      actions: {
        row,
        onView: handleViewCampus,
        onEdit: handleEditCampus,
        onDelete: handleDeleteCampus,
        onToggleStatus: handleToggleStatus,
        isUpdating: statusUpdateLoading,
        hideRowMutations,
      },
    })),
  };

  return (
    <Card>
      <SoftBox p={3}>
        <SoftBox display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <SoftTypography variant="h6" fontWeight="medium">
            Manage Locations
          </SoftTypography>
          {!hideAddCampus && (
            <SoftButton
              variant="gradient"
              color="info"
              size="small"
              startIcon={<Icon>add</Icon>}
              onClick={onAddCampus}
            >
              ADD LOCATION
            </SoftButton>
          )}
        </SoftBox>

        <SoftBox mb={3}>
          <SoftInput
            placeholder="Search Locations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={{
              component: <Icon>search</Icon>,
              direction: "left",
            }}
          />
        </SoftBox>

        {isLoading ? (
          <SoftBox display="flex" justifyContent="center" alignItems="center" p={4}>
            <SoftTypography variant="body2" color="text.secondary">
              Loading locations...
            </SoftTypography>
          </SoftBox>
        ) : (
          <CustomDataTable
            table={customDataTableData}
            entriesPerPage={{
              defaultValue: 10,
              entries: [5, 10, 15, 20, 25],
            }}
            canSearch={false}
            showTotalEntries={true}
            isSorted={false}
            noEndBorder
            pagination={{
              variant: "contained",
              color: "info",
            }}
            onRowClick={handleRowClick}
          />
        )}
      </SoftBox>

      <CampusModal
        open={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        campusData={selectedCampus}
        onSuccess={() => {
          loadCampuses();
        }}
      />

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Typography variant="h6" color="error">
            Confirm Delete
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Are you sure you want to delete the campus{" "}
            <strong>&ldquo;{campusToDelete?.name}&rdquo;</strong>?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

ManageCampuses.propTypes = {
  schoolId: PropTypes.string.isRequired,
  onAddCampus: PropTypes.func.isRequired,
  hideAddCampus: PropTypes.bool,
  hideRowMutations: PropTypes.bool,
};

export default ManageCampuses;
