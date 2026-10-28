import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Card from "@mui/material/Card";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import CircularProgress from "@mui/material/CircularProgress";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
import SoftSelect from "components/SoftSelect";

import DashboardLayout from "examples/LayoutContainers/DashboardLayout";
import DashboardNavbar from "examples/Navbars/DashboardNavbar";

import { ServiceService } from "services/serviceService";
import { formatServiceType } from "utils/serviceTypeUtils";
import { CourseService } from "services/courseService";
import { getCurrencySymbol } from "services/currencyService";

const PRICE_TYPE_OPTIONS = [
  { value: "per_week", label: "Per week" },
  { value: "fixed", label: "Fixed total" },
];

function validatePricingRules(rules) {
  const errors = [];
  const warnings = [];

  if (!rules || rules.length === 0) {
    return { errors, warnings };
  }

  const validRules = rules.filter(
    (r) => r.fromWeeks && r.toWeeks && Number(r.fromWeeks) > 0 && Number(r.toWeeks) > 0
  );

  rules.forEach((rule, index) => {
    const from = Number(rule.fromWeeks);
    const to = Number(rule.toWeeks);

    if (from && to && from > to) {
      errors.push({
        ruleIndex: index,
        message: `Rule ${index + 1}: "From" week cannot be greater than "To" week.`,
      });
    }

    if (!rule.fromWeeks || !rule.toWeeks || !rule.amount) {
      errors.push({
        ruleIndex: index,
        message: `Rule ${index + 1}: All fields are required.`,
      });
    }
  });

  for (let i = 0; i < validRules.length; i++) {
    for (let j = i + 1; j < validRules.length; j++) {
      const rule1 = validRules[i];
      const rule2 = validRules[j];

      const from1 = Number(rule1.fromWeeks);
      const to1 = Number(rule1.toWeeks);
      const from2 = Number(rule2.fromWeeks);
      const to2 = Number(rule2.toWeeks);

      if (from1 <= to2 && from2 <= to1) {
        const overlapStart = Math.max(from1, from2);
        const overlapEnd = Math.min(to1, to2);

        if (overlapStart === overlapEnd) {
          errors.push({
            ruleIndex: i,
            ruleIndex2: j,
            message: `Week ${overlapStart} is included in two rules.`,
          });
        } else {
          errors.push({
            ruleIndex: i,
            ruleIndex2: j,
            message: `Weeks ${overlapStart}-${overlapEnd} are included in two rules.`,
          });
        }
      }
    }
  }

  if (validRules.length > 0 && errors.length === 0) {
    const sortedRules = [...validRules].sort((a, b) => Number(a.fromWeeks) - Number(b.fromWeeks));

    for (let i = 0; i < sortedRules.length - 1; i++) {
      const currentTo = Number(sortedRules[i].toWeeks);
      const nextFrom = Number(sortedRules[i + 1].fromWeeks);

      if (nextFrom > currentTo + 1) {
        const gapStart = currentTo + 1;
        const gapEnd = nextFrom - 1;

        if (gapStart === gapEnd) {
          warnings.push({
            message: `Week ${gapStart} has no price rule; that duration will not be available.`,
          });
        } else {
          warnings.push({
            message: `Weeks ${gapStart}-${gapEnd} have no price rule; those durations will not be available.`,
          });
        }
      }
    }
  }

  return { errors, warnings };
}

function tierStableServerId(tier) {
  if (tier.durationPriceId != null && String(tier.durationPriceId).trim() !== "") {
    return String(tier.durationPriceId).trim();
  }
  const raw = tier.id;
  if (raw == null || String(raw).trim() === "") return "";
  const s = String(raw).trim();
  if (/^\d+$/.test(s) && s.length >= 10) return "";
  return s;
}

function canonicalTierForDirty(tier) {
  const min = Number.parseInt(tier.fromWeeks, 10);
  const max = Number.parseInt(tier.toWeeks, 10);
  const price = Number.parseFloat(tier.amount);
  const mode = tier.priceType === "fixed" ? "FIXED" : "PER_WEEK";
  return {
    sid: tierStableServerId(tier),
    min: Number.isFinite(min) ? min : 0,
    max: Number.isFinite(max) ? max : 0,
    price: Number.isFinite(price) ? Math.round(price * 100) / 100 : 0,
    mode,
  };
}

function pricingTiersDirtySignature(tiers) {
  return JSON.stringify((tiers || []).map(canonicalTierForDirty));
}

function coursePricingDirty(current, original) {
  if (!original) return true;
  return (
    pricingTiersDirtySignature(current.pricingTiers) !==
    pricingTiersDirtySignature(original.pricingTiers)
  );
}

function originalRowLookupKey(row) {
  const k = row.courseServiceId ?? row.id;
  return k != null && String(k).trim() !== "" ? String(k).trim() : null;
}

function buildOriginalByServiceId(originalRows) {
  const map = new Map();
  originalRows.forEach((o, index) => {
    const key = originalRowLookupKey(o);
    if (key) map.set(key, o);
    map.set(`__index:${index}`, o);
  });
  return map;
}

function getOriginalForRow(origMap, row, index) {
  const key = originalRowLookupKey(row);
  if (key && origMap.has(key)) return origMap.get(key);
  return origMap.get(`__index:${index}`);
}

function ServicePricing() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [service, setService] = useState(null);
  const [enrichedData, setEnrichedData] = useState([]);
  const [originalData, setOriginalData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const hasUnsavedChanges = useMemo(() => {
    if (!originalData.length && !enrichedData.length) return false;
    const origMap = buildOriginalByServiceId(originalData);
    return enrichedData.some((row, index) =>
      coursePricingDirty(row, getOriginalForRow(origMap, row, index))
    );
  }, [enrichedData, originalData]);

  const loadServiceData = async () => {
    setIsLoading(true);
    try {
      const serviceData = await ServiceService.getServiceWithCourseServices(id);
      setService(serviceData);

      if (serviceData.courseServices?.length > 0) {
        await enrichCourseServices(serviceData.courseServices);
      } else {
        setEnrichedData([]);
      }
    } catch (err) {
      setSnackbar({ open: true, message: "Failed to load the extra", severity: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServiceData();
  }, [id]);

  const enrichCourseServices = async (courseServicesData) => {
    try {
      console.log("enrichCourseServices input:", JSON.stringify(courseServicesData, null, 2));

      const enrichedList = await Promise.all(
        courseServicesData.map(async (cs) => {
          console.log("Processing courseService:", cs);
          try {
            const courseId = cs.courseId || cs.course?.id;
            console.log("courseId:", courseId);
            const course = courseId ? await CourseService.getCourseById(courseId) : null;
            const campusName = course?.campus?.name || "Unknown location";
            const schoolName =
              course?.school?.name || course?.campus?.school?.name || "Unknown provider";
            const countryName =
              course?.campus?.country?.name || course?.school?.country?.name || "Unknown country";

            console.log("cs.durationPrices:", cs.durationPrices);

            const pricingTiers =
              cs.durationPrices?.length > 0
                ? cs.durationPrices.map((dp) => {
                    console.log("Mapping durationPrice:", dp);
                    const dpId = dp.id ?? dp.durationPriceId;
                    return {
                      id: dpId,
                      durationPriceId: dpId,
                      fromWeeks: dp.minWeeks ?? 1,
                      toWeeks: dp.maxWeeks ?? 4,
                      priceType:
                        String(dp.mode || "").toUpperCase() === "PER_WEEK" ? "per_week" : "fixed",
                      amount: dp.price ?? 0,
                    };
                  })
                : [
                    {
                      id: Date.now(),
                      fromWeeks: 1,
                      toWeeks: 4,
                      priceType: "per_week",
                      amount: cs.price || 0,
                    },
                  ];

            console.log("pricingTiers result:", pricingTiers);

            return {
              courseServiceId: cs.id ?? cs.courseServiceId,
              courseId: cs.courseId ?? cs.course?.id,
              isMandatory: cs.isMandatory || false,
              courseName: course?.name || `Programme ${cs.courseId}`,
              campusName,
              schoolName,
              countryName,
              pricingTiers,
            };
          } catch (err) {
            return {
              courseServiceId: cs.id ?? cs.courseServiceId,
              courseId: cs.courseId ?? cs.course?.id,
              isMandatory: cs.isMandatory || false,
              courseName: `Programme ${cs.courseId}`,
              campusName: "Unknown location",
              schoolName: "Unknown provider",
              countryName: "Unknown country",
              pricingTiers: [
                { id: Date.now(), fromWeeks: 1, toWeeks: 4, priceType: "per_week", amount: 0 },
              ],
            };
          }
        })
      );
      setEnrichedData(enrichedList);
      setOriginalData(JSON.parse(JSON.stringify(enrichedList)));
    } catch (err) {
      setEnrichedData([]);
      setOriginalData([]);
    }
  };

  const handleTierChange = (courseIndex, tierIndex, field, value) => {
    setEnrichedData((prev) => {
      const newData = [...prev];
      newData[courseIndex] = {
        ...newData[courseIndex],
        pricingTiers: newData[courseIndex].pricingTiers.map((tier, i) =>
          i === tierIndex ? { ...tier, [field]: value } : tier
        ),
      };
      return newData;
    });
  };

  const handleAddTier = (courseIndex) => {
    setEnrichedData((prev) => {
      const newData = [...prev];
      newData[courseIndex] = {
        ...newData[courseIndex],
        pricingTiers: [
          ...newData[courseIndex].pricingTiers,
          { id: Date.now(), fromWeeks: "", toWeeks: "", priceType: "per_week", amount: "" },
        ],
      };
      return newData;
    });
  };

  const handleRemoveTier = (courseIndex, tierIndex) => {
    setEnrichedData((prev) => {
      const newData = [...prev];
      newData[courseIndex] = {
        ...newData[courseIndex],
        pricingTiers: newData[courseIndex].pricingTiers.filter((_, i) => i !== tierIndex),
      };
      return newData;
    });
  };

  const handleSaveAll = async () => {
    if (!hasUnsavedChanges) return;
    setIsSaving(true);
    try {
      const toRecreate = [];
      const toUpdate = [];
      const origMap = buildOriginalByServiceId(originalData);

      enrichedData.forEach((course, index) => {
        const original = getOriginalForRow(origMap, course, index);
        if (!original) return;
        if (!coursePricingDirty(course, original)) return;

        const originalIds = original.pricingTiers.map((t) => tierStableServerId(t)).filter(Boolean);
        const currentIds = course.pricingTiers.map((t) => tierStableServerId(t)).filter(Boolean);

        const hasDeleted = originalIds.some((origId) => !currentIds.includes(origId));
        const hasNew = course.pricingTiers.some((t) => !tierStableServerId(t));

        if (hasDeleted || hasNew) {
          toRecreate.push(course);
        } else {
          toUpdate.push(course);
        }
      });

      if (toRecreate.length === 0 && toUpdate.length === 0) {
        setSnackbar({ open: true, message: "No changes to save.", severity: "info" });
        return;
      }

      for (const course of toRecreate) {
        await ServiceService.deleteCourseService(course.courseId, course.courseServiceId);
        await ServiceService.createCourseServicesBulk([
          {
            serviceId: id,
            courseId: course.courseId,
            isMandatory: course.isMandatory || false,
            durationPrices: course.pricingTiers.map((tier) => ({
              minWeeks: parseInt(tier.fromWeeks) || 1,
              maxWeeks: parseInt(tier.toWeeks) || 4,
              price: parseFloat(tier.amount) || 0,
              mode: tier.priceType === "per_week" ? "PER_WEEK" : "FIXED",
            })),
          },
        ]);
      }

      if (toUpdate.length > 0) {
        const items = toUpdate.map((course) => ({
          courseId: course.courseId,
          courseServiceId: course.courseServiceId,
          isMandatory: course.isMandatory || false,
          durationPrices: course.pricingTiers.map((tier) => ({
            id: String(tier.durationPriceId),
            minWeeks: parseInt(tier.fromWeeks) || 1,
            maxWeeks: parseInt(tier.toWeeks) || 4,
            price: parseFloat(tier.amount) || 0,
            mode: tier.priceType === "per_week" ? "PER_WEEK" : "FIXED",
          })),
        }));
        await ServiceService.updateCourseServicesBulk(items);
      }

      setSnackbar({ open: true, message: "All changes saved successfully!", severity: "success" });
      loadServiceData();
    } catch (err) {
      setSnackbar({
        open: true,
        message: `Failed to save changes: ${err.message}`,
        severity: "error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const closeSnackbar = () => setSnackbar((prev) => ({ ...prev, open: false }));

  const validationResults = useMemo(() => {
    return enrichedData.map((course) => validatePricingRules(course.pricingTiers));
  }, [enrichedData]);

  const hasValidationErrors = useMemo(() => {
    return validationResults.some((v) => v.errors.length > 0);
  }, [validationResults]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <SoftBox display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress size={60} />
        </SoftBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />

      <SoftBox my={3}>
        <Card sx={{ mb: 3 }}>
          <SoftBox p={3}>
            <SoftBox display="flex" justifyContent="space-between" alignItems="center">
              <SoftBox display="flex" alignItems="center" gap={2}>
                <SoftButton
                  variant="outlined"
                  color="dark"
                  size="small"
                  onClick={() => navigate("/services/services-list")}
                  sx={{ minWidth: "auto" }}
                >
                  <Icon>arrow_back</Icon>
                </SoftButton>
                <SoftBox>
                  <SoftTypography variant="h5" fontWeight="medium">
                    {service?.name || "Extra"}
                  </SoftTypography>
                  <SoftBox display="flex" alignItems="center" gap={1} mt={0.5}>
                    <Chip label={formatServiceType(service?.type) || "N/A"} size="small" variant="outlined" />
                    <SoftTypography variant="caption" color="text">
                      {service?.currency || "EUR"}
                    </SoftTypography>
                    <Chip
                      label={service?.isActive ? "Active" : "Inactive"}
                      color={service?.isActive ? "success" : "default"}
                      size="small"
                    />
                  </SoftBox>
                </SoftBox>
              </SoftBox>
              <SoftBox display="flex" alignItems="center" gap={1}>
                <SoftButton
                  variant="gradient"
                  color="info"
                  onClick={handleSaveAll}
                  disabled={!hasUnsavedChanges || isSaving || hasValidationErrors}
                >
                  {isSaving ? "Saving..." : "Save All Changes"}
                </SoftButton>
              </SoftBox>
            </SoftBox>
          </SoftBox>
        </Card>

        {enrichedData.length === 0 ? (
          <Card>
            <SoftBox p={4} textAlign="center">
              <SoftTypography variant="h6" color="text">
                No programme pricing rules yet
              </SoftTypography>
              <SoftTypography variant="body2" color="text">
                Assign programmes to this extra to configure pricing.
              </SoftTypography>
            </SoftBox>
          </Card>
        ) : (
          enrichedData.map((course, courseIndex) => (
            <Card key={course.courseServiceId || courseIndex} sx={{ mb: 2 }}>
              <SoftBox p={3}>
                <SoftBox mb={2}>
                  <SoftBox display="flex" alignItems="center" gap={1} flexWrap="wrap">
                    <SoftTypography variant="h6" fontWeight="medium">
                      {course.courseName}
                    </SoftTypography>
                    <Chip
                      label={course.isMandatory ? "Mandatory" : "Optional"}
                      color={course.isMandatory ? "success" : "info"}
                      size="small"
                      sx={{ fontWeight: 500 }}
                    />
                  </SoftBox>
                  <SoftTypography variant="caption" color="text">
                    {course.countryName} • {course.schoolName} • {course.campusName}
                  </SoftTypography>
                </SoftBox>

                <Divider sx={{ mb: 2 }} />

                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    <Grid item xs={2.5}>
                      <SoftTypography variant="caption" fontWeight="bold">
                        From (weeks) *
                      </SoftTypography>
                    </Grid>
                    <Grid item xs={2.5}>
                      <SoftTypography variant="caption" fontWeight="bold">
                        To (weeks) *
                      </SoftTypography>
                    </Grid>
                    <Grid item xs={3}>
                      <SoftTypography variant="caption" fontWeight="bold">
                        Price Type *
                      </SoftTypography>
                    </Grid>
                    <Grid item xs={3}>
                      <SoftTypography variant="caption" fontWeight="bold">
                        Amount ({getCurrencySymbol(service?.currency)}) *
                      </SoftTypography>
                    </Grid>
                    <Grid item xs={1}>
                      <SoftTypography variant="caption" fontWeight="bold">
                        Actions
                      </SoftTypography>
                    </Grid>
                  </Grid>

                  {course.pricingTiers.map((tier, tierIndex) => (
                    <Grid
                      container
                      spacing={2}
                      key={tier.id || tierIndex}
                      sx={{ mb: 2, alignItems: "center" }}
                    >
                      <Grid item xs={2.5}>
                        <SoftInput
                          type="number"
                          placeholder="1"
                          value={tier.fromWeeks || ""}
                          onChange={(e) =>
                            handleTierChange(courseIndex, tierIndex, "fromWeeks", e.target.value)
                          }
                          inputProps={{ min: 1 }}
                        />
                      </Grid>
                      <Grid item xs={2.5}>
                        <SoftInput
                          type="number"
                          placeholder="4"
                          value={tier.toWeeks || ""}
                          onChange={(e) =>
                            handleTierChange(courseIndex, tierIndex, "toWeeks", e.target.value)
                          }
                          inputProps={{ min: 1 }}
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <SoftSelect
                          value={
                            PRICE_TYPE_OPTIONS.find((opt) => opt.value === tier.priceType) ||
                            PRICE_TYPE_OPTIONS[0]
                          }
                          onChange={(selected) =>
                            handleTierChange(
                              courseIndex,
                              tierIndex,
                              "priceType",
                              selected?.value || "per_week"
                            )
                          }
                          options={PRICE_TYPE_OPTIONS}
                          placeholder="Select type"
                        />
                      </Grid>
                      <Grid item xs={3}>
                        <SoftInput
                          type="number"
                          placeholder="100"
                          value={tier.amount || ""}
                          onChange={(e) =>
                            handleTierChange(courseIndex, tierIndex, "amount", e.target.value)
                          }
                          inputProps={{ min: 0, step: "0.01" }}
                        />
                      </Grid>
                      <Grid item xs={1}>
                        <Tooltip title="Delete rule">
                          <SoftButton
                            variant="text"
                            color="error"
                            size="small"
                            onClick={() => handleRemoveTier(courseIndex, tierIndex)}
                            sx={{ minWidth: "auto", p: 1 }}
                          >
                            <Icon>delete</Icon>
                          </SoftButton>
                        </Tooltip>
                      </Grid>
                    </Grid>
                  ))}

                  <SoftBox display="flex" justifyContent="flex-start" mt={2}>
                    <SoftButton
                      variant="outlined"
                      color="info"
                      size="small"
                      onClick={() => handleAddTier(courseIndex)}
                      startIcon={<Icon>add</Icon>}
                    >
                      Add pricing rule
                    </SoftButton>
                  </SoftBox>

                  {validationResults[courseIndex]?.errors?.length > 0 && (
                    <SoftBox mt={2}>
                      {validationResults[courseIndex].errors.map((err, i) => (
                        <Alert key={i} severity="error" sx={{ mb: 1 }}>
                          {err.message}
                        </Alert>
                      ))}
                    </SoftBox>
                  )}

                  {validationResults[courseIndex]?.warnings?.length > 0 && (
                    <SoftBox mt={2}>
                      {validationResults[courseIndex].warnings.map((warn, i) => (
                        <Alert key={i} severity="warning" sx={{ mb: 1 }}>
                          {warn.message}
                        </Alert>
                      ))}
                    </SoftBox>
                  )}
                </Paper>
              </SoftBox>
            </Card>
          ))
        )}
      </SoftBox>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert onClose={closeSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </DashboardLayout>
  );
}

export default ServicePricing;
