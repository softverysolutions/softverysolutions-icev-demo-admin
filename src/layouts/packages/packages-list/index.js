import { useState, useEffect, useRef } from "react";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

import { PackageService } from "services/packageService";
import dataTableData from "./data/dataTableData";
import PackageModal from "../add-package-modal";
import DeleteDialog from "./components/DeleteDialog";
import { useCan } from "permissions/useCan";
import { F } from "permissions/features";

function PackagesList() {
  const { can } = useCan();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [packageToDelete, setPackageToDelete] = useState(null);
  const [globalSearchFilter, setGlobalSearchFilter] = useState("");
  const [filteredPackages, setFilteredPackages] = useState([]);
  const [statusUpdateLoading, setStatusUpdateLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  
  // Cache for packages data
  const packagesCacheRef = useRef(new Map());
  const lastLoadedParamsRef = useRef({ search: "", page: 1, limit: 10 });

  const handleOpenModal = async (mode = "add", packageData = null) => {
    setModalMode(mode);
    if ((mode === "view" || mode === "edit") && packageData?.id) {
      try {
        const fullPackageData = await PackageService.getPackageById(packageData.id);
        setSelectedPackage(fullPackageData);
      } catch (error) {
        console.error("Error loading package data:", error);
        setSelectedPackage(packageData);
      }
    } else {
      setSelectedPackage(packageData);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPackage(null);
  };

  const loadPackages = async (searchTerm = "", page = 1, limit = 10) => {
    const cacheKey = `${searchTerm}_${page}_${limit}`;
    
    // Check cache
    const cachedData = packagesCacheRef.current.get(cacheKey);
    if (cachedData) {
      console.log("[PackagesList] Using cached packages", {
        packagesCount: cachedData.packages.length,
        page: cachedData.pagination.currentPage,
        requestedPage: page,
      });
      setPackages(cachedData.packages);
      setFilteredPackages(cachedData.packages);
      setPagination(cachedData.pagination);
      setIsLoading(false);
      lastLoadedParamsRef.current = { search: searchTerm, page, limit };
      return;
    }

    console.log("[PackagesList] Cache miss, fetching from API", { searchTerm, page, limit });
    setIsLoading(true);
    try {
      const response = await PackageService.searchPackages({
        search: searchTerm,
        page,
        limit,
        sortBy: "createdAt",
        sortDirection: "desc",
      });

      const packagesData = response.data || [];
      const meta = response.meta || {};

      const paginationData = {
        currentPage: meta.currentPage || page,
        totalPages: meta.totalPages || 1,
        totalItems: meta.totalItems || packagesData.length,
        itemsPerPage: meta.itemsPerPage || limit,
      };

      // Cache the result
      packagesCacheRef.current.set(cacheKey, {
        packages: packagesData,
        pagination: paginationData,
      });

      setPackages(packagesData);
      setFilteredPackages(packagesData);
      setPagination(paginationData);
      lastLoadedParamsRef.current = { search: searchTerm, page, limit };
    } catch (error) {
      console.error("Error loading packages:", error);
      setPackages([]);
      setFilteredPackages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only load if we don't have cached data for the initial params
    const initialCacheKey = `_1_10`;
    if (!packagesCacheRef.current.has(initialCacheKey)) {
      loadPackages();
    } else {
      const cachedData = packagesCacheRef.current.get(initialCacheKey);
      setPackages(cachedData.packages);
      setFilteredPackages(cachedData.packages);
      setPagination(cachedData.pagination);
      setIsLoading(false);
    }
  }, []);

  const handleSearchChange = (value) => {
    setGlobalSearchFilter(value);
    loadPackages(value, 1, pagination.itemsPerPage);
  };

  const handlePageChange = (page) => {
    loadPackages(globalSearchFilter, page, pagination.itemsPerPage);
  };

  const handlePageSizeChange = (size) => {
    setPagination((prev) => ({ ...prev, itemsPerPage: size, currentPage: 1 }));
    loadPackages(globalSearchFilter, 1, size);
  };

  const handleSuccess = async () => {
    // Clear cache on success to force reload
    packagesCacheRef.current.clear();
    await loadPackages(globalSearchFilter, pagination.currentPage, pagination.itemsPerPage);
    handleCloseModal();
  };

  const handleRowClick = (row) => {
    const pkg = packages.find((p) => p.id === row.id);
    if (pkg) handleOpenModal("view", pkg);
  };

  const handleViewPackage = (pkg) => handleOpenModal("view", pkg);
  const handleEditPackage = (pkg) => handleOpenModal("edit", pkg);

  const handleDeleteClick = (pkg) => {
    setPackageToDelete(pkg);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!packageToDelete) return;
    try {
      await PackageService.deletePackage(packageToDelete.id);
      // Clear cache on delete to force reload
      packagesCacheRef.current.clear();
      await loadPackages(globalSearchFilter, pagination.currentPage, pagination.itemsPerPage);
      setDeleteDialogOpen(false);
      setPackageToDelete(null);
    } catch (error) {
      console.error("Error deleting package:", error);
      alert(`Failed to delete package: ${error.message}`);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setPackageToDelete(null);
  };

  const handleToggleStatus = async (pkg) => {
    if (statusUpdateLoading) return;

    const newStatus = !pkg.isActive;
    setStatusUpdateLoading(true);

    setPackages((prevPackages) =>
      prevPackages.map((item) => (item.id === pkg.id ? { ...item, isActive: newStatus } : item))
    );
    setFilteredPackages((prevFiltered) =>
      prevFiltered.map((item) => (item.id === pkg.id ? { ...item, isActive: newStatus } : item))
    );

    try {
      const fullPackageData = await PackageService.getPackageById(pkg.id);
      
      await PackageService.updatePackage(pkg.id, {
        name: fullPackageData.name || "",
        courseId: fullPackageData.courseId,
        description: fullPackageData.description,
        longDescription:
          fullPackageData.longDescription || fullPackageData.long_description || undefined,
        whatsIncluded:
          fullPackageData.whatsIncluded || fullPackageData.whats_included || undefined,
        accommodationDuration:
          fullPackageData.accommodationDuration ??
          fullPackageData.accommodation_duration ??
          undefined,
        accommodationId: fullPackageData.accommodationId || undefined,
        discountValue: fullPackageData.discountValue || undefined,
        discountType: fullPackageData.discountType || undefined,
        dates: fullPackageData.dates?.map(d => ({
          startDate: d.startDate,
          duration: d.duration,
          tag: d.tag || undefined,
          color: d.color || "navy",
        })) || [],
        images: fullPackageData.images?.map(img => ({ imageUrl: img.imageUrl })) || [],
        serviceIds: fullPackageData.services?.map(s => s.id) || undefined,
        isActive: newStatus,
      });
    } catch (error) {
      console.error("Error updating package status:", error);
      setPackages((prevPackages) =>
        prevPackages.map((item) => (item.id === pkg.id ? { ...item, isActive: pkg.isActive } : item))
      );
      setFilteredPackages((prevFiltered) =>
        prevFiltered.map((item) => (item.id === pkg.id ? { ...item, isActive: pkg.isActive } : item))
      );
      alert(`Failed to update package status: ${error.message}`);
    } finally {
      setStatusUpdateLoading(false);
    }
  };

  const getPackageImage = (pkg) => pkg.images?.[0]?.imageUrl || null;
  const getPackageName = (pkg) => pkg.name || pkg.course?.name || pkg.description || "Unnamed Package";
  const getCourseName = (pkg) => pkg.course?.name || "-";
  const getLocation = (pkg) => {
    const campus = pkg.course?.campus;
    if (!campus) return "-";
    const city = campus.city?.name || "";
    const country = campus.country?.name || "";
    return [city, country].filter(Boolean).join(", ");
  };

  const customDataTableData = {
    ...dataTableData,
    rows: filteredPackages.map((pkg) => ({
      id: pkg.id,
      image: getPackageImage(pkg),
      name: getPackageName(pkg),
      course: getCourseName(pkg),
      location: getLocation(pkg),
      dates: pkg.dates || [],
      price: {
        travelTotal: pkg.travelTotal,
        travelBase: pkg.travelBase,
        discountAmount: pkg.discountAmount,
      },
      isActive: pkg.isActive !== undefined ? pkg.isActive : true,
      actions: {
        row: { ...pkg, isActive: pkg.isActive !== undefined ? pkg.isActive : true },
        onView: handleViewPackage,
        onEdit: handleEditPackage,
        onDelete: handleDeleteClick,
        onToggleStatus: handleToggleStatus,
        isUpdating: statusUpdateLoading,
        hideRowMutations: !can(F.PACKAGES_ROW_MUTATE),
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
                Packages
              </SoftTypography>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                Ready-made bundles of a programme, a stay, extras and experiences, as sold in the app.
              </SoftTypography>
            </SoftBox>
            {can(F.PACKAGES_ROW_MUTATE) && (
              <Stack spacing={1} direction="row">
                <SoftButton variant="gradient" color="info" size="small" onClick={() => handleOpenModal("add")}>
                  + Create Package
                </SoftButton>
              </Stack>
            )}
          </SoftBox>
          {isLoading ? (
            <SoftBox display="flex" justifyContent="center" alignItems="center" p={4}>
              <SoftTypography variant="body2" color="text.secondary">
                Loading packages...
              </SoftTypography>
            </SoftBox>
          ) : (
            <DataTable
              table={customDataTableData}
              entriesPerPage={{ defaultValue: pagination.itemsPerPage, entries: [5, 10, 15, 20, 25] }}
              canSearch
              initialSearchValue={globalSearchFilter}
              onServerSearchChange={handleSearchChange}
              serverPagination={pagination}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onRowClick={handleRowClick}
            />
          )}
        </Card>
      </SoftBox>

      <PackageModal
        open={isModalOpen}
        onClose={handleCloseModal}
        mode={modalMode}
        packageData={selectedPackage}
        onSuccess={handleSuccess}
      />

      <DeleteDialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
      />
    </DashboardLayout>
  );
}

export default PackagesList;
