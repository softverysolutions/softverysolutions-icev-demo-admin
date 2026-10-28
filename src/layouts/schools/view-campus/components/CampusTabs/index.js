import { useState, useEffect } from "react";
import PropTypes from "prop-types";

// @mui material components
import AppBar from "@mui/material/AppBar";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";

// Soft UI Dashboard PRO React components
import SoftBox from "components/SoftBox";

// Soft UI Dashboard PRO React base styles
import breakpoints from "assets/theme/base/breakpoints";

// Campus tab components
import CampusDescription from "../CampusDescription";
import CampusGallery from "../CampusGallery";
import CampusFacilities from "../CampusFacilities";
import CampusNationalityMix from "../CampusNationalityMix";
import CampusFaq from "../CampusFaq";

function CampusTabs({ campus }) {
  const [tabsOrientation, setTabsOrientation] = useState("horizontal");
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    function handleTabsOrientation() {
      return window.innerWidth < breakpoints.values.sm
        ? setTabsOrientation("vertical")
        : setTabsOrientation("horizontal");
    }

    window.addEventListener("resize", handleTabsOrientation);

    handleTabsOrientation();

    return () => window.removeEventListener("resize", handleTabsOrientation);
  }, [tabsOrientation]);

  const handleSetTabValue = (event, newValue) => setTabValue(newValue);

  const renderTabContent = () => {
    switch (tabValue) {
      case 0:
        return (
          <CampusDescription
            description={campus.description || "No description available"}
            campus={campus}
          />
        );
      case 1:
        return <CampusGallery images={campus.images} />;
      case 2:
        return <CampusFacilities facilities={campus.amenities} />;
      case 3:
        return (
          <CampusNationalityMix
            nationalityMix={campus.nationalityMix}
            nationalities={campus.nationalities}
          />
        );
      case 4:
        return <CampusFaq campusId={campus.id} />;
      default:
        return null;
    }
  };

  return (
    <SoftBox>
      <AppBar position="static">
        <Tabs orientation={tabsOrientation} value={tabValue} onChange={handleSetTabValue}>
          <Tab label="Description" />
          <Tab label="Gallery" />
          <Tab label="Facilities" />
          <Tab label="Participants from" />
          <Tab label="FAQ" />
        </Tabs>
      </AppBar>
      <SoftBox mt={3}>{renderTabContent()}</SoftBox>
    </SoftBox>
  );
}

CampusTabs.propTypes = {
  campus: PropTypes.object.isRequired,
};

export default CampusTabs;
