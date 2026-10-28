import { useState, useEffect, useRef } from "react";
import { SchoolService } from "services/schoolService";
import { CampusService } from "services/campusService";
import { breadcrumbCache, isIdSegment } from "../utils/breadcrumbUtils";

const activeRequests = new Map();

export const useBreadcrumbData = (memoizedRoute) => {
  const [breadcrumbData, setBreadcrumbData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const requestRef = useRef(null);

  useEffect(() => {
    const loadBreadcrumbData = async () => {
      try {
        setIsLoading(true);
        const data = {};

        for (let i = 0; i < memoizedRoute.length; i++) {
          const segment = memoizedRoute[i];

          if (breadcrumbCache.has(segment)) {
            data[segment] = breadcrumbCache.get(segment);
            continue;
          }

          if (isIdSegment(segment)) {
            if (memoizedRoute.includes("schools")) {
              if (memoizedRoute.includes("campus")) {
                const schoolIdIndex = memoizedRoute.findIndex((s) => isIdSegment(s));
                const campusIdIndex = memoizedRoute.findIndex(
                  (s, i) => i > schoolIdIndex && isIdSegment(s)
                );

                if (schoolIdIndex !== -1) {
                  const schoolId = memoizedRoute[schoolIdIndex];
                  if (!breadcrumbCache.has(schoolId)) {
                    if (activeRequests.has(`school-${schoolId}`)) {
                      try {
                        const schoolName = await activeRequests.get(`school-${schoolId}`);
                        data[schoolId] = schoolName;
                        breadcrumbCache.set(schoolId, schoolName);
                      } catch (error) {
                        console.warn(`Failed to load school name for ID: ${schoolId}`, error);
                        data[schoolId] = null;
                        breadcrumbCache.set(schoolId, null);
                      }
                    } else {
                      try {
                        const schoolPromise = SchoolService.getSchoolById(schoolId).then((schoolData) => {
                          activeRequests.delete(`school-${schoolId}`);
                          return schoolData.name;
                        });
                        activeRequests.set(`school-${schoolId}`, schoolPromise);
                        const schoolName = await schoolPromise;
                        data[schoolId] = schoolName;
                        breadcrumbCache.set(schoolId, schoolName);
                      } catch (error) {
                        activeRequests.delete(`school-${schoolId}`);
                        console.warn(`Failed to load school name for ID: ${schoolId}`, error);
                        data[schoolId] = null;
                        breadcrumbCache.set(schoolId, null);
                      }
                    }
                  } else {
                    data[schoolId] = breadcrumbCache.get(schoolId);
                  }
                }

                if (campusIdIndex !== -1) {
                  const campusId = memoizedRoute[campusIdIndex];
                  if (!breadcrumbCache.has(campusId)) {
                    if (activeRequests.has(`campus-${campusId}`)) {
                      try {
                        const campusName = await activeRequests.get(`campus-${campusId}`);
                        data[campusId] = campusName;
                        breadcrumbCache.set(campusId, campusName);
                      } catch (error) {
                        console.warn(`Failed to load campus name for ID: ${campusId}`, error);
                        data[campusId] = null;
                        breadcrumbCache.set(campusId, null);
                      }
                    } else {
                      try {
                        const campusPromise = CampusService.getCampusById(campusId).then((campusData) => {
                          activeRequests.delete(`campus-${campusId}`);
                          return campusData.name;
                        });
                        activeRequests.set(`campus-${campusId}`, campusPromise);
                        const campusName = await campusPromise;
                        data[campusId] = campusName;
                        breadcrumbCache.set(campusId, campusName);
                      } catch (error) {
                        activeRequests.delete(`campus-${campusId}`);
                        console.warn(`Failed to load campus name for ID: ${campusId}`, error);
                        data[campusId] = null;
                        breadcrumbCache.set(campusId, null);
                      }
                    }
                  } else {
                    data[campusId] = breadcrumbCache.get(campusId);
                  }
                }
              } else {
                if (!breadcrumbCache.has(segment)) {
                  if (activeRequests.has(`school-${segment}`)) {
                    try {
                      const schoolName = await activeRequests.get(`school-${segment}`);
                      data[segment] = schoolName;
                      breadcrumbCache.set(segment, schoolName);
                    } catch (error) {
                      console.warn(`Failed to load school name for ID: ${segment}`, error);
                      data[segment] = null;
                      breadcrumbCache.set(segment, null);
                    }
                  } else {
                    try {
                      const schoolPromise = SchoolService.getSchoolById(segment).then((schoolData) => {
                        activeRequests.delete(`school-${segment}`);
                        return schoolData.name;
                      });
                      activeRequests.set(`school-${segment}`, schoolPromise);
                      const schoolName = await schoolPromise;
                      data[segment] = schoolName;
                      breadcrumbCache.set(segment, schoolName);
                    } catch (error) {
                      activeRequests.delete(`school-${segment}`);
                      console.warn(`Failed to load school name for ID: ${segment}`, error);
                      data[segment] = null;
                      breadcrumbCache.set(segment, null);
                    }
                  }
                } else {
                  data[segment] = breadcrumbCache.get(segment);
                }
              }
            }
          }
        }

        setBreadcrumbData(data);
      } catch (error) {
        console.error("Error loading breadcrumb data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeoutId = setTimeout(loadBreadcrumbData, 100);
    requestRef.current = timeoutId;

    return () => {
      if (requestRef.current) {
        clearTimeout(requestRef.current);
      }
    };
  }, [memoizedRoute]);

  return { breadcrumbData, isLoading };
};
