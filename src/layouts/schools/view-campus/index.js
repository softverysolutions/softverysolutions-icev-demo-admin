import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Grid from "@mui/material/Grid";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";
import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import CampusBreadcrumbs from "./components/CampusBreadcrumbs";
import CampusSidebar from "./components/CampusSidebar";
import CampusContent from "./components/CampusContent";
import CampusDetails from "./components/CampusDetails";
import CampusLists from "./components/CampusLists";
import CampusModal from "../add-campus-modal";

import { CampusService } from "services/campusService";
import { SchoolService } from "services/schoolService";
import { breadcrumbCache } from "examples/Breadcrumbs/utils/breadcrumbUtils";
import { mockSchool } from "./data/mockData";
import { useCan } from "permissions/useCan";
import { F } from "permissions/features";

function ViewCampus() {
  const { can } = useCan();
  const { schoolId, campusId } = useParams();
  const navigate = useNavigate();
  const [campus, setCampus] = useState(null);
  const [school, setSchool] = useState(mockSchool);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const loadingRef = useRef(false);
  const loadedCampusIdRef = useRef(null);
  const loadedSchoolIdRef = useRef(null);
  const campusRequestRef = useRef(null);
  const schoolRequestRef = useRef(null);
  const loadCampusPromiseRef = useRef(null);

  const loadCampus = useCallback(async (forceReload = false) => {
    if (loadingRef.current) {
      return;
    }

    if (!forceReload && loadedCampusIdRef.current === campusId && loadedSchoolIdRef.current) {
      return;
    }

    if (!forceReload && campusRequestRef.current && campusRequestRef.current.campusId === campusId) {
      try {
        const campusData = await campusRequestRef.current.promise;
        setCampus(campusData);
        const currentSchoolId = campusData.schoolId || schoolId;
        if (currentSchoolId && loadedSchoolIdRef.current !== currentSchoolId) {
          if (campusData.school) {
            setSchool(campusData.school);
            loadedSchoolIdRef.current = currentSchoolId;
            if (campusData.school.name) {
              breadcrumbCache.set(currentSchoolId, campusData.school.name);
            }
          } else if (!schoolRequestRef.current || schoolRequestRef.current.schoolId !== currentSchoolId) {
            const schoolPromise = SchoolService.getSchoolById(currentSchoolId);
            schoolRequestRef.current = { schoolId: currentSchoolId, promise: schoolPromise };
            const schoolData = await schoolPromise;
            schoolRequestRef.current = null;
            setSchool(schoolData);
            loadedSchoolIdRef.current = currentSchoolId;
            if (schoolData.name) {
              breadcrumbCache.set(currentSchoolId, schoolData.name);
            }
          } else {
            const schoolData = await schoolRequestRef.current.promise;
            setSchool(schoolData);
            loadedSchoolIdRef.current = currentSchoolId;
            if (schoolData.name) {
              breadcrumbCache.set(currentSchoolId, schoolData.name);
            }
          }
        }
      } catch (error) {
        console.error("Error loading location:", error);
      }
      return;
    }

    loadingRef.current = true;
    loadedCampusIdRef.current = campusId;
    setIsLoading(true);
    
    try {
      const campusPromise = CampusService.getCampusById(campusId);
      campusRequestRef.current = { campusId, promise: campusPromise };
      const campusData = await campusPromise;
      campusRequestRef.current = null;
      setCampus(campusData);
      if (campusData.name) {
        breadcrumbCache.set(campusId, campusData.name);
      }

      const currentSchoolId = campusData.schoolId || schoolId;
      if (currentSchoolId && loadedSchoolIdRef.current !== currentSchoolId) {
        if (campusData.school) {
          setSchool(campusData.school);
          loadedSchoolIdRef.current = currentSchoolId;
          if (campusData.school.name) {
            breadcrumbCache.set(currentSchoolId, campusData.school.name);
          }
        } else if (!schoolRequestRef.current || schoolRequestRef.current.schoolId !== currentSchoolId) {
          const schoolPromise = SchoolService.getSchoolById(currentSchoolId);
          schoolRequestRef.current = { schoolId: currentSchoolId, promise: schoolPromise };
          const schoolData = await schoolPromise;
          schoolRequestRef.current = null;
          setSchool(schoolData);
          loadedSchoolIdRef.current = currentSchoolId;
          if (schoolData.name) {
            breadcrumbCache.set(currentSchoolId, schoolData.name);
          }
        } else {
          const schoolData = await schoolRequestRef.current.promise;
          setSchool(schoolData);
          loadedSchoolIdRef.current = currentSchoolId;
          if (schoolData.name) {
            breadcrumbCache.set(currentSchoolId, schoolData.name);
          }
        }
      }
    } catch (error) {
      console.error("Error loading location:", error);
      navigate(`/schools/view/${schoolId}`);
      loadedCampusIdRef.current = null;
    } finally {
      setIsLoading(false);
      loadingRef.current = false;
      loadCampusPromiseRef.current = null;
    }
  }, [campusId, schoolId, navigate]);

  useEffect(() => {
    if (!campusId) {
      loadCampusPromiseRef.current = null;
      return;
    }
    
    if (
      loadedCampusIdRef.current === campusId && 
      loadedSchoolIdRef.current &&
      campus &&
      school
    ) {
      return;
    }
    
    if (loadCampusPromiseRef.current || loadingRef.current || campusRequestRef.current) {
      return;
    }
    
    loadCampusPromiseRef.current = loadCampus();
    
    return () => {
      if (!loadingRef.current) {
        loadCampusPromiseRef.current = null;
      }
    };
  }, [campusId, loadCampus, campus, school]);

  const handleBackToSchool = () => {
    navigate(`/schools/view/${schoolId}`);
  };

  const handleEditCampus = () => {
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox my={3}>
          <SoftBox display="flex" justifyContent="center" alignItems="center" p={4}>
            <SoftTypography variant="body2" color="text.secondary">
              Loading location...
            </SoftTypography>
          </SoftBox>
        </SoftBox>
      </DashboardLayout>
    );
  }

  if (!campus) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox my={3}>
          <SoftBox display="flex" justifyContent="center" alignItems="center" p={4}>
            <SoftTypography variant="body2" color="text.secondary">
              Location not found
            </SoftTypography>
          </SoftBox>
        </SoftBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <SoftBox my={3}>
        <CampusBreadcrumbs
          schoolName={school.name}
          campusName={campus.name}
          onBackClick={handleBackToSchool}
        />

        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} lg={3}>
            <CampusSidebar campus={campus} />
          </Grid>

          <Grid item xs={12} lg={9}>
            <CampusContent
              campus={campus}
              onEditCampus={handleEditCampus}
              showEdit={can(F.CAMPUS_PAGE_EDIT)}
            />
          </Grid>
        </Grid>

        <SoftBox mb={3}>
          <CampusDetails campus={campus} />
        </SoftBox>

        <CampusLists campus={campus} />
      </SoftBox>

      <CampusModal
        open={isEditModalOpen}
        onClose={handleCloseEditModal}
        mode="edit"
        campusData={campus}
        onSuccess={() => loadCampus(true)}
      />
    </DashboardLayout>
  );
}

export default ViewCampus;
