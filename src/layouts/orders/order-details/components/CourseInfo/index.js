import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Grid from "@mui/material/Grid";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";
import SoftDatePicker from "components/SoftDatePicker";
import { CampusService } from "services/campusService";
import { CityService } from "services/cityService";
import { formatCourseType } from "utils/courseTypeUtils";
import { formatDateOnly } from "utils/dateUtils";
import { formatMoney, getCurrencyPrefix } from "services/currencyService";

const currencyPrefix = (currency) => getCurrencyPrefix(currency) || "€";
const money = (amount, currency) => formatMoney(amount, currency || "EUR");

// Programmes start on Mondays (cohorts and weekly camps alike).
const disableNonMonday = (date) => date.getDay() !== 1;

const parseDateOnlyLocal = (value) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value || ""));
  return match ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])) : new Date(value);
};

function CourseInfo({
  course,
  isEditMode = false,
  courses = [],
  isLoadingCourses = false,
  onCourseChange,
}) {
  const navigate = useNavigate();
  const [courseExpanded, setCourseExpanded] = useState(true);
  const [campusName, setCampusName] = useState("Loading...");
  const [locationInfo, setLocationInfo] = useState({
    cityName: "Loading...",
    countryName: "Loading...",
  });
  const [campusData, setCampusData] = useState(null);

  useEffect(() => {
    const fetchCampusInfo = async () => {
      if (course?.campusId) {
        try {
          const campus = await CampusService.getCampusById(course.campusId);
          setCampusName(campus?.name || "Unknown location");
          setCampusData(campus);

          if (campus?.cityId) {
            const cityData = await CityService.getCityById(campus.cityId);
            setLocationInfo({
              cityName: cityData?.name || "Unknown City",
              countryName: cityData?.country?.name || "Unknown Country",
            });
          }
        } catch (error) {
          console.error("Error fetching campus info:", error);
          setCampusName("Unknown location");
          setLocationInfo({
            cityName: "Unknown City",
            countryName: "Unknown Country",
          });
        }
      }
    };

    fetchCampusInfo();
  }, [course?.campusId]);

  const courseStartDatePlaceholder = "Select a Monday";

  const handleCourseClick = (e) => {
    const courseLink = e.target.closest("[data-link='course']");

    if (courseLink) {
      e.preventDefault();
      e.stopPropagation();

      if (course?.courseId && campusData?.schoolId && campusData?.id) {
        const url = `/schools/view/${campusData.schoolId}/campus/${campusData.id}/add-course/${course.courseId}`;
        navigate(url);
      } else {
        console.warn("Missing required data for navigation:", {
          courseId: course?.courseId,
          schoolId: campusData?.schoolId,
          campusId: campusData?.id,
        });
      }
    } else {
      setCourseExpanded(!courseExpanded);
    }
  };

  return (
    <Card sx={{ display: "flex", flexDirection: "column" }}>
      <SoftBox p={3} sx={{ display: "flex", flexDirection: "column" }}>
        <SoftBox sx={{ display: "flex", flexDirection: "column" }}>
          <SoftBox
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            mb={2}
            sx={{ cursor: "pointer" }}
            onClick={() => setCourseExpanded(!courseExpanded)}
          >
            <SoftBox display="flex" flexDirection="column">
              <SoftTypography variant="h6" fontWeight="medium">
                Programme
              </SoftTypography>
              <SoftTypography variant="h6" fontWeight="medium">
                Info
              </SoftTypography>
            </SoftBox>
            <SoftBox display="flex" alignItems="center" gap={1.5}>
              <SoftBox
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                sx={{
                  padding: "12px",
                  backgroundColor: "#F7F6FB",
                  borderRadius: "8px",
                  border: "1px solid #ECEAF4",
                  minWidth: "280px",
                }}
              >
                <SoftBox display="flex" flexDirection="column" gap={0.5} flex={1}>
                  {(course?.totalDiscount !== null &&
                    course?.totalDiscount !== undefined &&
                    course.totalDiscount > 0) ||
                  (course?.discountTitle !== null && course?.discountTitle !== undefined) ||
                  (course?.subtotal !== null &&
                    course?.subtotal !== undefined &&
                    course.subtotal !== course?.cost) ? (
                    <>
                      <SoftBox display="flex" alignItems="center" gap={1}>
                        <Icon sx={{ color: "info.main", fontSize: "20px" }}>local_offer</Icon>
                        <SoftTypography variant="body2" color="text" fontWeight="medium">
                          {course?.discountTitle || "Discount"}
                        </SoftTypography>
                      </SoftBox>
                      {course?.subtotal && course.subtotal !== course?.cost && (
                        <SoftBox display="flex" alignItems="center" gap={1} sx={{ pl: 3.5 }}>
                          <SoftTypography
                            variant="caption"
                            color="text.secondary"
                            sx={{ textDecoration: "line-through" }}
                          >
                            {money(course.subtotal, course?.currency)}
                          </SoftTypography>
                          {course?.totalDiscount > 0 && (
                            <SoftTypography variant="caption" color="error" fontWeight="medium">
                              -{money(course.totalDiscount, course?.currency)}
                            </SoftTypography>
                          )}
                        </SoftBox>
                      )}
                    </>
                  ) : null}
                </SoftBox>
                <SoftTypography variant="h6" fontWeight="medium" color="success" sx={{ ml: 2 }}>
                  {course?.cost != null
                    ? money(course.cost, course?.currency)
                    : `${currencyPrefix(course?.currency)}xxxx`}
                </SoftTypography>
              </SoftBox>
              <Icon
                sx={{
                  color: "text.secondary",
                  fontSize: "20px",
                  transform: courseExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                }}
              >
                expand_more
              </Icon>
            </SoftBox>
          </SoftBox>

          {courseExpanded && (
            <SoftBox display="flex" flexDirection="column" gap={2.5} mb={3}>
              <SoftBox>
                <SoftTypography
                  variant="body2"
                  color="dark"
                  fontWeight="bold"
                  sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
                >
                  Programme:
                </SoftTypography>
                {isEditMode ? (
                  <SoftSelect
                    value={courses.find((c) => c.value === course?.courseId) || null}
                    onChange={(option) =>
                      onCourseChange && onCourseChange("courseId", option?.value || "")
                    }
                    options={courses}
                    placeholder={isLoadingCourses ? "Loading courses..." : "Select course"}
                    isClearable
                    isLoading={isLoadingCourses}
                  />
                ) : (
                  <SoftInput
                    type="text"
                    value={course?.name || "—"}
                    onClick={handleCourseClick}
                    readOnly
                    sx={{
                      cursor: "pointer",
                      "& .MuiInputBase-input": {
                        cursor: "pointer",
                      },
                    }}
                  />
                )}
              </SoftBox>

              <SoftBox>
                <SoftTypography
                  variant="body2"
                  color="dark"
                  fontWeight="bold"
                  sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
                >
                  Location:
                </SoftTypography>
                <SoftTypography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.875rem", fontWeight: "400" }}
                >
                  {campusName}
                </SoftTypography>
              </SoftBox>

              <SoftBox>
                <SoftTypography
                  variant="body2"
                  color="dark"
                  fontWeight="bold"
                  sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
                >
                  Country/City:
                </SoftTypography>
                <SoftTypography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.875rem", fontWeight: "400" }}
                >
                  {`${locationInfo.cityName}, ${locationInfo.countryName}`}
                </SoftTypography>
              </SoftBox>

              <SoftBox>
                <SoftTypography
                  variant="body2"
                  color="dark"
                  fontWeight="bold"
                  sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
                >
                  Type:
                </SoftTypography>
                <SoftTypography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.875rem", fontWeight: "400" }}
                >
                  {formatCourseType(course?.courseType) || course?.courseType || "—"}
                </SoftTypography>
              </SoftBox>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <SoftBox>
                    <SoftTypography
                      variant="body2"
                      color="dark"
                      fontWeight="bold"
                      sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
                    >
                      Duration:
                    </SoftTypography>
                    {isEditMode ? (
                      <SoftInput
                        type="number"
                        value={course?.duration?.replace(" weeks", "") || ""}
                        onChange={(e) =>
                          onCourseChange && onCourseChange("duration", `${e.target.value} weeks`)
                        }
                        placeholder="Enter duration in weeks"
                        disabled={!isEditMode}
                      />
                    ) : (
                      <SoftTypography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.875rem", fontWeight: "400" }}
                      >
                        {course?.duration || "—"}
                      </SoftTypography>
                    )}
                  </SoftBox>
                </Grid>

                <Grid item xs={12} md={6}>
                  <SoftBox>
                    <SoftTypography
                      variant="body2"
                      color="dark"
                      fontWeight="bold"
                      sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
                    >
                      Start Date:
                    </SoftTypography>
                    {isEditMode ? (
                      <SoftDatePicker
                        key={`course-start-${course?.startDate || course?.selectedStartDate || "none"}`}
                        value={(() => {
                          const raw = course?.startDate || course?.selectedStartDate;
                          const d = raw ? parseDateOnlyLocal(raw) : null;
                          return d && !Number.isNaN(d.getTime()) ? d : null;
                        })()}
                        onChange={(date) => {
                          if (date && date[0]) {
                            const d = date[0];
                            const year = d.getFullYear();
                            const month = String(d.getMonth() + 1).padStart(2, "0");
                            const day = String(d.getDate()).padStart(2, "0");
                            const dateValue = `${year}-${month}-${day}`;
                            onCourseChange && onCourseChange("startDate", dateValue);
                          } else {
                            onCourseChange && onCourseChange("startDate", "");
                          }
                        }}
                        options={{
                          dateFormat: "Y-m-d",
                          altInput: true,
                          altFormat: "F j, Y",
                          locale: "en",
                          minDate: "today",
                          disable: [disableNonMonday],
                        }}
                        input={{ placeholder: courseStartDatePlaceholder }}
                        disabled={!isEditMode}
                      />
                    ) : (
                      <SoftTypography
                        variant="body2"
                        color="text.secondary"
                        sx={{ fontSize: "0.875rem", fontWeight: "400" }}
                      >
                        {(course?.startDate || course?.selectedStartDate)
                          ? formatDateOnly(course.startDate || course.selectedStartDate)
                          : "—"}
                      </SoftTypography>
                    )}
                  </SoftBox>
                </Grid>
              </Grid>

              {course?.endDate && (
                <SoftBox>
                  <SoftTypography
                    variant="body2"
                    color="dark"
                    fontWeight="bold"
                    sx={{ fontSize: "0.875rem", marginBottom: "4px" }}
                  >
                    End Date:
                  </SoftTypography>
                  <SoftTypography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.875rem", fontWeight: "400" }}
                  >
                    {formatDateOnly(course.endDate)}
                  </SoftTypography>
                </SoftBox>
              )}
            </SoftBox>
          )}
        </SoftBox>

      </SoftBox>
    </Card>
  );
}

CourseInfo.propTypes = {
  course: PropTypes.object.isRequired,
  isEditMode: PropTypes.bool,
  courses: PropTypes.array,
  isLoadingCourses: PropTypes.bool,
  onCourseChange: PropTypes.func,
};

export default CourseInfo;
