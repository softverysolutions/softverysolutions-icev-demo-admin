import { useState, useEffect, useCallback } from "react";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

import { DiscountService } from "services/discountService";
import { CourseService } from "services/courseService";
import DiscountModal from "../add-discount-modal";
import { formatImageUrl } from "utils/imageUtils";
import TruncatedText from "components/TruncatedText";
import { useCan } from "permissions/useCan";
import { F } from "permissions/features";
import { formatDateOnly } from "utils/dateUtils";

function DiscountImageCell({ value }) {
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
  }, [value]);

  if (!value || loadError) {
    return (
      <SoftBox display="flex" alignItems="center" justifyContent="center">
        <Icon sx={{ color: "text.secondary" }} fontSize="small">
          image
        </Icon>
      </SoftBox>
    );
  }

  return (
    <SoftBox
      component="img"
      src={formatImageUrl(value)}
      alt="discount image"
      borderRadius="lg"
      shadow="md"
      width="40px"
      height="40px"
      sx={{
        objectFit: "cover",
        backgroundColor: "grey.100",
      }}
      onError={() => setLoadError(true)}
    />
  );
}

DiscountImageCell.propTypes = {
  value: PropTypes.string,
};

const DiscountNameCell = ({ value }) => {
  return <TruncatedText text={value} maxLength={20} />;
};

DiscountNameCell.propTypes = {
  value: PropTypes.string,
};

function ActionsCell({ row, onView, onEdit, onDelete, onToggleStatus, isUpdating, hideRowMutations }) {
  const handleClick = (e, action) => {
    e.stopPropagation();
    action(row);
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (!isUpdating) {
      onToggleStatus(row);
    }
  };

  const isActive = row.status === "active";

  return (
    <Stack direction="row" spacing={1} justifyContent="center" onClick={(e) => e.stopPropagation()}>
      {!hideRowMutations && (
        <FormControlLabel
          control={
            <Checkbox
              checked={isActive}
              onChange={handleCheckboxChange}
              disabled={isUpdating}
              size="small"
              onClick={(e) => e.stopPropagation()}
            />
          }
          label=""
          sx={{ margin: 0 }}
        />
      )}
      <Tooltip title="View" placement="top">
        <IconButton onClick={(e) => handleClick(e, onView)} size="small">
          <Icon fontSize="small">visibility</Icon>
        </IconButton>
      </Tooltip>
      {!hideRowMutations && (
        <>
          <Tooltip title="Edit" placement="top">
            <IconButton onClick={(e) => handleClick(e, onEdit)} size="small">
              <Icon fontSize="small">edit</Icon>
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete" placement="top">
            <IconButton onClick={(e) => handleClick(e, onDelete)} size="small">
              <Icon fontSize="small">delete</Icon>
            </IconButton>
          </Tooltip>
        </>
      )}
    </Stack>
  );
}

ActionsCell.propTypes = {
  row: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  isUpdating: PropTypes.bool,
  hideRowMutations: PropTypes.bool,
};

function DiscountsList() {
  const { can } = useCan();
  const hideDiscountRowMut = !can(F.DISCOUNTS_ROW_MUTATE);
  const canCreateDiscount = can(F.DISCOUNTS_CREATE);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [discounts, setDiscounts] = useState([]);
  const [courses, setCourses] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [discountToDelete, setDiscountToDelete] = useState(null);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [savedSearchValue, setSavedSearchValue] = useState("");
  const [globalSearchFilter, setGlobalSearchFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
  });

  const TableCell = useCallback(
    ({ row }) => {
      return (
        <ActionsCell
          row={row.original.actions}
          onView={handleViewDiscount}
          onEdit={handleEditDiscount}
          onDelete={handleDeleteDiscountClick}
          onToggleStatus={handleToggleStatus}
          isUpdating={statusUpdateLoading}
          hideRowMutations={hideDiscountRowMut}
        />
      );
    },
    [statusUpdateLoading, hideDiscountRowMut]
  );

  TableCell.propTypes = {
    row: PropTypes.shape({
      original: PropTypes.shape({
        actions: PropTypes.object.isRequired,
      }).isRequired,
    }).isRequired,
  };

  const loadCourses = async () => {
    try {
      const coursesData = await CourseService.getAllCourses();
      const coursesMap = {};
      coursesData.data?.forEach((course) => {
        coursesMap[course.id] = course.name;
      });
      setCourses(coursesMap);
    } catch (error) {
      console.error("Error loading courses:", error);
    }
  };

  const handleOpenModal = (mode = "add", discountData = null) => {
    const searchInput = document.querySelector('input[placeholder="Search..."]');
    if (searchInput && searchInput.value) {
      setSavedSearchValue(searchInput.value);
    } else if (globalSearchFilter) {
      setSavedSearchValue(globalSearchFilter);
    }

    setModalMode(mode);
    setSelectedDiscount(discountData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedDiscount(null);

    if (savedSearchValue) {
      setGlobalSearchFilter(savedSearchValue);
    }
  };

  const loadDiscounts = async () => {
    setIsLoading(true);
    try {
      const discountsData = await DiscountService.getDiscounts();
      const discounts = Array.isArray(discountsData) ? discountsData : [];
      
      let filteredDiscounts = discounts;
      if (globalSearchFilter && globalSearchFilter.trim() !== "") {
        const searchLower = globalSearchFilter.toLowerCase();
        filteredDiscounts = discounts.filter((discount) => {
          return (
            discount.title?.toLowerCase().includes(searchLower) ||
            discount.description?.toLowerCase().includes(searchLower) ||
            discount.code?.toLowerCase().includes(searchLower)
          );
        });
      }
      
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedDiscounts = filteredDiscounts.slice(startIndex, endIndex);
      
      setDiscounts(paginatedDiscounts);
      
      const totalPages = Math.ceil(filteredDiscounts.length / itemsPerPage);
      setPagination({
        currentPage: currentPage,
        totalPages: totalPages || 1,
        totalItems: filteredDiscounts.length,
      });
    } catch (error) {
      console.error("Error loading discounts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDiscounts();
    loadCourses();
  }, [currentPage, itemsPerPage, globalSearchFilter]);

  const handleSuccess = async () => {
    await loadDiscounts();
    handleCloseModal();
  };

  const handleRowClick = (row) => {
    const discount = discounts.find((discount) => discount.id === row.id);
    if (discount) {
      handleOpenModal("view", discount);
    }
  };

  const handleViewDiscount = (discount) => {
    handleOpenModal("view", discount);
  };

  const handleEditDiscount = (discount) => {
    handleOpenModal("edit", discount);
  };

  const handleDeleteDiscountClick = (discount) => {
    setDiscountToDelete(discount);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDiscount = async () => {
    try {
      await DiscountService.deleteDiscount(discountToDelete.id);
      await loadDiscounts();
      setDeleteDialogOpen(false);
      setDiscountToDelete(null);
    } catch (error) {
      console.error("Error deleting discount:", error);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setDiscountToDelete(null);
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

  const handleToggleStatus = async (discount) => {
    if (statusUpdateLoading) return;

    const newStatus = discount.status === "active" ? "inactive" : "active";
    setStatusUpdateLoading(true);

    let oldDiscountsForRollback = null;

    setDiscounts((prevDiscounts) => {
      oldDiscountsForRollback = [...prevDiscounts];
      return prevDiscounts.map((item) => {
        if (item.id === discount.id) {
          return { ...item, status: newStatus };
        }
        return item;
      });
    });

    try {
      const updateData = {
        title: discount.title || discount.description || "",
        startDay: discount.startDay,
        endDay: discount.endDay,
        eligibleTravelStartDay: discount.eligibleTravelStartDay,
        eligibleTravelEndDay: discount.eligibleTravelEndDay,
        type: discount.type,
        value: discount.value,
        status: newStatus,
        tuition: discount.tuition || false,
        description: discount.description || "",
        courseIds:
          discount.courses?.map((c) => c.course?.id || c.courseId) || discount.courseIds || [],
      };

      await DiscountService.updateDiscount(discount.id, updateData);
    } catch (error) {
      console.error("Error updating discount status:", error);
      setDiscounts(oldDiscountsForRollback);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  // Discount days are stored in UTC (start 00:00, end 23:59:59.999), so show the UTC day:
  // the local one drifts by a day depending on the admin's time zone.
  const formatDate = (dateString) => formatDateOnly(dateString) || "-";

  const formatDiscountValue = (type, value) => {
    return type === "percent" ? `${value}%` : `€${value}`;
  };

  const getCourseName = (discount) => {
    if (!discount.courses || discount.courses.length === 0) {
      return "All programmes";
    }
    const courseNames = discount.courses.map((courseLink) => {
      const courseName =
        courseLink.course?.name || courses[courseLink.courseId] || "Unknown programme";
      return courseName;
    });

    if (courseNames.length === 1) {
      const name = courseNames[0];
      return name.length > 5 ? `${name.substring(0, 5)}...` : name;
    }

    return courseNames
      .map((name) => (name.length > 5 ? `${name.substring(0, 5)}...` : name))
      .join(", ");
  };

  const columns = [
    { Header: "Image", accessor: "image", width: "10%", Cell: DiscountImageCell },
    {
      Header: "Name",
      accessor: "name",
      width: "20%",
      Cell: DiscountNameCell,
    },
    { Header: "Start Date", accessor: "startDate", width: "12%" },
    { Header: "End Date", accessor: "endDate", width: "12%" },
    { Header: "Eligible Travel Dates", accessor: "eligibleTravelDates", width: "18%" },
    { Header: "Type", accessor: "type", width: "12%" },
    { Header: "Amount", accessor: "amount", width: "12%" },
    {
      Header: "Actions",
      accessor: "actions",
      width: "12%",
      Cell: TableCell,
    },
  ];

  const rows = discounts.map((discount) => ({
    id: discount.id,
    image: discount.image,
    name: discount.title,
    startDate: formatDate(discount.startDay),
    endDate: formatDate(discount.endDay),
    eligibleTravelDates: `${formatDate(discount.eligibleTravelStartDay)} - ${formatDate(
      discount.eligibleTravelEndDay
    )}`,
    type: discount.type === "percent" ? "Percentage" : "Fixed Amount",
    amount: formatDiscountValue(discount.type, discount.value),
    status: discount.status,
    actions: {
      ...discount,
      status: discount.status,
    },
  }));

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox my={3}>
        <Card>
          <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" p={3}>
            <SoftBox lineHeight={1}>
              <SoftTypography variant="h5" fontWeight="medium">
                Discount Management
              </SoftTypography>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                Manage all discounts with search, pagination and advanced filtering.
              </SoftTypography>
            </SoftBox>
            <Stack spacing={1} direction="row">
              {canCreateDiscount && (
                <SoftButton
                  variant="gradient"
                  color="info"
                  size="small"
                  onClick={() => handleOpenModal("add")}
                >
                  + Create Discount
                </SoftButton>
              )}
            </Stack>
          </SoftBox>
          {isLoading ? (
            <SoftBox display="flex" justifyContent="center" alignItems="center" p={4}>
              <SoftTypography variant="body2" color="text.secondary">
                Loading discounts...
              </SoftTypography>
            </SoftBox>
          ) : (
            <DataTable
              table={{ columns, rows }}
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
              onRowClick={handleRowClick}
            />
          )}
        </Card>
      </SoftBox>

      <DiscountModal
        open={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        discountData={selectedDiscount}
        onSuccess={handleSuccess}
      />

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Delete Discount</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the discount &quot;
            {discountToDelete?.title || discountToDelete?.description}&quot;? This action cannot be
            undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteDiscount} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}

export default DiscountsList;
