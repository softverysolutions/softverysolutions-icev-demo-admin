import { useState, useEffect, useCallback } from "react";
import Card from "@mui/material/Card";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import DataTable from "examples/Tables/DataTable";

import { ExperienceService } from "services/experienceService";
import { formatExperienceType } from "utils/experienceTypeUtils";

import ExperienceModal from "../add-experience-modal";
import ActionsCell from "./components/ActionsCell";

const TABLE_COLUMNS = [
  { Header: "Name", accessor: "name", width: "24%" },
  { Header: "Type", accessor: "type", width: "14%" },
  { Header: "Location", accessor: "location", width: "20%" },
  { Header: "Duration", accessor: "duration", width: "16%" },
  { Header: "Status", accessor: "status", width: "10%" },
  { Header: "Actions", accessor: "actions", width: "16%" },
];

function ExperiencesList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("add");
  const [selectedExperience, setSelectedExperience] = useState(null);
  const [togglingId, setTogglingId] = useState(null);
  const [search, setSearch] = useState("");

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const response = await ExperienceService.searchExperiences({
        search: search.trim(),
        page: 1,
        limit: 100,
      });
      const data = Array.isArray(response) ? response : response.data || [];
      setList(data);
    } catch (err) {
      console.error(err);
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => loadList(), 300);
    return () => clearTimeout(timer);
  }, [loadList]);

  const openModal = (mode, experience = null) => {
    setModalMode(mode);
    setSelectedExperience(experience);
    setModalOpen(true);
  };

  const handleToggleStatus = async (experience) => {
    const newActive = !(experience.isActive !== false);
    setTogglingId(experience.id);
    try {
      await ExperienceService.updateExperience(experience.id, { isActive: newActive });
      await loadList();
    } catch (err) {
      console.error(err);
      alert(err?.message || "Failed to update status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleView = async (experience) => {
    try {
      const full = await ExperienceService.getExperienceById(experience.id);
      openModal("view", full);
    } catch (err) {
      console.error(err);
      openModal("view", experience);
    }
  };

  const handleEdit = async (experience) => {
    try {
      const full = await ExperienceService.getExperienceById(experience.id);
      openModal("edit", full);
    } catch (err) {
      console.error(err);
      openModal("edit", experience);
    }
  };

  const renderActionsCell = (row) => (
    <ActionsCell
      row={row}
      onView={handleView}
      onEdit={handleEdit}
      onToggleStatus={handleToggleStatus}
      isToggling={togglingId === row.original.actions?.id}
    />
  );

  const columns = TABLE_COLUMNS.map((col) =>
    col.accessor === "actions"
      ? { ...col, Cell: ({ row }) => renderActionsCell(row) }
      : col
  );

  const rows = list.map((exp) => ({
    id: exp.id,
    name: exp.name || "—",
    type: formatExperienceType(exp.type),
    location: exp.location || "—",
    duration: exp.duration || "—",
    status: exp.isActive !== false ? "Active" : "Inactive",
    actions: exp,
  }));

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox my={3}>
        <Card>
          <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" p={3}>
            <SoftBox lineHeight={1}>
              <SoftTypography variant="h5" fontWeight="medium">
                Experiences
              </SoftTypography>
              <SoftTypography variant="button" fontWeight="regular" color="text">
                Manage experiences connected to packages
              </SoftTypography>
            </SoftBox>
            <SoftButton variant="gradient" color="info" onClick={() => openModal("add")}>
              Create new experience
            </SoftButton>
          </SoftBox>
          <SoftBox px={3} pb={2}>
            <SoftInput
              placeholder="Search by name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={{ component: "search", direction: "left" }}
            />
          </SoftBox>
          <SoftBox px={3} pb={3}>
            <DataTable
              table={{ columns, rows }}
              entriesPerPage={{ defaultValue: 10, entries: [5, 10, 15, 20, 25] }}
              canSearch={false}
              showTotalEntries
              isSorted={false}
              noEndBorder
              loading={loading}
            />
          </SoftBox>
        </Card>
      </SoftBox>

      <ExperienceModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedExperience(null);
        }}
        mode={modalMode}
        experienceData={selectedExperience}
        onSuccess={loadList}
      />
    </DashboardLayout>
  );
}

export default ExperiencesList;
