import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { SchoolService } from "services/schoolService";
import { breadcrumbCache } from "examples/Breadcrumbs/utils/breadcrumbUtils";
import { SchoolBreadcrumbs, SchoolSidebar, SchoolContent } from "./components";
import { useCan } from "permissions/useCan";
import { F } from "permissions/features";
import ManageCampuses from "./components/ManageCampuses";
import CampusModal from "../add-campus-modal";
import SchoolModal from "../add-school-modal";

function ViewSchool() {
  const { can } = useCan();
  const { id } = useParams();
  const navigate = useNavigate();
  const [school, setSchool] = useState(null);
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
  const [campusModalMode, setCampusModalMode] = useState("add");
  const [selectedCampus, setSelectedCampus] = useState(null);
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [schoolModalMode, setSchoolModalMode] = useState("edit");
  const [campusRefreshKey, setCampusRefreshKey] = useState(0);
  const loadingRef = useRef(false);
  const loadedSchoolIdRef = useRef(null);
  const schoolRequestRef = useRef(null);
  const loadSchoolPromiseRef = useRef(null);

  const loadSchool = useCallback(async () => {
    if (loadingRef.current) {
      return;
    }

    if (loadedSchoolIdRef.current === id && school) {
      return;
    }

    if (schoolRequestRef.current && schoolRequestRef.current.schoolId === id) {
      try {
        const schoolData = await schoolRequestRef.current.promise;
        setSchool(schoolData);
        if (schoolData.name) {
          breadcrumbCache.set(id, schoolData.name);
        }
        loadedSchoolIdRef.current = id;
      } catch (error) {
        console.error("Error loading provider:", error);
      }
      return;
    }

    loadingRef.current = true;
    loadedSchoolIdRef.current = id;

    try {
      const schoolPromise = SchoolService.getSchoolById(id);
      schoolRequestRef.current = { schoolId: id, promise: schoolPromise };
      const schoolData = await schoolPromise;
      schoolRequestRef.current = null;
      setSchool(schoolData);
      if (schoolData.name) {
        breadcrumbCache.set(id, schoolData.name);
      }
    } catch (error) {
      console.error("Error loading provider:", error);
      navigate("/schools/schools-list");
      loadedSchoolIdRef.current = null;
    } finally {
      loadingRef.current = false;
      loadSchoolPromiseRef.current = null;
    }
  }, [id, navigate, school]);

  useEffect(() => {
    if (!id) {
      loadSchoolPromiseRef.current = null;
      return;
    }

    if (loadedSchoolIdRef.current === id && school) {
      return;
    }

    if (loadSchoolPromiseRef.current) {
      return;
    }

    if (loadingRef.current || schoolRequestRef.current) {
      return;
    }

    loadSchoolPromiseRef.current = loadSchool();

    return () => {
      loadSchoolPromiseRef.current = null;
    };
  }, [id, loadSchool, school]);

  if (!school) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox my={3}>
          <SoftBox display="flex" justifyContent="center" alignItems="center" p={4}>
            <SoftTypography variant="body2" color="text.secondary">
              Loading provider...
            </SoftTypography>
          </SoftBox>
        </SoftBox>
      </DashboardLayout>
    );
  }

  const handleBackToSchools = () => {
    navigate("/schools/schools-list");
  };

  const handleEdit = () => {
    setSchoolModalMode("edit");
    setIsSchoolModalOpen(true);
  };

  const handleCloseSchoolModal = () => {
    setIsSchoolModalOpen(false);
  };

  const handleOpenCampusModal = (mode = "add", campusData = null) => {
    setCampusModalMode(mode);
    setSelectedCampus(campusData);
    setIsCampusModalOpen(true);
  };

  const handleCloseCampusModal = () => {
    setIsCampusModalOpen(false);
    setSelectedCampus(null);
  };

  const handleAddCampus = () => {
    handleOpenCampusModal("add");
  };

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox my={3}>
        <SchoolBreadcrumbs schoolName={school.name} onBackClick={handleBackToSchools} />

        <Grid container spacing={3}>
          <Grid item xs={12} lg={3}>
            <SchoolSidebar school={school} />
          </Grid>

          <Grid item xs={12} lg={9}>
            <SchoolContent
              school={school}
              onEdit={handleEdit}
              showEdit={can(F.SCHOOL_PAGE_EDIT)}
            />
          </Grid>
        </Grid>

        <SoftBox mt={3}>
          <ManageCampuses
            key={campusRefreshKey}
            schoolId={id}
            onAddCampus={handleAddCampus}
            hideAddCampus={!can(F.SCHOOL_PAGE_ADD_CAMPUS)}
            hideRowMutations={!can(F.SCHOOL_PAGE_CAMPUS_ROW_MUTATE)}
          />
        </SoftBox>
      </SoftBox>

      <SchoolModal
        open={isSchoolModalOpen}
        onClose={handleCloseSchoolModal}
        mode={schoolModalMode}
        schoolData={school}
        onSuccess={loadSchool}
      />

      <CampusModal
        open={isCampusModalOpen}
        onClose={handleCloseCampusModal}
        mode={campusModalMode}
        campusData={selectedCampus}
        schoolId={id}
        onSuccess={() => {
          setCampusRefreshKey((prev) => prev + 1);
        }}
      />
    </DashboardLayout>
  );
}

export default ViewSchool;
