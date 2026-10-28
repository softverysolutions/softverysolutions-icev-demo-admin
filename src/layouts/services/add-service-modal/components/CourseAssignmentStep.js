import React, { useState, useEffect, useMemo, useRef } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";
import Alert from "@mui/material/Alert";
import { components } from "react-select";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftSelect from "components/SoftSelect";
import SoftInput from "components/SoftInput";

import { CountryService } from "services/countryService";
import { SchoolService } from "services/schoolService";
import { CampusService } from "services/campusService";
import { CourseService } from "services/courseService";
import { OptimizedDataService } from "services/optimizedDataService";
import { getCurrencySymbol } from "services/currencyService";
import { API_BASE_URL } from "config/api";
import { PRICE_TYPE_OPTIONS } from "../constants";

function validatePricingTiers(tiers) {
  const errors = [];
  const warnings = [];

  if (!tiers || tiers.length === 0) {
    return { errors, warnings };
  }

  const validTiers = tiers.filter(
    (t) => t.minWeeks && t.maxWeeks && Number(t.minWeeks) > 0 && Number(t.maxWeeks) > 0
  );

  tiers.forEach((tier, index) => {
    const from = Number(tier.minWeeks);
    const to = Number(tier.maxWeeks);

    if (from && to && from > to) {
      errors.push({
        tierIndex: index,
        message: `Tier ${index + 1}: Start range cannot be greater than End range.`,
      });
    }

    if (!tier.minWeeks || !tier.maxWeeks || !tier.amount) {
      errors.push({
        tierIndex: index,
        message: `Tier ${index + 1}: All fields are required.`,
      });
    }
  });

  for (let i = 0; i < validTiers.length; i++) {
    for (let j = i + 1; j < validTiers.length; j++) {
      const tier1 = validTiers[i];
      const tier2 = validTiers[j];

      const from1 = Number(tier1.minWeeks);
      const to1 = Number(tier1.maxWeeks);
      const from2 = Number(tier2.minWeeks);
      const to2 = Number(tier2.maxWeeks);

      if (from1 <= to2 && from2 <= to1) {
        const overlapStart = Math.max(from1, from2);
        const overlapEnd = Math.min(to1, to2);

        if (overlapStart === overlapEnd) {
          errors.push({
            tierIndex: i,
            tierIndex2: j,
            message: `Week ${overlapStart} is included in two tiers.`,
          });
        } else {
          errors.push({
            tierIndex: i,
            tierIndex2: j,
            message: `Weeks ${overlapStart}-${overlapEnd} are included in two tiers.`,
          });
        }
      }
    }
  }

  if (validTiers.length > 0 && errors.length === 0) {
    const sortedTiers = [...validTiers].sort((a, b) => Number(a.minWeeks) - Number(b.minWeeks));

    for (let i = 0; i < sortedTiers.length - 1; i++) {
      const currentTo = Number(sortedTiers[i].maxWeeks);
      const nextFrom = Number(sortedTiers[i + 1].minWeeks);

      if (nextFrom > currentTo + 1) {
        const gapStart = currentTo + 1;
        const gapEnd = nextFrom - 1;

        if (gapStart === gapEnd) {
          warnings.push({
            message: `Week ${gapStart} has no pricing tier.`,
          });
        } else {
          warnings.push({
            message: `Weeks ${gapStart}-${gapEnd} have no pricing tier.`,
          });
        }
      }
    }
  }

  return { errors, warnings };
}

const CustomMultiValue = ({ data, ...props }) => {
  const label = data.label.length > 15 ? `${data.label.substring(0, 15)}...` : data.label;
  return (
    <components.MultiValue {...props} data={data}>
      {label}
    </components.MultiValue>
  );
};

CustomMultiValue.propTypes = {
  data: PropTypes.shape({ label: PropTypes.string.isRequired }).isRequired,
};

const MenuListWithScroll = (props) => {
  const onScrollToBottom = props.selectProps?.onMenuScrollToBottom;
  return (
    <components.MenuList
      {...props}
      innerProps={{
        ...props.innerProps,
        onScroll: onScrollToBottom
          ? (e) => {
              const el = e.currentTarget;
              if (el.scrollHeight - el.scrollTop <= el.clientHeight + 30) {
                onScrollToBottom();
              }
            }
          : props.innerProps?.onScroll,
      }}
    />
  );
};

MenuListWithScroll.propTypes = {
  selectProps: PropTypes.shape({
    onMenuScrollToBottom: PropTypes.func,
  }),
  innerProps: PropTypes.object,
};

function CourseAssignmentStep({ formData, onInputChange, disabled = false }) {
  const [countries, setCountries] = useState([]);
  const [schools, setSchools] = useState([]);
  const [campuses, setCampuses] = useState([]);
  const [courses, setCourses] = useState([]);

  const [isLoadingCountries, setIsLoadingCountries] = useState(false);
  const [isLoadingSchools, setIsLoadingSchools] = useState(false);
  const [isLoadingCampuses, setIsLoadingCampuses] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);

  const [countriesPage, setCountriesPage] = useState(1);
  const [countriesHasMore, setCountriesHasMore] = useState(true);
  const [schoolsPage, setSchoolsPage] = useState(1);
  const [schoolsHasMore, setSchoolsHasMore] = useState(true);
  const [campusesPage, setCampusesPage] = useState(1);
  const [campusesHasMore, setCampusesHasMore] = useState(true);
  const [coursesPage, setCoursesPage] = useState(1);
  const [coursesHasMore, setCoursesHasMore] = useState(true);

  const ITEMS_PER_PAGE = 10;

  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedSchools, setSelectedSchools] = useState([]);
  const [selectedCampuses, setSelectedCampuses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const schoolsLoadedRef = useRef(false);
  const schoolsLoadedForCountryRef = useRef(null);
  const campusesLoadedRef = useRef(false);
  const campusesLoadedForSchoolsRef = useRef(null);
  const coursesLoadedRef = useRef(false);
  const coursesLoadedForCampusesRef = useRef(null);
  const schoolsRequestRef = useRef(null);
  const campusesRequestRef = useRef(null);
  const coursesRequestRef = useRef(null);
  const relatedDataRequestRef = useRef(false);

  const [assignToAllCampuses, setAssignToAllCampuses] = useState(false);
  const [assignToAllCountry, setAssignToAllCountry] = useState(false);
  const [isMandatory, setIsMandatory] = useState(false);

  const pricingTiers = formData.courseAssignments?.[0]?.pricingTiers || [];
  const existingAssignment = formData.courseAssignments?.[0];
  const assignmentIdRef = useRef(existingAssignment?.id || Date.now());
  const mandatoryInitializedRef = useRef(false);
  const coursesManuallyClearedRef = useRef(false);
  const campusesManuallyClearedRef = useRef(false);
  const schoolsManuallyClearedRef = useRef(false);
  const countryManuallyClearedRef = useRef(false);
  const userChangedCountryRef = useRef(false);

  const validation = useMemo(() => validatePricingTiers(pricingTiers), [pricingTiers]);

  useEffect(() => {
    if (onInputChange && validation.errors.length > 0) {
      onInputChange("_hasValidationErrors", true);
    } else if (onInputChange) {
      onInputChange("_hasValidationErrors", false);
    }
  }, [validation.errors.length]);

  useEffect(() => {
    const loadCountries = async (page = 1, append = false) => {
      setIsLoadingCountries(true);
      try {
        const response = await CountryService.getAllCountries({
          page: page,
          limit: ITEMS_PER_PAGE,
          sortBy: "name",
          sortDirection: "asc",
        });
        const countriesData = response.data || [];
        const newCountries = countriesData.map((c) => ({ value: c.id, label: c.name }));
        
        if (append) {
          setCountries((prev) => [...prev, ...newCountries]);
        } else {
          setCountries(newCountries);
        }
        
        const hasMore = response.meta ? page < response.meta.totalPages : newCountries.length === ITEMS_PER_PAGE;
        setCountriesHasMore(hasMore);
        setCountriesPage(page);
      } catch (err) {
        setCountries([]);
        setCountriesHasMore(false);
      } finally {
        setIsLoadingCountries(false);
      }
    };
    loadCountries(1, false);
  }, []);

  useEffect(() => {
    if (!selectedCountry && existingAssignment?.countryId && countries.length > 0) {
      const matchingCountry = countries.find((c) => c.value === existingAssignment.countryId);
      if (matchingCountry) {
        setSelectedCountry(matchingCountry);
        return; 
      }
    }

    if (!selectedCountry) {
      setSchools([]);
      schoolsLoadedRef.current = false;
      schoolsLoadedForCountryRef.current = null;
      schoolsRequestRef.current = null;
      setSchoolsPage(1);
      setSchoolsHasMore(true);
      return;
    }
    
    
    if (schoolsLoadedRef.current && schools.length > 0 && schoolsLoadedForCountryRef.current === selectedCountry.value) {
      if (!schoolsManuallyClearedRef.current && existingAssignment?.schoolIds && existingAssignment.schoolIds.length > 0 && selectedSchools.length === 0) {
        const matchingSchools = schools.filter((s) => 
          existingAssignment.schoolIds.includes(s.value)
        );
        if (matchingSchools.length > 0) {
          setSelectedSchools(matchingSchools);
        }
      }
      return;
    }
    
    if (schoolsRequestRef.current && schoolsRequestRef.current.countryId === selectedCountry.value) {
      return;
    }
    
    
    if (existingAssignment?.schoolIds && existingAssignment.schoolIds.length > 0 && 
        !schoolsManuallyClearedRef.current && schools.length === 0 &&
        existingAssignment.countryId &&
        schoolsLoadedForCountryRef.current === existingAssignment.countryId) {
      const loadSchoolsForView = async () => {
        const countryIdToUse = selectedCountry?.value || existingAssignment.countryId;
        if (schoolsRequestRef.current && schoolsRequestRef.current.countryId === countryIdToUse) {
          const schoolsResponse = await schoolsRequestRef.current.promise;
          const schoolsData = schoolsResponse.data || [];
          const newSchools = schoolsData.map((s) => ({
            value: s.id,
            label: s.name,
            countryId: s.countryId,
          }));
          setSchools(newSchools);
          schoolsLoadedRef.current = true;
          schoolsLoadedForCountryRef.current = countryIdToUse;
          if (!schoolsManuallyClearedRef.current) {
            const matchingSchools = newSchools.filter((s) => 
              existingAssignment.schoolIds.includes(s.value)
            );
            if (matchingSchools.length > 0) {
              setSelectedSchools(matchingSchools);
            }
          }
          return;
        }
        try {
          const schoolsPromise = SchoolService.getSchools({
            page: 1,
            limit: ITEMS_PER_PAGE,
            sortBy: "name",
            sortDirection: "asc",
            countryIds: [countryIdToUse], 
          });
          schoolsRequestRef.current = { countryId: countryIdToUse, promise: schoolsPromise };
          const response = await schoolsPromise;
          schoolsRequestRef.current = null;
          const schoolsData = response.data || [];
          const newSchools = schoolsData.map((s) => ({
            value: s.id,
            label: s.name,
            countryId: s.countryId,
          }));
          setSchools(newSchools);
          schoolsLoadedRef.current = true;
          schoolsLoadedForCountryRef.current = countryIdToUse;
          
          if (!schoolsManuallyClearedRef.current) {
            const matchingSchools = newSchools.filter((s) => 
              existingAssignment.schoolIds.includes(s.value)
            );
            if (matchingSchools.length > 0) {
              setSelectedSchools(matchingSchools);
            }
          }
        } catch (err) {
          schoolsRequestRef.current = null;
        }
      };
      loadSchoolsForView();
      return;
    }
    
    setSchoolsPage(1);
    setSchoolsHasMore(true);
    
    const loadSchools = async (page = 1, append = false) => {
      setIsLoadingSchools(true);
      try {
        const schoolsPromise = SchoolService.getSchools({
          page: page,
          limit: ITEMS_PER_PAGE,
          sortBy: "name",
          sortDirection: "asc",
          countryIds: [selectedCountry.value], 
        });
        schoolsRequestRef.current = { countryId: selectedCountry.value, promise: schoolsPromise };
        const response = await schoolsPromise;
        schoolsRequestRef.current = null;
        
        const schoolsData = response.data || [];
        const newSchools = schoolsData.map((s) => ({
          value: s.id,
          label: s.name,
          countryId: s.countryId,
        }));

        if (append) {
          setSchools((prev) => [...prev, ...newSchools]);
        } else {
          setSchools(newSchools);
        }

        const hasMore =
          response.meta ? page < response.meta.totalPages : newSchools.length === ITEMS_PER_PAGE;
        setSchoolsHasMore(hasMore);
        setSchoolsPage(page);
        schoolsLoadedRef.current = true;
        schoolsLoadedForCountryRef.current = selectedCountry.value;
      } catch (err) {
        setSchools([]);
        setSchoolsHasMore(false);
        schoolsLoadedRef.current = false;
        schoolsLoadedForCountryRef.current = null;
        schoolsRequestRef.current = null;
      } finally {
        setIsLoadingSchools(false);
      }
    };
    loadSchools(1, false);
  }, [selectedCountry, existingAssignment?.countryId, countries]);

  useEffect(() => {
    if (selectedSchools.length === 0) {
      setCampuses([]);
      setCampusesPage(1);
      setCampusesHasMore(true);
      campusesLoadedRef.current = false;
      campusesLoadedForSchoolsRef.current = null;
      campusesRequestRef.current = null;
      return;
    }
    
    const selectedSchoolIds = selectedSchools.map((s) => s.value).sort().join(',');
    
    if (existingAssignment?.campusIds && existingAssignment.campusIds.length > 0) {
      if (campuses.length === 0 && existingAssignment.campusIds.length > 0) {
        const loadCampusesForView = async () => {
          if (campusesRequestRef.current && campusesRequestRef.current.schoolIds === selectedSchoolIds) {
            const result = await campusesRequestRef.current.promise;
            if (result.ok) {
              const campusesResult = await result.json();
              const campusesData = campusesResult.data || [];
              const newCampuses = campusesData.map((c) => ({
                value: c.id,
                label: c.name,
                schoolId: c.schoolId,
              }));
              setCampuses(newCampuses);
              if (!campusesManuallyClearedRef.current) {
                const matchingCampuses = newCampuses.filter((c) => 
                  existingAssignment.campusIds.includes(c.value)
                );
                if (matchingCampuses.length > 0) {
                  setSelectedCampuses(matchingCampuses);
                }
              }
            }
            return;
          }
          try {
            const token = await CampusService.getAuthToken();
            const campusesPromise = fetch(`${API_BASE_URL}/admin/campuses/search`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                search: "",
                page: 1,
                limit: ITEMS_PER_PAGE,
                sortBy: "name",
                sortDirection: "asc",
                filters: {
                  schoolIds: selectedSchools.map((s) => s.value),
                },
              }),
            });
            campusesRequestRef.current = { schoolIds: selectedSchoolIds, promise: campusesPromise };
            const result = await campusesPromise;
            campusesRequestRef.current = null;
            if (result.ok) {
              const campusesResult = await result.json();
              const campusesData = campusesResult.data || [];
              const newCampuses = campusesData.map((c) => ({
                value: c.id,
                label: c.name,
                schoolId: c.schoolId,
              }));
              setCampuses(newCampuses);
              campusesLoadedRef.current = true;
              campusesLoadedForSchoolsRef.current = selectedSchoolIds;
              
              if (!campusesManuallyClearedRef.current) {
                const matchingCampuses = newCampuses.filter((c) => 
                  existingAssignment.campusIds.includes(c.value)
                );
                if (matchingCampuses.length > 0) {
                  setSelectedCampuses(matchingCampuses);
                }
              }
            }
          } catch (err) {
            campusesRequestRef.current = null;
          }
        };
        loadCampusesForView();
        return;
      } else if (campuses.length > 0 && selectedCampuses.length === 0) {
        const matchingCampuses = campuses.filter((c) => 
          existingAssignment.campusIds.includes(c.value)
        );
        if (matchingCampuses.length > 0) {
          setSelectedCampuses(matchingCampuses);
        }
        return;
      }
    }
    
    if (campusesLoadedRef.current && campuses.length > 0 && campusesLoadedForSchoolsRef.current === selectedSchoolIds) {
      return;
    }
    
    if (campusesRequestRef.current && campusesRequestRef.current.schoolIds === selectedSchoolIds) {
      return;
    }
    
    const loadCampuses = async (page = 1, append = false) => {
      setIsLoadingCampuses(true);
      try {
        const token = await CampusService.getAuthToken();
        const campusesPromise = fetch(`${API_BASE_URL}/admin/campuses/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            search: "",
            page: page,
            limit: ITEMS_PER_PAGE,
            sortBy: "name",
            sortDirection: "asc",
            filters: {
              schoolIds: selectedSchools.map((s) => s.value),
            },
          }),
        });
        campusesRequestRef.current = { schoolIds: selectedSchoolIds, promise: campusesPromise };
        const response = await campusesPromise;
        campusesRequestRef.current = null;

        if (!response.ok) {
          throw new Error(`Failed to fetch campuses: ${response.status}`);
        }

        const result = await response.json();
        const campusesData = result.data || [];
        const newCampuses = campusesData.map((c) => ({
          value: c.id,
          label: c.name,
          schoolId: c.schoolId,
        }));

        if (append) {
          setCampuses((prev) => [...prev, ...newCampuses]);
        } else {
          setCampuses(newCampuses);
        }

        const hasMore = result.meta ? page < result.meta.totalPages : newCampuses.length === ITEMS_PER_PAGE;
        setCampusesHasMore(hasMore);
        setCampusesPage(page);
        campusesLoadedRef.current = true;
        campusesLoadedForSchoolsRef.current = selectedSchoolIds;
      } catch (err) {
        setCampuses([]);
        setCampusesHasMore(false);
        campusesLoadedRef.current = false;
        campusesLoadedForSchoolsRef.current = null;
        campusesRequestRef.current = null;
      } finally {
        setIsLoadingCampuses(false);
      }
    };
    loadCampuses(1, false);
  }, [selectedSchools]);

  useEffect(() => {
    if (selectedCampuses.length === 0 && existingAssignment?.courseIds && existingAssignment.courseIds.length > 0 && existingAssignment?.campusIds && existingAssignment.campusIds.length > 0) {
      const loadCoursesFromExisting = async () => {
        if (relatedDataRequestRef.current) {
          return;
        }
        if (coursesLoadedRef.current && coursesLoadedForCampusesRef.current === existingAssignment.campusIds.sort().join(',')) {
          return;
        }
        try {
          relatedDataRequestRef.current = true;
          const relatedData = await OptimizedDataService.getRelatedDataForCourses(
            existingAssignment.courseIds
          );
          if (relatedData.courses && relatedData.courses.length > 0) {
            setCourses(relatedData.courses);
            coursesLoadedRef.current = true;
            coursesLoadedForCampusesRef.current = existingAssignment.campusIds.sort().join(',');
            
            if (!coursesManuallyClearedRef.current) {
              const matchingCourses = relatedData.courses.filter((c) => 
                existingAssignment.courseIds.includes(c.value)
              );
              if (matchingCourses.length > 0) {
                setSelectedCourses(matchingCourses);
              }
            }
            relatedDataRequestRef.current = false;
            return;
          }
          
          const coursesPromise = CourseService.getAllCourses({
            page: 1,
            limit: ITEMS_PER_PAGE,
            sortBy: "name",
            sortDirection: "asc",
            campusIds: existingAssignment.campusIds,
          });
          const coursesResponse = await coursesPromise;
          const coursesData = coursesResponse.data || [];
          const newCourses = coursesData.map((c) => ({
            value: c.id,
            label: c.name,
            campusId: c.campusId,
          }));
          setCourses(newCourses);
          coursesLoadedRef.current = true;
          coursesLoadedForCampusesRef.current = existingAssignment.campusIds.sort().join(',');
          
          if (!coursesManuallyClearedRef.current) {
            const matchingCourses = newCourses.filter((c) => 
              existingAssignment.courseIds.includes(c.value)
            );
            if (matchingCourses.length > 0) {
              setSelectedCourses(matchingCourses);
            }
          }
        } catch (err) {
          console.error("Error loading courses from existing assignment:", err);
        } finally {
          relatedDataRequestRef.current = false;
        }
      };
      loadCoursesFromExisting();
      return;
    }

    if (selectedCampuses.length === 0) {
      setCourses([]);
      setCoursesPage(1);
      setCoursesHasMore(true);
      coursesLoadedRef.current = false;
      coursesLoadedForCampusesRef.current = null;
      coursesRequestRef.current = null;
      return;
    }
    
    const selectedCampusIds = selectedCampuses.map((c) => c.value).sort().join(',');
    
    if (coursesLoadedRef.current && courses.length > 0 && coursesLoadedForCampusesRef.current === selectedCampusIds) {
      if (!coursesManuallyClearedRef.current && existingAssignment?.courseIds && existingAssignment.courseIds.length > 0 && selectedCourses.length === 0) {
        const matchingCourses = courses.filter((c) => 
          existingAssignment.courseIds.includes(c.value)
        );
        if (matchingCourses.length > 0) {
          setSelectedCourses(matchingCourses);
        }
      }
      return;
    }
    
    if (coursesRequestRef.current && coursesRequestRef.current.campusIds === selectedCampusIds) {
      return;
    }
    
    const loadCourses = async (page = 1, append = false) => {
      setIsLoadingCourses(true);
      try {
        const coursesPromise = CourseService.getAllCourses({
          page: page,
          limit: ITEMS_PER_PAGE,
          sortBy: "name",
          sortDirection: "asc",
          campusIds: selectedCampuses.map((c) => c.value),
        });
        coursesRequestRef.current = { campusIds: selectedCampusIds, promise: coursesPromise };
        const response = await coursesPromise;
        coursesRequestRef.current = null;
        
        const coursesData = response.data || [];
        const newCourses = coursesData.map((c) => ({
          value: c.id,
          label: c.name,
          campusId: c.campusId,
        }));

        if (append) {
          setCourses((prev) => [...prev, ...newCourses]);
        } else {
          setCourses(newCourses);
        }

        const hasMore = response.meta ? page < response.meta.totalPages : newCourses.length === ITEMS_PER_PAGE;
        setCoursesHasMore(hasMore);
        setCoursesPage(page);
        coursesLoadedRef.current = true;
        coursesLoadedForCampusesRef.current = selectedCampusIds;
        
        if (!append && !coursesManuallyClearedRef.current && existingAssignment?.courseIds && existingAssignment.courseIds.length > 0 && selectedCourses.length === 0) {
          const matchingCourses = newCourses.filter((c) => 
            existingAssignment.courseIds.includes(c.value)
          );
          if (matchingCourses.length > 0) {
            setSelectedCourses(matchingCourses);
          }
        }
      } catch (err) {
        setCourses([]);
        setCoursesHasMore(false);
        coursesLoadedRef.current = false;
        coursesLoadedForCampusesRef.current = null;
        coursesRequestRef.current = null;
      } finally {
        setIsLoadingCourses(false);
      }
    };
    loadCourses(1, false);
  }, [selectedCampuses]);

  useEffect(() => {
    if (!formData.courseAssignments || formData.courseAssignments.length === 0) {
      onInputChange("courseAssignments", [
        {
          id: Date.now(),
          countryId: null,
          schoolIds: [],
          campusIds: [],
          courseIds: [],
          isMandatory: false,
          pricingTiers: [
            { id: Date.now(), minWeeks: 1, maxWeeks: 4, priceType: "per_week", amount: "" },
          ],
        },
      ]);
      mandatoryInitializedRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!existingAssignment) {
      return;
    }

    if (existingAssignment.countryId && !selectedCountry && countries.length > 0) {
      const matchingCountry = countries.find((c) => c.value === existingAssignment.countryId);
      if (matchingCountry) {
        setSelectedCountry(matchingCountry);
      }
    }
  }, [existingAssignment?.countryId, countries, selectedCountry]);

  useEffect(() => {
    if (!existingAssignment || !existingAssignment.schoolIds || existingAssignment.schoolIds.length === 0) {
      return;
    }

    if (schoolsManuallyClearedRef.current) {
      return;
    }

    if (schools.length > 0 && selectedSchools.length === 0) {
      const matchingSchools = schools.filter((s) => 
        existingAssignment.schoolIds.includes(s.value)
      );
      if (matchingSchools.length > 0) {
        setSelectedSchools(matchingSchools);
      }
    }
  }, [existingAssignment?.schoolIds, schools, selectedSchools.length]);

  useEffect(() => {
    if (!existingAssignment || !existingAssignment.campusIds || existingAssignment.campusIds.length === 0) {
      return;
    }

    if (campusesManuallyClearedRef.current) {
      return;
    }

    if (campuses.length > 0 && selectedCampuses.length === 0) {
      const matchingCampuses = campuses.filter((c) => 
        existingAssignment.campusIds.includes(c.value)
      );
      if (matchingCampuses.length > 0) {
        setSelectedCampuses(matchingCampuses);
      }
    }
  }, [existingAssignment?.campusIds, campuses, selectedCampuses.length]);

  useEffect(() => {
    if (!existingAssignment || !existingAssignment.courseIds || existingAssignment.courseIds.length === 0) {
      return;
    }

    if (coursesManuallyClearedRef.current) {
      return;
    }

    if (courses.length > 0 && selectedCourses.length === 0) {
      const matchingCourses = courses.filter((c) => 
        existingAssignment.courseIds.includes(c.value)
      );
      if (matchingCourses.length > 0) {
        setSelectedCourses(matchingCourses);
      }
    }
  }, [existingAssignment?.courseIds, courses, selectedCourses.length]);

  useEffect(() => {
    const loadRelatedDataIfNeeded = async () => {
      if (!existingAssignment) {
        return;
      }

      if (relatedDataRequestRef.current) {
        return;
      }

      const hasCourseIds = existingAssignment.courseIds && existingAssignment.courseIds.length > 0;
      const hasCountryOrSchools = existingAssignment.countryId && 
        existingAssignment.schoolIds?.length > 0;
      const missingRelatedData = 
        !existingAssignment.countryId || 
        !existingAssignment.schoolIds || 
        existingAssignment.schoolIds.length === 0 ||
        !existingAssignment.initialSchoolIds ||
        existingAssignment.initialSchoolIds.length === 0;

      if (hasCourseIds && missingRelatedData && !hasCountryOrSchools) {
        try {
          relatedDataRequestRef.current = true;
          const relatedData = await OptimizedDataService.getRelatedDataForCourses(
            existingAssignment.courseIds
          );

          const countryId = relatedData.schools?.[0]?.countryId || existingAssignment.countryId || null;

          const updatedAssignment = {
            ...existingAssignment,
            countryId: countryId,
            schoolIds: relatedData.schools.map((s) => s.value),
            campusIds: relatedData.campuses.map((c) => c.value),
            initialSchoolIds: relatedData.schools.map((s) => s.value),
            initialCampusIds: relatedData.campuses.map((c) => c.value),
          };

          onInputChange("courseAssignments", [updatedAssignment]);
          
          if (relatedData.schools && relatedData.schools.length > 0) {
            setSchools(relatedData.schools);
            schoolsLoadedRef.current = true;
            schoolsLoadedForCountryRef.current = countryId;
            
            const matchingSchools = relatedData.schools.filter((s) => 
              updatedAssignment.schoolIds.includes(s.value)
            );
            if (matchingSchools.length > 0 && !schoolsManuallyClearedRef.current) {
              setSelectedSchools(matchingSchools);
            }
          }
          
          if (relatedData.campuses && relatedData.campuses.length > 0) {
            setCampuses(relatedData.campuses);
            campusesLoadedRef.current = true;
            campusesLoadedForSchoolsRef.current = updatedAssignment.schoolIds.sort().join(',');
            
            const matchingCampuses = relatedData.campuses.filter((c) => 
              updatedAssignment.campusIds.includes(c.value)
            );
            if (matchingCampuses.length > 0 && !campusesManuallyClearedRef.current) {
              setSelectedCampuses(matchingCampuses);
            }
          }
          
          if (relatedData.courses && relatedData.courses.length > 0) {
            setCourses(relatedData.courses);
            coursesLoadedRef.current = true;
            coursesLoadedForCampusesRef.current = updatedAssignment.campusIds.sort().join(',');
            
            const matchingCourses = relatedData.courses.filter((c) => 
              updatedAssignment.courseIds.includes(c.value)
            );
            if (matchingCourses.length > 0 && !coursesManuallyClearedRef.current) {
              setSelectedCourses(matchingCourses);
            }
          }
          
          if (countryId && !selectedCountry) {
            const matchingCountry = countries.find((c) => c.value === countryId);
            if (matchingCountry) {
              setSelectedCountry(matchingCountry);
            } else if (countries.length > 0) {
              CountryService.getCountryById(countryId).then((country) => {
                if (country) {
                  const countryOption = { value: country.id, label: country.name };
                  setCountries((prev) => {
                    const exists = prev.some((c) => c.value === country.id);
                    if (exists) return prev;
                    return [countryOption, ...prev];
                  });
                  setSelectedCountry(countryOption);
                }
              });
            }
          }
        } catch (error) {
          console.error("Error loading related data for courses:", error);
        } finally {
          relatedDataRequestRef.current = false;
        }
      }
    };

    loadRelatedDataIfNeeded();
  }, [existingAssignment?.courseIds, existingAssignment?.countryId, countries, selectedCountry, onInputChange]);

  useEffect(() => {
    if (existingAssignment?.id) {
      assignmentIdRef.current = existingAssignment.id;
    }
  }, [existingAssignment?.id]);

  useEffect(() => {
    if (!existingAssignment) {
      return;
    }

    if (existingAssignment.assignToAllCampusCourses !== undefined) {
      setAssignToAllCampuses(Boolean(existingAssignment.assignToAllCampusCourses));
    }
    if (existingAssignment.assignToAllCountryCourses !== undefined) {
      setAssignToAllCountry(Boolean(existingAssignment.assignToAllCountryCourses));
    }
    if (!mandatoryInitializedRef.current && existingAssignment.isMandatory !== undefined) {
      setIsMandatory(Boolean(existingAssignment.isMandatory));
      mandatoryInitializedRef.current = true;
    }
  }, [
    existingAssignment?.assignToAllCampusCourses,
    existingAssignment?.assignToAllCountryCourses,
    existingAssignment?.isMandatory,
  ]);

  useEffect(() => {
    if (
      !existingAssignment?.countryId ||
      selectedCountry ||
      countryManuallyClearedRef.current ||
      userChangedCountryRef.current
    ) {
      return;
    }
    if (countries.length === 0) {
      return;
    }
    const matchingCountry = countries.find((c) => c.value === existingAssignment.countryId);
    if (matchingCountry) {
      setSelectedCountry(matchingCountry);
    } else {
      CountryService.getCountryById(existingAssignment.countryId).then((country) => {
        if (country) {
          const countryOption = { value: country.id, label: country.name };
          setCountries((prev) => {
            const exists = prev.some((c) => c.value === country.id);
            if (exists) return prev;
            return [countryOption, ...prev];
          });
          setSelectedCountry(countryOption);
        }
      });
    }
  }, [existingAssignment?.countryId, countries, selectedCountry]);

  useEffect(() => {
    if (
      selectedSchools.length === 0 ||
      selectedCountry ||
      countryManuallyClearedRef.current ||
      userChangedCountryRef.current
    ) {
      return;
    }
    const countryIdFromSchool = selectedSchools[0]?.countryId;
    if (!countryIdFromSchool) return;

    const matchingCountry = countries.find((c) => c.value === countryIdFromSchool);
    if (matchingCountry) {
      setSelectedCountry(matchingCountry);
    } else {
      CountryService.getCountryById(countryIdFromSchool).then((country) => {
        if (country) {
          const countryOption = { value: country.id, label: country.name };
          setCountries((prev) => {
            const exists = prev.some((c) => c.value === country.id);
            if (exists) return prev;
            return [countryOption, ...prev];
          });
          setSelectedCountry(countryOption);
        }
      });
    }
  }, [selectedSchools, selectedCountry, countries]);

  useEffect(() => {
    if (
      !existingAssignment?.schoolIds?.length ||
      selectedSchools.length > 0 ||
      schoolsManuallyClearedRef.current ||
      !selectedCountry ||
      userChangedCountryRef.current
    ) {
      return;
    }
    if (schools.length === 0) {
      return;
    }
    const isInitialCountrySelection = selectedCountry?.value === existingAssignment.countryId;
    if (!isInitialCountrySelection) {
      return;
    }
    const matchingSchools = schools.filter((s) => existingAssignment.schoolIds.includes(s.value));
    if (matchingSchools.length > 0) {
      setSelectedSchools(matchingSchools);
    }
  }, [existingAssignment?.schoolIds, schools, selectedSchools.length, selectedCountry]);

  useEffect(() => {
    coursesManuallyClearedRef.current = false;
    campusesManuallyClearedRef.current = false;
    schoolsManuallyClearedRef.current = false;
    countryManuallyClearedRef.current = false;
    userChangedCountryRef.current = false; 
  }, [existingAssignment?.id]);

  useEffect(() => {
    if (
      !existingAssignment?.campusIds?.length ||
      selectedCampuses.length > 0 ||
      campusesManuallyClearedRef.current ||
      selectedSchools.length === 0 ||
      userChangedCountryRef.current
    ) {
      return;
    }
    if (campuses.length === 0) {
      return;
    }
    const selectedSchoolIds = selectedSchools.map((s) => s.value).sort();
    const existingSchoolIds = (existingAssignment.schoolIds || []).sort();
    const schoolsMatch = JSON.stringify(selectedSchoolIds) === JSON.stringify(existingSchoolIds);
    if (!schoolsMatch) {
      return;
    }
    const matchingCampuses = campuses.filter((c) => existingAssignment.campusIds.includes(c.value));
    if (matchingCampuses.length > 0) {
      setSelectedCampuses(matchingCampuses);
    }
  }, [existingAssignment?.campusIds, campuses, selectedCampuses.length, selectedSchools]);

  useEffect(() => {
    if (
      assignToAllCampuses ||
      !existingAssignment?.courseIds?.length ||
      selectedCourses.length > 0 ||
      coursesManuallyClearedRef.current ||
      selectedCampuses.length === 0 ||
      userChangedCountryRef.current
    ) {
      return;
    }
    if (courses.length === 0) {
      return;
    }
    const selectedCampusIds = selectedCampuses.map((c) => c.value).sort();
    const existingCampusIds = (existingAssignment.campusIds || []).sort();
    const campusesMatch = JSON.stringify(selectedCampusIds) === JSON.stringify(existingCampusIds);
    if (!campusesMatch) {
      return;
    }
    const matchingCourses = courses.filter((c) => existingAssignment.courseIds.includes(c.value));
    if (matchingCourses.length > 0) {
      setSelectedCourses(matchingCourses);
    }
  }, [assignToAllCampuses, existingAssignment?.courseIds, courses, selectedCourses.length, selectedCampuses]);

  useEffect(() => {
    const hasExistingSelection =
      Boolean(existingAssignment?.countryId) ||
      (existingAssignment?.schoolIds || []).length > 0 ||
      (existingAssignment?.campusIds || []).length > 0 ||
      (existingAssignment?.courseIds || []).length > 0;
    const isEmptySelection =
      !selectedCountry &&
      selectedSchools.length === 0 &&
      selectedCampuses.length === 0 &&
      selectedCourses.length === 0;

    if (isEmptySelection && hasExistingSelection) {
      return;
    }

    const currentCourseIds = assignToAllCampuses ? [] : selectedCourses.map((c) => c.value);
    
    if (hasExistingSelection) {
      if (existingAssignment?.schoolIds?.length > 0 && selectedSchools.length === 0) {
        const courseOnlyAssignment = {
          ...existingAssignment,
          courseIds: currentCourseIds,
        };
        const current = formData.courseAssignments?.[0];
        const hasSameCourseSelection = JSON.stringify(current?.courseIds || []) === JSON.stringify(currentCourseIds);
        if (!hasSameCourseSelection) {
          onInputChange("courseAssignments", [courseOnlyAssignment]);
        }
        return;
      }
      if (existingAssignment?.campusIds?.length > 0 && selectedCampuses.length === 0) {
        const courseOnlyAssignment = {
          ...existingAssignment,
          courseIds: currentCourseIds,
        };
        const current = formData.courseAssignments?.[0];
        const hasSameCourseSelection = JSON.stringify(current?.courseIds || []) === JSON.stringify(currentCourseIds);
        if (!hasSameCourseSelection) {
          onInputChange("courseAssignments", [courseOnlyAssignment]);
        }
        return;
      }
    }

    const assignment = {
      id: assignmentIdRef.current,
      countryId: selectedCountry?.value || null,
      schoolIds: selectedSchools.map((s) => s.value),
      campusIds: selectedCampuses.map((c) => c.value),
      courseIds: currentCourseIds,
      assignToAllCampusCourses: assignToAllCampuses,
      assignToAllCountryCourses: assignToAllCountry,
      isMandatory: isMandatory,
      pricingTiers: formData.courseAssignments?.[0]?.pricingTiers || [
        { id: Date.now(), minWeeks: 1, maxWeeks: 4, priceType: "per_week", amount: "" },
      ],
      courseServiceMap: formData.courseAssignments?.[0]?.courseServiceMap || {},
      courseDurationPricesMap: formData.courseAssignments?.[0]?.courseDurationPricesMap || {},
      initialCourseIds: formData.courseAssignments?.[0]?.initialCourseIds || [], 
      initialSchoolIds: formData.courseAssignments?.[0]?.initialSchoolIds || existingAssignment?.schoolIds || [],
      initialCampusIds: formData.courseAssignments?.[0]?.initialCampusIds || existingAssignment?.campusIds || [],
    };
  
    const current = formData.courseAssignments?.[0];
    const hasSameSelection =
      current?.countryId === assignment.countryId &&
      JSON.stringify(current?.schoolIds || []) === JSON.stringify(assignment.schoolIds) &&
      JSON.stringify(current?.campusIds || []) === JSON.stringify(assignment.campusIds) &&
      JSON.stringify(current?.courseIds || []) === JSON.stringify(assignment.courseIds) &&
      Boolean(current?.assignToAllCampusCourses) === assignToAllCampuses &&
      Boolean(current?.assignToAllCountryCourses) === assignToAllCountry &&
      Boolean(current?.isMandatory) === Boolean(assignment.isMandatory);

    if (!hasSameSelection) {
      onInputChange("courseAssignments", [assignment]);
    }
  }, [
    existingAssignment?.countryId,
    existingAssignment?.schoolIds,
    existingAssignment?.campusIds,
    existingAssignment?.courseIds,
    selectedCountry,
    selectedSchools,
    selectedCampuses,
    selectedCourses,
    assignToAllCampuses,
    assignToAllCountry,
    isMandatory,
  ]);

  const handleCountryChange = (selected) => {
    const previousCountryId = selectedCountry?.value;
    const newCountryId = selected?.value;
    const existingCountryId = existingAssignment?.countryId;
    
    const countryChangedFromPrevious = previousCountryId && newCountryId && previousCountryId !== newCountryId;
    const countryChangedFromSaved = existingCountryId && newCountryId && existingCountryId !== newCountryId;
    const countryChanged = countryChangedFromPrevious || countryChangedFromSaved;
    
    const hadSavedCourses = existingAssignment?.courseIds && existingAssignment.courseIds.length > 0;
 
    
    if (countryChanged) {
      userChangedCountryRef.current = true;
      if (hadSavedCourses) {
        schoolsManuallyClearedRef.current = true;
        campusesManuallyClearedRef.current = true;
        coursesManuallyClearedRef.current = true;
      }
    }
    
    if (!selected && existingCountryId) {
      countryManuallyClearedRef.current = true;
    } else if (selected) {
      countryManuallyClearedRef.current = false;
    }
    
    setSelectedCountry(selected);
    
    if (countryChanged && hadSavedCourses) {
      setSelectedSchools([]);
      setSelectedCampuses([]);
      setSelectedCourses([]);
    } else if (!selected) {
      setSelectedSchools([]);
      setSelectedCampuses([]);
      setSelectedCourses([]);
    }

    if (countryChanged || !selected) {
      setSchools([]); 
      schoolsLoadedRef.current = false;
      schoolsLoadedForCountryRef.current = null; 
      schoolsRequestRef.current = null; 
    }
    
    setSchoolsPage(1);
    setSchoolsHasMore(true);
    setCampusesPage(1);
    setCampusesHasMore(true);
    setCoursesPage(1);
    setCoursesHasMore(true);
  };

  const handleSchoolsChange = async (selected) => {
    const newSelected = selected || [];
    const previousSchoolIds = selectedSchools.map((s) => s.value);
    const newSchoolIds = newSelected.map((s) => s.value);
    
    const removedSchoolIds = previousSchoolIds.filter((id) => !newSchoolIds.includes(id));
    const hadSavedCourses = existingAssignment?.courseIds && existingAssignment.courseIds.length > 0;
    
    if (removedSchoolIds.length > 0 && hadSavedCourses) {
      campusesManuallyClearedRef.current = true;
      coursesManuallyClearedRef.current = true;
    }
    
    if (newSelected.length === 0 && existingAssignment?.schoolIds?.length > 0) {
      schoolsManuallyClearedRef.current = true;
      campusesManuallyClearedRef.current = true;
      coursesManuallyClearedRef.current = true;
    } else if (newSelected.length > 0 && removedSchoolIds.length === 0) {
      schoolsManuallyClearedRef.current = false;
      if (!hadSavedCourses || removedSchoolIds.length === 0) {
        campusesManuallyClearedRef.current = false;
        coursesManuallyClearedRef.current = false;
      }
    }
    
    setSelectedSchools(newSelected);
    
    if (removedSchoolIds.length > 0 && hadSavedCourses) {
      setSelectedCampuses([]);
      setSelectedCourses([]);
      setCampusesPage(1);
      setCampusesHasMore(true);
      setCoursesPage(1);
      setCoursesHasMore(true);
      return;
    }
    
    if (removedSchoolIds.length > 0) {
      if (newSchoolIds.length > 0) {
        try {
          const newSchoolIdsStr = newSchoolIds.sort().join(',');
          let campusesData = [];
          
          if (campusesLoadedRef.current && campusesLoadedForSchoolsRef.current === newSchoolIdsStr && campuses.length > 0) {
            campusesData = campuses.map(c => ({ id: c.value }));
          } else if (campusesRequestRef.current && campusesRequestRef.current.schoolIds === newSchoolIdsStr) {
            const campusesResult = await campusesRequestRef.current.promise;
            campusesData = campusesResult.data || [];
          } else {
            const token = await CampusService.getAuthToken();
            const campusesPromise = fetch(`${API_BASE_URL}/admin/campuses/search`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                search: "",
                page: 1,
                limit: ITEMS_PER_PAGE,
                sortBy: "name",
                sortDirection: "asc",
                filters: {
                  schoolIds: newSchoolIds,
                },
              }),
            });
            campusesRequestRef.current = { schoolIds: newSchoolIdsStr, promise: campusesPromise };
            const campusesResponse = await campusesPromise;
            campusesRequestRef.current = null;
            
            if (campusesResponse.ok) {
              const campusesResult = await campusesResponse.json();
              campusesData = campusesResult.data || [];
            }
          }
          
          if (campusesData.length > 0) {
            const availableCampusIds = new Set(campusesData.map((c) => c.id));
            
            const filteredCampuses = selectedCampuses.filter((campus) => 
              availableCampusIds.has(campus.value)
            );
            setSelectedCampuses(filteredCampuses);
            
            if (selectedCourses.length > 0) {
              const remainingCampusIds = filteredCampuses.map((c) => c.value);
              
              if (remainingCampusIds.length > 0) {
                const remainingCampusIdsStr = remainingCampusIds.sort().join(',');
                let coursesData = [];
                
                if (coursesLoadedRef.current && coursesLoadedForCampusesRef.current === remainingCampusIdsStr && courses.length > 0) {
                  coursesData = courses.map(c => ({ id: c.value }));
                } else if (coursesRequestRef.current && coursesRequestRef.current.campusIds === remainingCampusIdsStr) {
                  const coursesResponse = await coursesRequestRef.current.promise;
                  coursesData = coursesResponse.data || [];
                } else {
                  const coursesPromise = CourseService.getAllCourses({
                    page: 1,
                    limit: ITEMS_PER_PAGE,
                    sortBy: "name",
                    sortDirection: "asc",
                    campusIds: remainingCampusIds,
                  });
                  coursesRequestRef.current = { campusIds: remainingCampusIdsStr, promise: coursesPromise };
                  const coursesResponse = await coursesPromise;
                  coursesRequestRef.current = null;
                  coursesData = coursesResponse.data || [];
                }
                
                const availableCourseIds = new Set(coursesData.map((c) => c.id));
                
                setSelectedCourses((prevCourses) => 
                  prevCourses.filter((course) => availableCourseIds.has(course.value))
                );
              } else {
                setSelectedCourses([]);
              }
            }
          } else {
            setSelectedCampuses([]);
            setSelectedCourses([]);
          }
        } catch (err) {
          console.error("Error filtering campuses/courses:", err);
          setSelectedCampuses([]);
          setSelectedCourses([]);
        }
      } else {
        setSelectedCampuses([]);
        setSelectedCourses([]);
      }
    }
    
    setCampusesPage(1);
    setCampusesHasMore(true);
    setCoursesPage(1);
    setCoursesHasMore(true);
  };

  const handleCampusesChange = async (selected) => {
    const newSelected = selected || [];
    const previousCampusIds = selectedCampuses.map((c) => c.value);
    const newCampusIds = newSelected.map((c) => c.value);
    
    const removedCampusIds = previousCampusIds.filter((id) => !newCampusIds.includes(id));
    const hadSavedCourses = existingAssignment?.courseIds && existingAssignment.courseIds.length > 0;
  if (removedCampusIds.length > 0 && hadSavedCourses) {
      coursesManuallyClearedRef.current = true;
    }
    
    if (newSelected.length === 0 && existingAssignment?.campusIds?.length > 0) {
      campusesManuallyClearedRef.current = true;
      coursesManuallyClearedRef.current = true;
    } else if (newSelected.length > 0 && removedCampusIds.length === 0) {
      campusesManuallyClearedRef.current = false;
      if (!hadSavedCourses || removedCampusIds.length === 0) {
        coursesManuallyClearedRef.current = false;
      }
    }
    
    setSelectedCampuses(newSelected);
    
    if (removedCampusIds.length > 0 && hadSavedCourses) {
      setSelectedCourses([]);
      setCoursesPage(1);
      setCoursesHasMore(true);
      return;
    }
    
    if (removedCampusIds.length > 0 && selectedCourses.length > 0) {
      if (newCampusIds.length > 0) {
        try {
          const newCampusIdsStr = newCampusIds.sort().join(',');
          let coursesData = [];
          
          if (coursesLoadedRef.current && coursesLoadedForCampusesRef.current === newCampusIdsStr && courses.length > 0) {
            coursesData = courses.map(c => ({ id: c.value }));
          } else if (coursesRequestRef.current && coursesRequestRef.current.campusIds === newCampusIdsStr) {
            const coursesResponse = await coursesRequestRef.current.promise;
            coursesData = coursesResponse.data || [];
          } else {
            const coursesPromise = CourseService.getAllCourses({
              page: 1,
              limit: ITEMS_PER_PAGE,
              sortBy: "name",
              sortDirection: "asc",
              campusIds: newCampusIds,
            });
            coursesRequestRef.current = { campusIds: newCampusIdsStr, promise: coursesPromise };
            const coursesResponse = await coursesPromise;
            coursesRequestRef.current = null;
            coursesData = coursesResponse.data || [];
          }
          
          const availableCourseIds = new Set(coursesData.map((c) => c.id));
          
          setSelectedCourses((prevCourses) => 
            prevCourses.filter((course) => availableCourseIds.has(course.value))
          );
        } catch (err) {
          console.error("Error filtering courses:", err);
          setSelectedCourses([]);
        }
      } else {
        setSelectedCourses([]);
      }
    }
    
    setCoursesPage(1);
    setCoursesHasMore(true);
  };

  const handleCoursesChange = (selected) => {
    const newSelected = selected || [];
    if (newSelected.length === 0 && existingAssignment?.courseIds?.length > 0) {
      coursesManuallyClearedRef.current = true;
    } else if (newSelected.length > 0) {
      coursesManuallyClearedRef.current = false;
    }
    setSelectedCourses(newSelected);
  };

  const handleCountriesScrollToBottom = async () => {
    if (!isLoadingCountries && countriesHasMore) {
      const nextPage = countriesPage + 1;
      setIsLoadingCountries(true);
      try {
        const response = await CountryService.getAllCountries({
          page: nextPage,
          limit: ITEMS_PER_PAGE,
          sortBy: "name",
          sortDirection: "asc",
        });
        const countriesData = response.data || [];
        const newCountries = countriesData.map((c) => ({ value: c.id, label: c.name }));
        setCountries((prev) => [...prev, ...newCountries]);
        const hasMore = response.meta ? nextPage < response.meta.totalPages : newCountries.length === ITEMS_PER_PAGE;
        setCountriesHasMore(hasMore);
        setCountriesPage(nextPage);
      } catch (err) {
        setCountriesHasMore(false);
      } finally {
        setIsLoadingCountries(false);
      }
    }
  };

  const handleSchoolsScrollToBottom = async () => {
    if (!isLoadingSchools && schoolsHasMore && selectedCountry) {
      const nextPage = schoolsPage + 1;
      setIsLoadingSchools(true);
      try {
        const response = await SchoolService.getSchools({
          page: nextPage,
          limit: ITEMS_PER_PAGE,
          sortBy: "name",
          sortDirection: "asc",
          countryIds: [selectedCountry.value],
        });
        const schoolsData = response.data || [];
        const newSchools = schoolsData.map((s) => ({
          value: s.id,
          label: s.name,
          countryId: s.countryId,
        }));
        setSchools((prev) => [...prev, ...newSchools]);
        const hasMore = response.meta ? nextPage < response.meta.totalPages : newSchools.length === ITEMS_PER_PAGE;
        setSchoolsHasMore(hasMore);
        setSchoolsPage(nextPage);
      } catch (err) {
        setSchoolsHasMore(false);
      } finally {
        setIsLoadingSchools(false);
      }
    }
  };

  const handleCampusesScrollToBottom = async () => {
    if (!isLoadingCampuses && campusesHasMore && selectedSchools.length > 0) {
      const nextPage = campusesPage + 1;
      setIsLoadingCampuses(true);
      try {
        const token = await CampusService.getAuthToken();
        const response = await fetch(`${API_BASE_URL}/admin/campuses/search`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            search: "",
            page: nextPage,
            limit: ITEMS_PER_PAGE,
            sortBy: "name",
            sortDirection: "asc",
            filters: {
              schoolIds: selectedSchools.map((s) => s.value),
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch campuses: ${response.status}`);
        }

        const result = await response.json();
        const campusesData = result.data || [];
        const newCampuses = campusesData.map((c) => ({
          value: c.id,
          label: c.name,
          schoolId: c.schoolId,
        }));
        setCampuses((prev) => [...prev, ...newCampuses]);
        const hasMore = result.meta ? nextPage < result.meta.totalPages : newCampuses.length === ITEMS_PER_PAGE;
        setCampusesHasMore(hasMore);
        setCampusesPage(nextPage);
      } catch (err) {
        setCampusesHasMore(false);
      } finally {
        setIsLoadingCampuses(false);
      }
    }
  };

  const handleCoursesScrollToBottom = async () => {
    if (!isLoadingCourses && coursesHasMore && selectedCampuses.length > 0) {
      const nextPage = coursesPage + 1;
      setIsLoadingCourses(true);
      try {
        const response = await CourseService.getAllCourses({
          page: nextPage,
          limit: ITEMS_PER_PAGE,
          sortBy: "name",
          sortDirection: "asc",
          campusIds: selectedCampuses.map((c) => c.value),
        });
        const coursesData = response.data || [];
        const newCourses = coursesData.map((c) => ({
          value: c.id,
          label: c.name,
          campusId: c.campusId,
        }));
        setCourses((prev) => [...prev, ...newCourses]);
        const hasMore = response.meta ? nextPage < response.meta.totalPages : newCourses.length === ITEMS_PER_PAGE;
        setCoursesHasMore(hasMore);
        setCoursesPage(nextPage);
      } catch (err) {
        setCoursesHasMore(false);
      } finally {
        setIsLoadingCourses(false);
      }
    }
  };

  const updateAssignment = (newTiers) => {
    onInputChange("courseAssignments", [
      { ...formData.courseAssignments?.[0], pricingTiers: newTiers },
    ]);
  };

  const handleTierChange = (tierIndex, field, value) => {
    const newTiers = pricingTiers.map((tier, i) =>
      i === tierIndex ? { ...tier, [field]: value } : tier
    );
    updateAssignment(newTiers);
  };

  const handleAddTier = () => {
    updateAssignment([
      ...pricingTiers,
      { id: Date.now(), minWeeks: 1, maxWeeks: 4, priceType: "per_week", amount: "" },
    ]);
  };

  const handleRemoveTier = (tierIndex) => {
    updateAssignment(pricingTiers.filter((_, i) => i !== tierIndex));
  };

  return (
    <>
      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Assign programmes to this extra
      </SoftTypography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SoftBox mb={2}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Country
                </SoftTypography>
                <SoftSelect
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  options={countries}
                  isDisabled={disabled}
                  isLoading={isLoadingCountries}
                  placeholder="Select country"
                  isClearable
                  onMenuScrollToBottom={handleCountriesScrollToBottom}
                  components={{ MenuList: MenuListWithScroll }}
                />
              </SoftBox>
            </Grid>

            <Grid item xs={12} md={6}>
              <SoftBox mb={2}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Providers *
                </SoftTypography>
                <SoftSelect
                  value={selectedSchools}
                  onChange={handleSchoolsChange}
                  options={schools}
                  isDisabled={disabled || !selectedCountry}
                  isLoading={isLoadingSchools}
                  isMulti
                  placeholder={selectedCountry ? "Select providers" : "Select country first"}
                  components={{ MultiValue: CustomMultiValue, MenuList: MenuListWithScroll }}
                  onMenuScrollToBottom={handleSchoolsScrollToBottom}
                />
              </SoftBox>
            </Grid>

            <Grid item xs={12} md={6}>
              <SoftBox mb={2}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Locations *
                </SoftTypography>
                <SoftSelect
                  value={selectedCampuses}
                  onChange={handleCampusesChange}
                  options={campuses}
                  isDisabled={disabled || selectedSchools.length === 0}
                  isLoading={isLoadingCampuses}
                  isMulti
                  placeholder={
                    selectedSchools.length > 0 ? "Select locations" : "Select providers first"
                  }
                  components={{ MultiValue: CustomMultiValue, MenuList: MenuListWithScroll }}
                  onMenuScrollToBottom={handleCampusesScrollToBottom}
                />
              </SoftBox>
            </Grid>

            <Grid item xs={12} md={6}>
              <SoftBox mb={2}>
                <SoftTypography component="label" variant="caption" fontWeight="bold">
                  Programmes
                </SoftTypography>
                {!assignToAllCampuses ? (
                  <SoftSelect
                    value={selectedCourses}
                    onChange={handleCoursesChange}
                    options={courses}
                    isDisabled={disabled || selectedCampuses.length === 0}
                    isLoading={isLoadingCourses}
                    isMulti
                    placeholder={
                      selectedCampuses.length > 0 ? "Select programmes" : "Select locations first"
                    }
                    components={{ MultiValue: CustomMultiValue, MenuList: MenuListWithScroll }}
                    onMenuScrollToBottom={handleCoursesScrollToBottom}
                  />
                ) : (
                  <SoftBox display="flex" alignItems="center" height="38px">
                    <SoftTypography variant="caption" color="text">
                      All programmes from the selected locations will be assigned
                    </SoftTypography>
                  </SoftBox>
                )}
              </SoftBox>
            </Grid>

            <Grid item xs={12}>
              <SoftBox display="flex" flexDirection="column" gap={1}>
                <SoftBox
                  display="flex"
                  alignItems="center"
                  gap={1}
                  sx={{ cursor: "pointer" }}
                  onClick={() => {
                    if (!disabled && selectedCampuses.length > 0) {
                      setAssignToAllCampuses(!assignToAllCampuses);
                      if (!assignToAllCampuses) setSelectedCourses([]);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={assignToAllCampuses}
                    onChange={() => {}}
                    disabled={disabled || selectedCampuses.length === 0}
                    style={{ width: 18, height: 18, cursor: "pointer" }}
                  />
                  <SoftTypography variant="button" fontWeight="regular">
                    Assign to all programmes in the selected locations
                  </SoftTypography>
                </SoftBox>
                <SoftBox
                  display="flex"
                  alignItems="center"
                  gap={1}
                  sx={{ cursor: "pointer" }}
                  onClick={() => {
                    if (!disabled && selectedCountry) {
                      setAssignToAllCountry(!assignToAllCountry);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={assignToAllCountry}
                    onChange={() => {}}
                    disabled={disabled || !selectedCountry}
                    style={{ width: 18, height: 18, cursor: "pointer" }}
                  />
                  <SoftTypography variant="button" fontWeight="regular">
                    Assign to all programmes in this country
                  </SoftTypography>
                </SoftBox>
                <SoftBox
                  display="flex"
                  alignItems="center"
                  gap={1}
                  sx={{ cursor: "pointer" }}
                  onClick={() => {
                    if (!disabled) {
                      setIsMandatory(!isMandatory);
                    }
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isMandatory}
                    onChange={() => {}}
                    disabled={disabled}
                    style={{ width: 18, height: 18, cursor: "pointer" }}
                  />
                  <SoftTypography variant="button" fontWeight="regular">
                    Mandatory extra
                  </SoftTypography>
                </SoftBox>
              </SoftBox>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <SoftTypography variant="h6" fontWeight="medium" mb={2}>
        Pricing Tiers
      </SoftTypography>

      <Card>
        <CardContent>
          <SoftBox display="flex" justifyContent="flex-end" mb={2}>
            <SoftButton
              variant="outlined"
              color="info"
              size="small"
              onClick={handleAddTier}
              disabled={disabled}
            >
              + Add Tier
            </SoftButton>
          </SoftBox>

          <Grid container spacing={2} sx={{ mb: 1 }}>
            <Grid item xs={2}>
              <SoftTypography variant="caption" fontWeight="bold">
                Start Range
              </SoftTypography>
            </Grid>
            <Grid item xs={2}>
              <SoftTypography variant="caption" fontWeight="bold">
                End Range
              </SoftTypography>
            </Grid>
            <Grid item xs={3}>
              <SoftTypography variant="caption" fontWeight="bold">
                Price Type
              </SoftTypography>
            </Grid>
            <Grid item xs={3}>
              <SoftTypography variant="caption" fontWeight="bold">
                Amount
              </SoftTypography>
            </Grid>
            <Grid item xs={2} />
          </Grid>

          {pricingTiers.map((tier, index) => (
            <Grid container spacing={2} key={tier.id || index} sx={{ mb: 2, alignItems: "center" }}>
              <Grid item xs={2}>
                <SoftBox display="flex" alignItems="center" gap={0.5}>
                  <SoftInput
                    type="number"
                    value={tier.minWeeks || ""}
                    onChange={(e) => handleTierChange(index, "minWeeks", e.target.value)}
                    disabled={disabled}
                    size="small"
                    inputProps={{ min: 1 }}
                  />
                  <SoftTypography variant="caption">weeks</SoftTypography>
                </SoftBox>
              </Grid>
              <Grid item xs={2}>
                <SoftBox display="flex" alignItems="center" gap={0.5}>
                  <SoftInput
                    type="number"
                    value={tier.maxWeeks || ""}
                    onChange={(e) => handleTierChange(index, "maxWeeks", e.target.value)}
                    disabled={disabled}
                    size="small"
                    inputProps={{ min: 1 }}
                  />
                  <SoftTypography variant="caption">weeks</SoftTypography>
                </SoftBox>
              </Grid>
              <Grid item xs={3}>
                <SoftSelect
                  value={PRICE_TYPE_OPTIONS.find((o) => o.value === tier.priceType)}
                  onChange={(selected) => handleTierChange(index, "priceType", selected?.value)}
                  options={PRICE_TYPE_OPTIONS}
                  isDisabled={disabled}
                  menuPortalTarget={document.body}
                  styles={{ menuPortal: (base) => ({ ...base, zIndex: 9999 }) }}
                />
              </Grid>
              <Grid item xs={3}>
                <SoftBox display="flex" alignItems="center" gap={0.5}>
                  <SoftTypography variant="caption">
                    {getCurrencySymbol(formData.currency)}
                  </SoftTypography>
                  <SoftInput
                    type="number"
                    value={tier.amount || ""}
                    onChange={(e) => handleTierChange(index, "amount", e.target.value)}
                    disabled={disabled}
                    size="small"
                    inputProps={{ min: 0, step: "0.01" }}
                  />
                </SoftBox>
              </Grid>
              <Grid item xs={2}>
                <Tooltip title="Delete">
                  <SoftButton
                    variant="text"
                    color="error"
                    size="small"
                    onClick={() => handleRemoveTier(index)}
                    disabled={disabled}
                    sx={{ minWidth: "auto" }}
                  >
                    <Icon>delete</Icon>
                  </SoftButton>
                </Tooltip>
              </Grid>
            </Grid>
          ))}

          {validation.errors.length > 0 && (
            <SoftBox mt={2}>
              {validation.errors.map((err, i) => (
                <Alert key={i} severity="error" sx={{ mb: 1 }}>
                  {err.message}
                </Alert>
              ))}
            </SoftBox>
          )}

          {validation.warnings.length > 0 && (
            <SoftBox mt={2}>
              {validation.warnings.map((warn, i) => (
                <Alert key={i} severity="warning" sx={{ mb: 1 }}>
                  {warn.message}
                </Alert>
              ))}
            </SoftBox>
          )}
        </CardContent>
      </Card>
    </>
  );
}

CourseAssignmentStep.propTypes = {
  formData: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};

export default CourseAssignmentStep;
