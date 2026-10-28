import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

import { AmenityService } from "services/amenityService";
import { clearCampusFacilitiesAmenitiesCache } from "layouts/schools/view-campus/components/CampusFacilities";
import AmenityFormModal from "../amenity-form-modal";
import { useCan } from "permissions/useCan";
import { F } from "permissions/features";

const TABLE_COLUMNS = [
  { Header: "Icon", accessor: "icon", width: "12%" },
  { Header: "Name", accessor: "name", width: "40%" },
  { Header: "Icon URL", accessor: "iconUrl", width: "36%" },
  { Header: "Actions", accessor: "actions", width: "12%" },
];

function FacilityIconPreview({ iconUrl }) {
  const url = String(iconUrl || "").trim();
  if (!url) {
    return <Icon color="action">image_not_supported</Icon>;
  }
  return (
    <SoftBox
      width={40}
      height={40}
      display="flex"
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
    >
      <img
        src={url}
        alt=""
        style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </SoftBox>
  );
}

FacilityIconPreview.propTypes = {
  iconUrl: PropTypes.string,
};

function AmenitiesList() {
  const { can } = useCan();
  const canEdit = can(F.CAMPUS_PAGE_EDIT);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedAmenity, setSelectedAmenity] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const amenities = await AmenityService.getAllAmenities();
      const unique = amenities.filter(
        (item, index, self) => index === self.findIndex((a) => a.id === item.id)
      );
      setList(unique);
    } catch (err) {
      console.error(err);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList();
  }, [loadList]);

  const openModal = (mode, amenity = null) => {
    setModalMode(mode);
    setSelectedAmenity(amenity);
    setModalOpen(true);
  };

  const handleDelete = async (amenity) => {
    if (!window.confirm(`Delete facility "${amenity.name}"?`)) return;
    setDeletingId(amenity.id);
    try {
      await AmenityService.deleteAmenity(amenity.id);
      clearCampusFacilitiesAmenitiesCache();
      await loadList();
    } catch (err) {
      alert(err.message || "Failed to delete facility.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSaved = () => {
    clearCampusFacilitiesAmenitiesCache();
    loadList();
  };

  const filtered = list.filter((item) =>
    String(item.name || "")
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  const tableRows = filtered.map((amenity) => ({
    icon: <FacilityIconPreview iconUrl={amenity.iconUrl} />,
    name: (
      <SoftTypography variant="button" fontWeight="medium" color="text">
        {amenity.name}
      </SoftTypography>
    ),
    iconUrl: (
      <SoftTypography variant="caption" color="text" sx={{ wordBreak: "break-all" }}>
        {String(amenity.iconUrl || "").startsWith("data:") ? "Default icon" : amenity.iconUrl || "—"}
      </SoftTypography>
    ),
    actions: !canEdit ? null : (
      <SoftBox display="flex" gap={0.5}>
        <Tooltip title="Edit">
          <IconButton size="small" color="info" onClick={() => openModal("edit", amenity)}>
            <Icon fontSize="small">edit</Icon>
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            size="small"
            color="error"
            disabled={deletingId === amenity.id}
            onClick={() => handleDelete(amenity)}
          >
            <Icon fontSize="small">delete</Icon>
          </IconButton>
        </Tooltip>
      </SoftBox>
    ),
  }));

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox py={3}>
        <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <SoftBox>
            <SoftTypography variant="h4" fontWeight="bold">
              Location Facilities
            </SoftTypography>
            <SoftTypography variant="body2" color="text">
              Facility names and icons shown on location pages in the Softvery Demo app.
            </SoftTypography>
          </SoftBox>
          {canEdit && (
            <SoftButton variant="gradient" color="info" onClick={() => openModal("add")}>
              Add facility
            </SoftButton>
          )}
        </SoftBox>

        <Card>
          <SoftBox p={2}>
            <SoftBox mb={2} maxWidth={360}>
              <SoftInput
                placeholder="Search facilities..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </SoftBox>
            <DataTable
              table={{ columns: TABLE_COLUMNS, rows: tableRows }}
              entriesPerPage={false}
              canSearch={false}
              showTotalEntries={false}
              isSorted={false}
              noEndBorder
            />
            {!loading && filtered.length === 0 && (
              <SoftBox p={3} textAlign="center">
                <SoftTypography variant="body2" color="text.secondary">
                  No facilities found.
                </SoftTypography>
              </SoftBox>
            )}
          </SoftBox>
        </Card>
      </SoftBox>

      <AmenityFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        amenity={selectedAmenity}
        onSuccess={handleSaved}
      />
    </DashboardLayout>
  );
}

export default AmenitiesList;
