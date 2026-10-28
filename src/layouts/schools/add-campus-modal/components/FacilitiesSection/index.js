import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import { AmenityService } from "services/amenityService";
import ManageFacilitiesLink from "layouts/amenities/ManageFacilitiesLink";
import { clearCampusFacilitiesAmenitiesCache } from "layouts/schools/view-campus/components/CampusFacilities";

const dedupeAmenitiesById = (rows = []) =>
  rows
    .filter(
      (amenity, index, self) =>
        amenity?.id && index === self.findIndex((a) => a.id === amenity.id)
    )
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || "")));

function FacilitiesSection({ facilities, onFacilitiesChange, disabled = false, modalOpen = true }) {
  const [availableAmenities, setAvailableAmenities] = useState([]);
  const [selectedAmenityIds, setSelectedAmenityIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (!modalOpen) return undefined;

    let cancelled = false;

    const loadAmenities = async () => {
      try {
        setIsLoading(true);
        setLoadError("");
        clearCampusFacilitiesAmenitiesCache();
        const amenities = await AmenityService.getAllAmenities();
        if (cancelled) return;
        setAvailableAmenities(dedupeAmenitiesById(Array.isArray(amenities) ? amenities : []));
      } catch (error) {
        if (!cancelled) {
          setAvailableAmenities([]);
          setLoadError(error?.message || "Failed to load facilities.");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadAmenities();
    return () => {
      cancelled = true;
    };
  }, [modalOpen]);

  useEffect(() => {
    if (facilities && facilities.length > 0) {
      if (facilities[0] && typeof facilities[0] === "object" && facilities[0].amenityId) {
        setSelectedAmenityIds(facilities.map((facility) => facility.amenityId));
      } else if (facilities[0] && typeof facilities[0] === "object" && facilities[0].id) {
        setSelectedAmenityIds(facilities.map((amenity) => amenity.id));
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
      updatedAmenityIds = [...selectedAmenityIds, amenityId];
    } else {
      updatedAmenityIds = selectedAmenityIds.filter((id) => id !== amenityId);
    }

    setSelectedAmenityIds(updatedAmenityIds);

    const updatedAmenities = updatedAmenityIds.map((id) => ({ amenityId: String(id) }));
    onFacilitiesChange(updatedAmenities);
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
      <SoftBox mb={3} display="flex" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap">
        <SoftBox>
          <SoftTypography variant="h6" fontWeight="medium" mb={1}>
            Location Facilities
          </SoftTypography>
          <SoftTypography variant="body2" color="text">
            Select facilities for this location. To add or edit facility names and icons, use Manage
            facilities.
          </SoftTypography>
        </SoftBox>
        <ManageFacilitiesLink openInNewTab />
      </SoftBox>

      {loadError && (
        <SoftTypography variant="caption" color="error" display="block" mb={2}>
          {loadError}
        </SoftTypography>
      )}

      {availableAmenities.length === 0 && !loadError ? (
        <SoftTypography variant="body2" color="text">
          No facilities in the catalog yet. Use Manage facilities to add some.
        </SoftTypography>
      ) : (
      <Grid container spacing={2}>
        {availableAmenities.map((amenity) => (
          <Grid item xs={12} sm={6} md={4} key={amenity.id}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={isAmenitySelected(amenity.id)}
                  onChange={(e) => handleAmenityChange(amenity.id, e.target.checked)}
                  disabled={disabled}
                />
              }
              label={
                <SoftBox display="flex" alignItems="center" gap={1}>
                  {amenity.iconUrl ? (
                    <SoftBox
                      component="img"
                      src={amenity.iconUrl}
                      alt=""
                      sx={{ width: 20, height: 20, objectFit: "contain" }}
                    />
                  ) : null}
                  {amenity.name}
                </SoftBox>
              }
            />
          </Grid>
        ))}
      </Grid>
      )}
    </>
  );
}

FacilitiesSection.propTypes = {
  facilities: PropTypes.array.isRequired,
  onFacilitiesChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  modalOpen: PropTypes.bool,
};

FacilitiesSection.defaultProps = {
  disabled: false,
  modalOpen: true,
};

export default FacilitiesSection;
