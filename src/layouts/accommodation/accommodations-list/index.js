import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useLocation } from "react-router-dom";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import Icon from "@mui/material/Icon";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

import dataTableData from "layouts/accommodation/accommodations-list/data/dataTableData";
import AccommodationModal from "../add-accommodation-modal";
import { AccommodationService } from "services/accommodationService";
import { AccommodationFeeService } from "services/accommodationFeeService";
import { ROOM_TYPE_TO_BACKEND_MAP, CATEGORY_OPTIONS } from "../add-accommodation-modal/constants";
import { ActionsCell } from "./utils/components";
import { getPricePreview } from "./utils/pricePreview";
import { useCan } from "permissions/useCan";
import { F } from "permissions/features";
import TruncatedText from "components/TruncatedText";

const AccommodationNameCell = ({ value }) => {
  return <TruncatedText text={value} maxLength={20} />;
};

AccommodationNameCell.propTypes = {
  value: PropTypes.string,
};

const AccommodationLocationCell = ({ value }) => {
  return <TruncatedText text={value} maxLength={20} />;
};

AccommodationLocationCell.propTypes = {
  value: PropTypes.string,
};

const AccommodationPhotosCell = ({ value }) => {
  if (!Array.isArray(value) || value.length === 0) {
    return (
      <SoftBox display="flex" alignItems="center" justifyContent="center">
        <Icon sx={{ color: "text.secondary" }} fontSize="small">
          image
        </Icon>
      </SoftBox>
    );
  }

  return (
    <SoftBox display="flex" alignItems="center" gap={1}>
      <SoftBox
        component="img"
        src={value[0]}
        alt="accommodation photo"
        borderRadius="lg"
        shadow="md"
        width="40px"
        height="40px"
        sx={{
          objectFit: "cover",
          backgroundColor: "grey.100",
        }}
        onError={(e) => {
          e.target.style.display = "none";
          e.target.nextSibling.style.display = "flex";
        }}
      />
      <SoftBox
        display="none"
        alignItems="center"
        justifyContent="center"
        borderRadius="lg"
        bgColor="grey-100"
        width="40px"
        height="40px"
      >
        <Icon sx={{ color: "text.secondary" }} fontSize="small">
          image
        </Icon>
      </SoftBox>
      {value.length > 1 && (
        <SoftBox
          display="flex"
          alignItems="center"
          justifyContent="center"
          borderRadius="50%"
          bgColor="grey-100"
          width="32px"
          height="32px"
          ml={0.5}
        >
          <SoftTypography variant="caption" color="secondary" fontWeight="medium">
            +{value.length - 1}
          </SoftTypography>
        </SoftBox>
      )}
    </SoftBox>
  );
};

AccommodationPhotosCell.propTypes = {
  value: PropTypes.arrayOf(PropTypes.string).isRequired,
};

const ActionsCellWrapper = ({ value }) => (
  <ActionsCell
    row={value.row}
    onView={value.onView}
    onEdit={value.onEdit}
    onDelete={value.onDelete}
    onDuplicate={value.onDuplicate}
    onToggleStatus={value.onToggleStatus}
    isUpdating={value.isUpdating}
    hideRowMutations={value.hideRowMutations}
  />
);

ActionsCellWrapper.propTypes = {
  value: PropTypes.shape({
    row: PropTypes.object.isRequired,
    onView: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onDuplicate: PropTypes.func.isRequired,
    onToggleStatus: PropTypes.func,
    isUpdating: PropTypes.bool,
    hideRowMutations: PropTypes.bool,
  }).isRequired,
};

function AccommodationsList() {
  const { can } = useCan();
  const location = useLocation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedAccommodation, setSelectedAccommodation] = useState(null);
  const [accommodations, setAccommodations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [accommodationToDelete, setAccommodationToDelete] = useState(null);
  const [savedSearchValue, setSavedSearchValue] = useState("");
  const [globalSearchFilter, setGlobalSearchFilter] = useState("");
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const handleOpenModal = (mode = "add", accommodation = null) => {
    const searchInput = document.querySelector('input[placeholder="Search..."]');
    if (searchInput && searchInput.value) {
      setSavedSearchValue(searchInput.value);
    } else if (globalSearchFilter) {
      setSavedSearchValue(globalSearchFilter);
    }

    setModalMode(mode);
    setSelectedAccommodation(accommodation);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAccommodation(null);

    if (savedSearchValue) {
      setGlobalSearchFilter(savedSearchValue);
    }
  };

  const handleView = async (row) => {
    try {
      const fullAccommodationData = await AccommodationService.getAccommodationById(row.id);
      handleOpenModal("view", fullAccommodationData);
    } catch (error) {
      console.error("Error loading accommodation data for viewing:", error);
      handleOpenModal("view", row);
    }
  };

  const handleEdit = async (row) => {
    try {
      const fullAccommodationData = await AccommodationService.getAccommodationById(row.id);
      handleOpenModal("edit", fullAccommodationData);
    } catch (error) {
      console.error("Error loading accommodation data for editing:", error);
      handleOpenModal("edit", row);
    }
  };

  const handleDelete = (row) => {
    setAccommodationToDelete(row);
    setDeleteDialogOpen(true);
  };

  const handleDuplicate = async (row) => {
    try {
      const fullAccommodationData = await AccommodationService.getAccommodationById(row.id);

      let feesData = [];
      try {
        feesData = await AccommodationFeeService.getAccommodationFees(row.id);
      } catch (feeError) {
        console.log("Fees not available:", feeError.message);
      }

      const duplicateData = {
        ...fullAccommodationData,
        id: undefined,
        name: `${fullAccommodationData.name} (Copy)`,
        fees: feesData || [],
      };
      handleOpenModal("add", duplicateData);
    } catch (error) {
      console.error("Error loading accommodation data for duplication:", error);
      const duplicateData = {
        ...row,
        id: undefined,
        name: `${row.name} (Copy)`,
      };
      handleOpenModal("add", duplicateData);
    }
  };

  const handleSuccess = (newAccommodationId) => {
    loadAccommodations(currentPage, itemsPerPage, globalSearchFilter);
  };

  const handleDeleteConfirm = async () => {
    if (!accommodationToDelete) return;

    try {
      setAccommodations((prevAccommodations) =>
        prevAccommodations.filter((acc) => acc.id !== accommodationToDelete.id)
      );

      setDeleteDialogOpen(false);
      setAccommodationToDelete(null);

      await AccommodationService.deleteAccommodation(accommodationToDelete.id);
    } catch (error) {
      console.error("Error deleting accommodation:", error);
      setAccommodations((prevAccommodations) => [...prevAccommodations, accommodationToDelete]);
      alert(`Failed to delete accommodation: ${error.message}`);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setAccommodationToDelete(null);
  };

  const handleSearchChange = (value) => {
    setGlobalSearchFilter(value);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleEntriesPerPageChange = (newEntriesPerPage) => {
    setItemsPerPage(newEntriesPerPage);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (location.state?.accommodationName && location.state?.openViewModal) {
    }
  }, [location.state]);

  const loadAccommodations = async (page = 1, limit = 10, search = "") => {
    try {
      setIsLoading(true);
      const response = await AccommodationService.getAllAccommodations({
        page,
        limit,
        search,
      });
      const accommodationsList = response.data || [];
      setAccommodations(accommodationsList);

      if (response.meta) {
        setPagination({
          currentPage: response.meta.currentPage || page,
          totalPages: response.meta.totalPages || 1,
          totalItems: response.meta.totalItems || accommodationsList.length,
        });
      }

      if (location.state?.accommodationName && location.state?.openViewModal) {
        const selectedAcc = accommodationsList.find(
          (acc) => acc.name === location.state.accommodationName
        );

        if (selectedAcc) {
          setTimeout(() => {
            const accData = location.state.accommodationData || selectedAcc;
            handleOpenModal("view", accData);
          }, 100);
        } else {
          if (location.state.accommodationData) {
            setTimeout(() => {
              handleOpenModal("view", location.state.accommodationData);
            }, 100);
          } else {
            console.warn("No accommodation data available");
          }
        }
      }
    } catch (error) {
      console.error("Error loading accommodations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAccommodations(currentPage, itemsPerPage, globalSearchFilter);
  }, [currentPage, itemsPerPage, globalSearchFilter]);

  useEffect(() => {
    if (
      location.state?.accommodationName &&
      location.state?.openViewModal &&
      accommodations.length > 0
    ) {
      const selectedAcc = accommodations.find(
        (acc) => acc.name === location.state.accommodationName
      );

      if (selectedAcc) {
        setTimeout(() => {
          const accData = location.state.accommodationData || selectedAcc;
          handleOpenModal("view", accData);
        }, 100);
      } else {
        if (location.state.accommodationData) {
          setTimeout(() => {
            handleOpenModal("view", location.state.accommodationData);
          }, 100);
        }
      }
    }
  }, [location.state?.accommodationName]);

  const handleToggleStatus = async (accommodation) => {
    if (statusUpdateLoading) return;

    const newStatus = !accommodation.isActive;
    setStatusUpdateLoading(true);

    setAccommodations((prevAccommodations) =>
      prevAccommodations.map((item) =>
        item.id === accommodation.id ? { ...item, isActive: newStatus } : item
      )
    );

    try {
      await AccommodationService.updateAccommodation(accommodation.id, {
        ...accommodation,
        isActive: newStatus,
      });
    } catch (error) {
      console.error("Error updating accommodation status:", error);
      setAccommodations((prevAccommodations) =>
        prevAccommodations.map((item) =>
          item.id === accommodation.id ? { ...item, isActive: accommodation.isActive } : item
        )
      );
      alert(`Failed to update accommodation status: ${error.message}`);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const customDataTableData = {
    columns: [
      {
        Header: "Accommodation Name",
        accessor: "name",
        width: "20%",
        Cell: AccommodationNameCell,
      },
      { Header: "Acc. Type", accessor: "type", width: "12%" },
      { Header: "Category", accessor: "category", width: "12%" },
      {
        Header: "Location",
        accessor: "location",
        width: "15%",
        Cell: AccommodationLocationCell,
      },
      { Header: "Price per Week", accessor: "price", width: "12%" },
      { Header: "Regime", accessor: "regime", width: "10%" },
      {
        Header: "Photos",
        accessor: "photos",
        width: "10%",
        Cell: AccommodationPhotosCell,
      },
      {
        Header: "Actions",
        accessor: "actions",
        width: "9%",
        Cell: ActionsCellWrapper,
      },
    ],
    rows: accommodations.map((accommodation) => {
      const priceText = getPricePreview(accommodation);

      const reverseRoomTypeMap = {};
      Object.entries(ROOM_TYPE_TO_BACKEND_MAP).forEach(([frontend, backend]) => {
        reverseRoomTypeMap[backend] = frontend;
      });

      const categoryLabel =
        CATEGORY_OPTIONS.find((option) => option.value === accommodation.category)?.label ||
        accommodation.category ||
        "";

      return {
        id: accommodation.id,
        name: accommodation.name,
        type: reverseRoomTypeMap[accommodation.type] || accommodation.type || "",
        category: categoryLabel || "",
        location: accommodation.address,
        price: priceText,
        regime:
          accommodation.regimeType === "NoMeals"
            ? "Self Catering"
            : accommodation.regimeType === "BB"
            ? "Bed & Breakfast"
            : accommodation.regimeType === "HalfBoard"
            ? "Half Board"
            : accommodation.regimeType === "FullBoard"
            ? "Full Board"
            : accommodation.regimeType,
        photos: accommodation.images?.map((img) => img.imageUrl) || [],
        actions: {
          row: accommodation,
          onView: handleView,
          onEdit: handleEdit,
          onDelete: handleDelete,
          onDuplicate: handleDuplicate,
          onToggleStatus: handleToggleStatus,
          isUpdating: statusUpdateLoading,
          hideRowMutations: !can(F.ACCOMMODATIONS_ROW_MUTATE),
        },
      };
    }),
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox my={3}>
        <Card>
          <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" p={3}>
            <SoftBox lineHeight={1}>
              <SoftTypography variant="h5" fontWeight="medium">
                Accommodation
              </SoftTypography>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                Shared apartments, campus residences, surf houses and other stays linked to provider locations.
              </SoftTypography>
            </SoftBox>
            <Stack spacing={1} direction="row">
              {can(F.ACCOMMODATIONS_ADD) && (
                <SoftButton
                  variant="gradient"
                  color="info"
                  size="small"
                  onClick={() => handleOpenModal("add")}
                >
                  + Add Accommodation
                </SoftButton>
              )}
            </Stack>
          </SoftBox>
          {isLoading ? (
            <SoftBox display="flex" justifyContent="center" alignItems="center" p={4}>
              <SoftTypography variant="body2" color="text.secondary">
                Loading accommodations...
              </SoftTypography>
            </SoftBox>
          ) : (
            <DataTable
              table={customDataTableData}
              entriesPerPage={{
                defaultValue: itemsPerPage,
                entries: [5, 10, 15, 20, 25],
              }}
              canSearch
              initialSearchValue={globalSearchFilter}
              onServerSearchChange={handleSearchChange}
              serverPagination={{
                currentPage: pagination.currentPage,
                totalPages: pagination.totalPages,
                totalItems: pagination.totalItems,
                itemsPerPage: itemsPerPage,
              }}
              onPageChange={handlePageChange}
              onPageSizeChange={handleEntriesPerPageChange}
            />
          )}
        </Card>
      </SoftBox>

      <AccommodationModal
        open={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        accommodationData={selectedAccommodation}
        onSuccess={handleSuccess}
      />

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>
          <SoftTypography variant="h6" fontWeight="medium">
            Confirm Delete
          </SoftTypography>
        </DialogTitle>
        <DialogContent>
          <SoftTypography variant="body2" color="text.secondary">
            Are you sure you want to delete &quot;{accommodationToDelete?.name}&quot;? This action
            cannot be undone.
          </SoftTypography>
        </DialogContent>
        <DialogActions>
          <SoftButton color="light" onClick={handleDeleteCancel}>
            Cancel
          </SoftButton>
          <SoftButton variant="gradient" color="error" onClick={handleDeleteConfirm}>
            Delete
          </SoftButton>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default AccommodationsList;
