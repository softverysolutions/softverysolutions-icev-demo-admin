import PropTypes from "prop-types";
import { useState, useEffect } from "react";
import Stack from "@mui/material/Stack";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import { CountryService } from "services/countryService";
import { CityService } from "services/cityService";

function CampusHeader({ campus, onEditCampus, showEdit }) {
  const [location, setLocation] = useState("");
  const [isLoadingLocation, setIsLoadingLocation] = useState(true);

  useEffect(() => {
    const loadLocation = async () => {
      try {
        setIsLoadingLocation(true);

        if (campus.city?.name && campus.country?.name) {
          setLocation(`${campus.city.name}, ${campus.country.name}`);
          return;
        }

        let cityName = "";
        let countryName = "";

        if (campus.cityId) {
          try {
            const cityData = await CityService.getCityById(campus.cityId);
            cityName = cityData.name;
          } catch (error) {
            console.warn("Failed to load city data:", error);
          }
        }

        if (campus.countryId) {
          try {
            const countryData = await CountryService.getCountryById(campus.countryId);
            countryName = countryData.name;
          } catch (error) {
            console.warn("Failed to load country data:", error);
          }
        }

        if (cityName && countryName) {
          setLocation(`${cityName}, ${countryName}`);
        } else if (cityName) {
          setLocation(cityName);
        } else if (countryName) {
          setLocation(countryName);
        } else {
          setLocation("Location not available");
        }
      } catch (error) {
        console.error("Error loading location data:", error);
        setLocation("Location not available");
      } finally {
        setIsLoadingLocation(false);
      }
    };

    if (campus) {
      loadLocation();
    }
  }, [campus]);

  const handleEdit = () => {
    onEditCampus();
  };

  return (
    <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
      <SoftBox>
        <SoftTypography variant="h4" fontWeight="bold" mb={1}>
          {campus.name}
        </SoftTypography>
        <SoftTypography variant="body1" color="text" mb={2}>
          {isLoadingLocation ? "Loading location..." : location}
        </SoftTypography>
      </SoftBox>
      {showEdit !== false && (
        <Stack spacing={1} direction="row">
          <SoftButton
            variant="outlined"
            color="info"
            size="small"
            startIcon={<Icon>edit</Icon>}
            onClick={handleEdit}
          >
            Edit
          </SoftButton>
        </Stack>
      )}
    </SoftBox>
  );
}

CampusHeader.propTypes = {
  campus: PropTypes.object.isRequired,
  onEditCampus: PropTypes.func.isRequired,
  showEdit: PropTypes.bool,
};

export default CampusHeader;
