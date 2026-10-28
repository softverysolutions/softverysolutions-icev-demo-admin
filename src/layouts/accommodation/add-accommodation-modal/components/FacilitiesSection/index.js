import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import { AmenityService } from "services/amenityService";
import { ACCOMMODATION_FACILITIES } from "../../constants";

function FacilitiesSection({ facilities, onFacilityChange, disabled = false }) {
  const [availableAmenities, setAvailableAmenities] = useState([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAmenities = async () => {
      try {
        setIsLoading(true);
        const amenities = await AmenityService.getAllAmenities();

        const uniqueAmenities = amenities.filter(
          (amenity, index, self) => index === self.findIndex((a) => a.name === amenity.name)
        );

        const accommodationAmenities = uniqueAmenities.filter((amenity) =>
          ACCOMMODATION_FACILITIES.includes(amenity.name)
        );

        setAvailableAmenities(accommodationAmenities.length ? accommodationAmenities : uniqueAmenities);
      } catch (error) {
      } finally {
        setIsLoading(false);
      }
    };

    loadAmenities();
  }, []);

  useEffect(() => {
    if (facilities && facilities.length > 0) {
      if (facilities[0] && typeof facilities[0] === "object" && facilities[0].amenityId) {
        const ids = facilities.map((facility) => facility.amenityId);
        setSelectedAmenityIds(ids);
      } else if (facilities[0] && typeof facilities[0] === "object" && facilities[0].id) {
        const ids = facilities.map((amenity) => amenity.id);
        setSelectedAmenityIds(ids);
      } else if (facilities[0] && typeof facilities[0] === "object" && facilities[0].name) {
        const ids = facilities
          .map(
            (facility) => availableAmenities.find((amenity) => amenity.name === facility.name)?.id
          )
          .filter(Boolean);
        setSelectedAmenityIds(ids);
      } else if (typeof facilities[0] === "string") {
        const ids = facilities
          .map((name) => availableAmenities.find((amenity) => amenity.name === name)?.id)
          .filter(Boolean);
        setSelectedAmenityIds(ids);
      }
    } else {
      setSelectedAmenityIds([]);
    }
  }, [facilities, availableAmenities]);

  const handleAmenityChange = (amenityId, checked) => {
    if (disabled) return;

    let updatedAmenityIds;
    if (checked) {
      if (!selectedAmenityIds.includes(amenityId)) {
        updatedAmenityIds = [...selectedAmenityIds, amenityId];
      } else {
        updatedAmenityIds = selectedAmenityIds;
      }
    } else {
      updatedAmenityIds = selectedAmenityIds.filter((id) => id !== amenityId);
    }

    setSelectedAmenityIds(updatedAmenityIds);

    const updatedAmenities = updatedAmenityIds.map((id) => ({ amenityId: id }));
    onFacilityChange(updatedAmenities);
  };

  const isAmenitySelected = (amenityId) => {
    return selectedAmenityIds.includes(amenityId);
  };

  if (isLoading) {
    return (
      <SoftBox display="flex" justifyContent="center" alignItems="center" p={3}>
        <CircularProgress />
      </SoftBox>
    );
  }

  return (
    <>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Accommodation Facilities
      </SoftTypography>
      <SoftTypography variant="body2" color="text" mb={3}>
        Select the amenities available at your accommodation.
      </SoftTypography>

      <SoftBox
        display="grid"
        gridTemplateColumns={{
          xs: "1fr",
          sm: "repeat(2, max-content)",
          md: "repeat(3, max-content)",
        }}
        columnGap={6}
        rowGap={1}
        justifyItems="start"
      >
        {availableAmenities.map((amenity) => (
          <FormControlLabel
            key={amenity.id}
            sx={{
              m: 0,
              justifyContent: "flex-start",
              alignItems: "center",
            }}
            control={
              <Checkbox
                checked={isAmenitySelected(amenity.id)}
                onChange={(e) => handleAmenityChange(amenity.id, e.target.checked)}
                disabled={disabled}
                sx={{ p: 0.75 }}
              />
            }
            label={amenity.name}
          />
        ))}
      </SoftBox>
    </>
  );
}

FacilitiesSection.propTypes = {
  facilities: PropTypes.array.isRequired,
  onFacilityChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default FacilitiesSection;
