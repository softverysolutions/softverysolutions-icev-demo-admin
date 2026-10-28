import { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import { AmenityService } from "services/amenityService";
import ManageFacilitiesLink from "layouts/amenities/ManageFacilitiesLink";

const facilityIcons = {
  "Wi-Fi": "wifi",
  "Computer Room": "computer",
  "Test Center": "quiz",
  Kitchen: "kitchen",
  Cafeteria: "restaurant",
  "Participant Lounge": "weekend",
  Library: "local_library",
  "Prayer Room": "mosque",
  "Free Coffee and Tea": "local_cafe",
  "Wheelchair Access": "accessible",
  "Vending Machines": "vending_machine",
  "Ping Pong Table": "sports_tennis",
};

const facilityColors = {
  "Wi-Fi": "info",
  "Computer Room": "primary",
  "Test Center": "secondary",
  Kitchen: "success",
  Cafeteria: "warning",
  "Participant Lounge": "error",
  Library: "dark",
  "Prayer Room": "info",
  "Free Coffee and Tea": "primary",
  "Wheelchair Access": "secondary",
  "Vending Machines": "success",
  "Ping Pong Table": "warning",
};

let amenitiesCache = null;
let amenitiesCachePromise = null;
let amenitiesLoadingRef = { current: false };
let amenitiesLoadingLock = false;

const getAmenitiesCache = () => amenitiesCache;
const getAmenitiesCachePromise = () => amenitiesCachePromise;
const setAmenitiesCache = (cache) => {
  amenitiesCache = cache;
};
const setAmenitiesCachePromise = (promise) => {
  amenitiesCachePromise = promise;
};

export function clearCampusFacilitiesAmenitiesCache() {
  amenitiesCache = null;
  amenitiesCachePromise = null;
}

function CampusFacilities({ facilities: campusFacilities = [] }) {
  const [allAmenities, setAllAmenities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const componentIdRef = useRef(Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    const loadAmenities = async () => {
      const cached = getAmenitiesCache();
      if (cached) {
        console.log(`[CampusFacilities-${componentIdRef.current}] Using cached amenities`);
        setAllAmenities(cached);
        setIsLoading(false);
        return;
      }

      const existingPromise = getAmenitiesCachePromise();
      if (existingPromise) {
        console.log(`[CampusFacilities-${componentIdRef.current}] Waiting for existing promise`);
        try {
          const amenities = await existingPromise;
          const uniqueAmenities = amenities.filter(
            (amenity, index, self) => index === self.findIndex((a) => a.name === amenity.name)
          );
          setAmenitiesCache(uniqueAmenities);
          setAllAmenities(uniqueAmenities);
          setIsLoading(false);
        } catch (error) {
          setIsLoading(false);
        }
        return;
      }

      if (amenitiesLoadingRef.current || amenitiesLoadingLock) {
        const existingPromiseAfterCheck = getAmenitiesCachePromise();
        if (existingPromiseAfterCheck) {
          console.log(`[CampusFacilities-${componentIdRef.current}] Waiting for existing promise (after check)`);
          try {
            const amenities = await existingPromiseAfterCheck;
            const uniqueAmenities = amenities.filter(
              (amenity, index, self) => index === self.findIndex((a) => a.name === amenity.name)
            );
            setAmenitiesCache(uniqueAmenities);
            setAllAmenities(uniqueAmenities);
            setIsLoading(false);
          } catch (error) {
            setIsLoading(false);
          }
          return;
        }
        console.log(`[CampusFacilities-${componentIdRef.current}] Already loading, skipping`);
        return;
      }

      amenitiesLoadingLock = true;
      amenitiesLoadingRef.current = true;
      
      const promiseCheckAfterLock = getAmenitiesCachePromise();
      if (promiseCheckAfterLock) {
        amenitiesLoadingLock = false;
        amenitiesLoadingRef.current = false;
        console.log(`[CampusFacilities-${componentIdRef.current}] Promise found after lock, waiting for it`);
        try {
          const amenities = await promiseCheckAfterLock;
          const uniqueAmenities = amenities.filter(
            (amenity, index, self) => index === self.findIndex((a) => a.name === amenity.name)
          );
          setAmenitiesCache(uniqueAmenities);
          setAllAmenities(uniqueAmenities);
          setIsLoading(false);
        } catch (error) {
          setIsLoading(false);
        }
        return;
      }
      
      try {
        console.log(`[CampusFacilities-${componentIdRef.current}] Fetching amenities`);
        setIsLoading(true);
        
        const promise = AmenityService.getAllAmenities();
        setAmenitiesCachePromise(promise);
        
        const amenities = await promise;

        const uniqueAmenities = amenities.filter(
          (amenity, index, self) => index === self.findIndex((a) => a.name === amenity.name)
        );

        setAmenitiesCache(uniqueAmenities);
        setAllAmenities(uniqueAmenities);
        console.log(`[CampusFacilities-${componentIdRef.current}] Amenities loaded and cached`);
      } catch (error) {
        console.error(`[CampusFacilities-${componentIdRef.current}] Error loading amenities:`, error);
      } finally {
        setIsLoading(false);
        setAmenitiesCachePromise(null);
        amenitiesLoadingRef.current = false;
        amenitiesLoadingLock = false;
      }
    };

    loadAmenities();
  }, []);

  const getFacilityNames = (facilities) => {
    if (!facilities || facilities.length === 0) {
      return [];
    }

    let names = [];

    if (facilities[0] && typeof facilities[0] === "object" && facilities[0].amenityId) {
      names = facilities
        .map((facility) => {
          const amenity = allAmenities.find((a) => a.id === facility.amenityId);
          return amenity ? amenity.name : null;
        })
        .filter(Boolean);
    } else if (facilities[0] && typeof facilities[0] === "object" && facilities[0].name) {
      names = facilities.map((facility) => facility.name);
    } else if (typeof facilities[0] === "string") {
      names = facilities;
    }
    return names.filter((name, index, self) => index === self.findIndex((n) => n === name));
  };

  const displayFacilityNames = getFacilityNames(campusFacilities);

  const getAmenityForName = (name) =>
    allAmenities.find((amenity) => amenity.name === name) || null;

  const facilitiesHeader = (
    <SoftBox mb={2} display="flex" justifyContent="space-between" alignItems="flex-start" gap={2} flexWrap="wrap">
      <SoftBox>
        <SoftTypography variant="h6" fontWeight="medium">
          Facilities
        </SoftTypography>
        <SoftTypography variant="body2" color="text">
          Icons and names are configured globally. Assign facilities to this location in Edit location.
        </SoftTypography>
      </SoftBox>
      <ManageFacilitiesLink />
    </SoftBox>
  );

  if (isLoading) {
    return (
      <SoftBox mb={3}>
        {facilitiesHeader}
        <SoftBox display="flex" justifyContent="center" alignItems="center" p={3}>
          <CircularProgress />
        </SoftBox>
      </SoftBox>
    );
  }

  if (displayFacilityNames.length === 0) {
    return (
      <SoftBox mb={3}>
        {facilitiesHeader}
        <SoftTypography variant="body2" color="text.secondary">
          No facilities assigned to this location yet. Edit the location to select facilities, or add new ones
          with icons using the button above.
        </SoftTypography>
      </SoftBox>
    );
  }

  return (
    <SoftBox mb={3}>
      {facilitiesHeader}
      <Grid container spacing={2}>
        {displayFacilityNames.map((facilityName, index) => {
          const amenity = getAmenityForName(facilityName);
          const iconUrl = amenity?.iconUrl;
          const fallbackIcon = facilityIcons[facilityName] || "build";
          const color = facilityColors[facilityName] || "info";

          return (
            <Grid item xs={6} key={index}>
              <Card>
                <SoftBox p={2}>
                  <Grid container alignItems="center">
                    <Grid item xs={8}>
                      <SoftBox lineHeight={1}>
                        <SoftTypography
                          variant="button"
                          color="text"
                          textTransform="capitalize"
                          fontWeight="medium"
                          opacity={0.7}
                        >
                          {facilityName}
                        </SoftTypography>
                        <SoftTypography variant="h6" fontWeight="bold" color="dark">
                          Available
                        </SoftTypography>
                      </SoftBox>
                    </Grid>
                    <Grid item xs={4}>
                      <SoftBox display="flex" justifyContent="center" alignItems="center">
                        <SoftBox
                          width="3rem"
                          height="3rem"
                          bgColor={iconUrl ? "white" : color}
                          borderRadius="md"
                          display="flex"
                          justifyContent="center"
                          alignItems="center"
                          color="white"
                          shadow="md"
                          variant={iconUrl ? undefined : "gradient"}
                          border={iconUrl ? "1px solid" : undefined}
                          borderColor={iconUrl ? "grey.300" : undefined}
                          overflow="hidden"
                        >
                          {iconUrl ? (
                            <img
                              src={iconUrl}
                              alt=""
                              style={{ width: "70%", height: "70%", objectFit: "contain" }}
                            />
                          ) : (
                            <Icon fontSize="small">{fallbackIcon}</Icon>
                          )}
                        </SoftBox>
                      </SoftBox>
                    </Grid>
                  </Grid>
                </SoftBox>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </SoftBox>
  );
}

CampusFacilities.propTypes = {
  facilities: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        amenityId: PropTypes.string,
      }),
    ])
  ),
};

export default CampusFacilities;
