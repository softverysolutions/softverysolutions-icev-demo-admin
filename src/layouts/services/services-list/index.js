import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

import ServiceModal from "../add-service-modal";
import { ServiceService } from "services/serviceService";
import { formatServiceType } from "utils/serviceTypeUtils";
import TruncatedText from "components/TruncatedText";
import { useCan } from "permissions/useCan";
import { F } from "permissions/features";

const ServiceDescriptionCell = ({ value }) => {
  const stripHtml = (html) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = html || "";
    return tmp.textContent || tmp.innerText || "";
  };

  const cleanText = stripHtml(value) || "No description";

  return <TruncatedText text={cleanText} maxLength={25} />;
};

ServiceDescriptionCell.propTypes = {
  value: PropTypes.string,
};

const ServiceNameCell = ({ value }) => {
  return <TruncatedText text={value} maxLength={20} />;
};

ServiceNameCell.propTypes = {
  value: PropTypes.string,
};

const ServiceActionsCell = ({ value }) => {
  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (!value.isUpdating && value.onToggleStatus) {
      value.onToggleStatus(value.row);
    }
  };

  const isActive = value.row.isActive !== undefined ? value.row.isActive : true;

  return (
    <SoftBox display="flex" alignItems="center" justifyContent="center" gap={1.5}>
      {value.onToggleStatus && !value.hideRowMutations && (
        <Tooltip title={isActive ? "Active" : "Inactive"}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isActive}
                onChange={handleCheckboxChange}
                disabled={value.isUpdating}
                size="small"
                onClick={(e) => e.stopPropagation()}
              />
            }
            label=""
            sx={{ margin: 0 }}
          />
        </Tooltip>
      )}
      {!value.hidePricing && (
        <Tooltip title="View Pricing">
          <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
            <Icon
              sx={{ color: "info.main" }}
              fontSize="medium"
              onClick={() => value.onPricing(value.row)}
            >
              receipt_long
            </Icon>
          </SoftTypography>
        </Tooltip>
      )}
      <Tooltip title="View">
        <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
          <Icon
            sx={{ color: "text.secondary" }}
            fontSize="medium"
            onClick={() => value.onView(value.row)}
          >
            visibility
          </Icon>
        </SoftTypography>
      </Tooltip>
      {!value.hideRowMutations && (
        <>
          <Tooltip title="Duplicate">
            <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
              <Icon
                sx={{ color: "text.secondary" }}
                fontSize="medium"
                onClick={() => value.onDuplicate(value.row)}
              >
                content_copy
              </Icon>
            </SoftTypography>
          </Tooltip>
          <Tooltip title="Edit">
            <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
              <Icon
                sx={{ color: "text.secondary" }}
                fontSize="medium"
                onClick={() => value.onEdit(value.row)}
              >
                edit
              </Icon>
            </SoftTypography>
          </Tooltip>
          <Tooltip title="Delete">
            <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
              <Icon
                sx={{ color: "error.main" }}
                fontSize="medium"
                onClick={() => value.onDelete(value.row)}
              >
                delete
              </Icon>
            </SoftTypography>
          </Tooltip>
        </>
      )}
    </SoftBox>
  );
};

ServiceActionsCell.propTypes = {
  value: PropTypes.shape({
    row: PropTypes.object.isRequired,
    onView: PropTypes.func.isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onDuplicate: PropTypes.func.isRequired,
    onPricing: PropTypes.func.isRequired,
    onToggleStatus: PropTypes.func,
    isUpdating: PropTypes.bool,
    hideRowMutations: PropTypes.bool,
    hidePricing: PropTypes.bool,
  }).isRequired,
};

function ServicesList() {
  const { can } = useCan();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedService, setSelectedService] = useState(null);
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [updatingServiceId, setUpdatingServiceId] = useState(null);

  const [tableKey, setTableKey] = useState(0);
  const [savedSearchValue, setSavedSearchValue] = useState("");
  const [globalSearchFilter, setGlobalSearchFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const servicesCacheRef = useRef(new Map());
  const loadingRef = useRef(false);
  const lastLoadedParamsRef = useRef({ page: null, limit: null, search: null });

  const handleOpenModal = (mode = "add", serviceData = null) => {
    const searchInput = document.querySelector('input[placeholder="Search..."]');
    if (searchInput && searchInput.value) {
      setSavedSearchValue(searchInput.value);
    } else if (globalSearchFilter) {
      setSavedSearchValue(globalSearchFilter);
    }

    setModalMode(mode);
    setSelectedService(serviceData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);

    if (savedSearchValue) {
      setGlobalSearchFilter(savedSearchValue);
      loadServices(currentPage, itemsPerPage, savedSearchValue);
    }
  };

  const loadServices = useCallback(async (page = 1, limit = 10, search = "") => {
    const cacheKey = `${page}_${limit}_${search}`;
    
    if (loadingRef.current) {
      return;
    }

    const cachedData = servicesCacheRef.current.get(cacheKey);
    if (cachedData) {
      setIsLoading(false);
      setServices(cachedData.services);
      setPagination(cachedData.pagination);
      lastLoadedParamsRef.current = { page, limit, search };
      return;
    }

    if (
      lastLoadedParamsRef.current.page === page &&
      lastLoadedParamsRef.current.limit === limit &&
      lastLoadedParamsRef.current.search === search
    ) {
      return;
    }

    loadingRef.current = true;
    setIsLoading(true);
    try {
      const response = await ServiceService.searchServices({
        page,
        limit,
        search,
      });
      const servicesData = Array.isArray(response) ? response : (response.data || []);
      
      const paginationData = response.meta
        ? {
            currentPage: response.meta.currentPage || page,
            totalPages: response.meta.totalPages || 1,
            totalItems: response.meta.totalItems || servicesData.length,
          }
        : Array.isArray(response)
        ? {
            currentPage: page,
            totalPages: 1,
            totalItems: servicesData.length,
          }
        : {
            currentPage: response.meta?.currentPage || page,
            totalPages: response.meta?.totalPages || 1,
            totalItems: response.meta?.totalItems || servicesData.length,
          };

      setServices(servicesData);
      setPagination(paginationData);
      lastLoadedParamsRef.current = { page, limit, search };

      servicesCacheRef.current.set(cacheKey, {
        services: servicesData,
        pagination: paginationData,
      });
    } catch (error) {
      console.error("Error loading services:", error);
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (
      lastLoadedParamsRef.current.page !== currentPage ||
      lastLoadedParamsRef.current.limit !== itemsPerPage ||
      lastLoadedParamsRef.current.search !== globalSearchFilter
    ) {
      loadServices(currentPage, itemsPerPage, globalSearchFilter);
    }
  }, [currentPage, itemsPerPage, globalSearchFilter, loadServices]);

  const handleSuccess = async (serviceId, action) => {
    servicesCacheRef.current.clear();
    lastLoadedParamsRef.current = { page: null, limit: null, search: null };
    loadServices(currentPage, itemsPerPage, globalSearchFilter);
  };

  const handleView = async (service) => {
    try {
      const fullServiceData = await ServiceService.getServiceWithCourseServices(service.id);
      handleOpenModal("view", fullServiceData);
    } catch (error) {
      console.error("Error loading service data for viewing:", error);
      handleOpenModal("view", service);
    }
  };

  const handleEdit = async (service) => {
    try {
      const fullServiceData = await ServiceService.getServiceWithCourseServices(service.id);
      handleOpenModal("edit", fullServiceData);
    } catch (error) {
      console.error("Error loading service data for editing:", error);
      handleOpenModal("edit", service);
    }
  };

  const handleDeleteClick = (service) => {
    setServiceToDelete(service);
    setDeleteDialogOpen(true);
  };

  const handleDuplicate = async (service) => {
    try {
      const fullService = await ServiceService.getServiceWithCourseServices(service.id);
      const duplicateData = {
        ...fullService,
        id: undefined,
        duplicateSourceServiceId: fullService.id,
        name: `${fullService.name || fullService.type} (Copy)`,
      };
      handleOpenModal("add", duplicateData);
    } catch (error) {
      console.error("Error loading service for duplication:", error);
      const duplicateData = {
        ...service,
        id: undefined,
        duplicateSourceServiceId: service.id,
        name: `${service.name || service.type} (Copy)`,
      };
      handleOpenModal("add", duplicateData);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!serviceToDelete) return;

    try {
      await ServiceService.deleteService(serviceToDelete.id);
      setDeleteDialogOpen(false);
      setServiceToDelete(null);
      servicesCacheRef.current.clear();
      lastLoadedParamsRef.current = { page: null, limit: null, search: null };
      loadServices(currentPage, itemsPerPage, globalSearchFilter);
    } catch (error) {
      console.error("Error deleting service:", error);
      alert(`Failed to delete extra: ${error.message}`);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setServiceToDelete(null);
  };

  const handlePricing = (service) => {
    navigate(`/services/${service.id}/pricing`);
  };

  const handleToggleStatus = async (service) => {
    if (updatingServiceId) return;

    try {
      setUpdatingServiceId(service.id);
      const newIsActive = !service.isActive;

      await ServiceService.updateService(service.id, {
        isActive: newIsActive,
      });

      const withNewStatus = (list) =>
        list.map((s) => (s.id === service.id ? { ...s, isActive: newIsActive } : s));

      setServices((prevServices) => withNewStatus(prevServices));

      // Keep the page cache in step, so paging away and back shows the new status.
      servicesCacheRef.current.forEach((entry, key) => {
        servicesCacheRef.current.set(key, { ...entry, services: withNewStatus(entry.services) });
      });
    } catch (error) {
      console.error("Error updating service status:", error);
      alert(`Failed to update service status: ${error.message}`);
    } finally {
      setUpdatingServiceId(null);
    }
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

  const customDataTableData = {
    columns: [
      {
        Header: "Name",
        accessor: "name",
        width: "18%",
        align: "left",
        Cell: ServiceNameCell,
      },
      { Header: "Type", accessor: "type", width: "12%", align: "left" },
      { Header: "Currency", accessor: "currency", width: "8%", align: "center" },
      { Header: "Status", accessor: "isActive", width: "8%", align: "center" },
      {
        Header: "Description",
        accessor: "description",
        width: "39%",
        align: "left",
        Cell: ServiceDescriptionCell,
      },
      {
        Header: "Actions",
        accessor: "actions",
        width: "10%",
        align: "center",
        Cell: ServiceActionsCell,
      },
    ],
    rows: services.map((service) => ({
      id: service.id,
      type: formatServiceType(service.type),
      name: service.name || service.type || "N/A",
      currency: service.currency || "EUR",
      isActive: service.isActive ? "Active" : "Inactive",
      description: service.description,
      actions: {
        row: service,
        onView: handleView,
        onEdit: handleEdit,
        onDelete: handleDeleteClick,
        onDuplicate: handleDuplicate,
        onPricing: handlePricing,
        onToggleStatus: handleToggleStatus,
        isUpdating: updatingServiceId === service.id,
        hideRowMutations: !can(F.SERVICES_ROW_MUTATE),
        hidePricing: !can(F.SERVICES_VIEW_PRICING),
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
                Extras
              </SoftTypography>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                Equipment and laptop rental, exams, transfers and other add-ons sold with programmes.
              </SoftTypography>
            </SoftBox>
            <Stack spacing={1} direction="row">
              {can(F.SERVICES_CREATE) && (
                <SoftButton
                  variant="gradient"
                  color="info"
                  size="small"
                  onClick={() => handleOpenModal("add")}
                >
                  + Add extra
                </SoftButton>
              )}
            </Stack>
          </SoftBox>
          {isLoading ? (
            <SoftBox display="flex" justifyContent="center" alignItems="center" p={4}>
              <SoftTypography variant="body2" color="text.secondary">
                Loading extras...
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

      <ServiceModal
        key={selectedService ? `${modalMode}-${selectedService.id}` : `${modalMode}-new`}
        open={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        serviceData={selectedService}
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
            Are you sure you want to delete the service{" "}
            <strong>&ldquo;{serviceToDelete?.type}&rdquo;</strong>?
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
    </DashboardLayout>
  );
}

export default ServicesList;
