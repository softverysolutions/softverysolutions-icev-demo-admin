import { useMemo, useEffect, useState } from "react";
import PropTypes from "prop-types";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";

import { ServiceService } from "services/serviceService";
import { CourseService } from "services/courseService";
import { formatServiceType } from "utils/serviceTypeUtils";
import ServicePickerModal from "./course-services/ServicePickerModal";
import ServicePricingTiers from "./course-services/ServicePricingTiers";

function CourseServicesStep({
  formData,
  onInputChange,
  disabled = false,
  campusId = null,
  isEditMode = false,
}) {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerMode, setPickerMode] = useState("mandatory");

  const currentServices = formData.services || [];

  const selectedServiceIds = useMemo(
    () => new Set(currentServices.map((service) => service.service?.id || service.serviceId)),
    [currentServices]
  );

  const availableServices = useMemo(
    () => services.filter((service) => !selectedServiceIds.has(service.id)),
    [services, selectedServiceIds]
  );

  const availableMandatoryServices = useMemo(
    () => availableServices.filter((service) => service.isMandatoryForCampus),
    [availableServices]
  );

  const availableOptionalServices = useMemo(
    () => availableServices.filter((service) => !service.isMandatoryForCampus),
    [availableServices]
  );

  useEffect(() => {
    const loadServices = async () => {
      try {
        setIsLoading(true);
        let servicesData;

        if (campusId) {
          const searchParams = {
            search: "",
            page: 1,
            limit: 100,
            sortBy: "name",
            sortDirection: "asc",
            filters: {
              campusIds: [campusId],
            },
          };
          const response = await ServiceService.searchServices(searchParams);
          servicesData = Array.isArray(response) ? response : (response.data || []);
        } else {
          servicesData = await ServiceService.getAllServices();
          servicesData = Array.isArray(servicesData) ? servicesData : [];
        }

        if (campusId && servicesData.length > 0) {
          const campusCourses = await CourseService.getCoursesByCampusId(campusId);
          const mandatoryServiceIds = new Set();
          const pricingTierByService = new Map();

          campusCourses.forEach((course) => {
            (course.services || []).forEach((cs) => {
              const serviceId = cs.service?.id || cs.serviceId;
              if (cs.isMandatory && serviceId) {
                mandatoryServiceIds.add(serviceId);
              }
              if (!pricingTierByService.has(serviceId)) {
                if (cs.durationPrices && cs.durationPrices.length > 0) {
                  const tiers = cs.durationPrices.map((tier, index) => ({
                    id: tier.id || `${Date.now()}-${index}`,
                    minWeeks: tier.minWeeks || 1,
                    maxWeeks: tier.maxWeeks || 4,
                    priceType: tier.mode === "FIXED" ? "fixed" : "per_week",
                    amount: tier.price ?? "",
                  }));
                  pricingTierByService.set(serviceId, tiers);
                } else {
                  pricingTierByService.set(serviceId, [
                    {
                      id: Date.now(),
                      minWeeks: 1,
                      maxWeeks: 4,
                      priceType: "per_week",
                      amount: cs.price ?? "",
                    },
                  ]);
                }
              }
            });
          });

          servicesData = servicesData.map((service) => ({
            ...service,
            isMandatoryForCampus: mandatoryServiceIds.has(service.id),
            defaultPricingTiers: pricingTierByService.get(service.id),
          }));
        }
        setServices(servicesData);
      } catch (error) {
        console.error("Error loading services:", error);
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadServices();
  }, [campusId]);

  const openPicker = (mode) => {
    setPickerMode(mode);
    setPickerOpen(true);
  };

  const handleAddService = (service) => {
    const newService = {
      uiId: `temp-${Date.now()}`,
      service,
      isMandatory: pickerMode === "mandatory",
      pricingTiers:
        !isEditMode && service.defaultPricingTiers && service.defaultPricingTiers.length > 0
          ? service.defaultPricingTiers
          : [{ id: Date.now(), minWeeks: 1, maxWeeks: 4, priceType: "per_week", amount: "" }],
    };

    onInputChange("services", [...currentServices, newService]);
    setPickerOpen(false);
  };

  const handleRemoveService = (serviceId) => {
    onInputChange(
      "services",
      currentServices.filter((service) => (service.service?.id || service.serviceId) !== serviceId)
    );
  };

  const updateServicePricing = (serviceId, newTiers) => {
    const updated = currentServices.map((service) =>
      (service.service?.id || service.serviceId) === serviceId
        ? { ...service, pricingTiers: newTiers }
        : service
    );
    onInputChange("services", updated);
  };

  const renderServiceList = (list, isMandatory) => (
    <SoftBox display="flex" flexDirection="column" gap={2}>
      {list.length === 0 && (
        <SoftTypography variant="body2" color="text.secondary">
          {isLoading ? "Loading extras..." : "No extras added"}
        </SoftTypography>
      )}
      {list.map((service) => {
        const serviceId = service.service?.id || service.serviceId;
        const currency = service.service?.currency || formData.currency || "EUR";
        const pricingTiers = service.pricingTiers || [
          { id: Date.now(), minWeeks: 1, maxWeeks: 4, priceType: "per_week", amount: "" },
        ];

        const rowKey = service.uiId || service.id || serviceId;

        return (
          <Card key={rowKey} sx={{ borderRadius: "12px" }}>
            <CardContent>
              <SoftBox display="flex" justifyContent="space-between" alignItems="flex-start">
                <SoftBox>
                  <SoftTypography variant="subtitle1" fontWeight="medium">
                    {service.service?.name || "Service"}
                  </SoftTypography>
                  <SoftBox display="flex" alignItems="center" gap={1} mt={0.5}>
                    <SoftBox
                      px={1}
                      py={0.25}
                      sx={{
                        borderRadius: "12px",
                        backgroundColor: isMandatory ? "#E6FBF4" : "#F1EDFF",
                      }}
                    >
                      <SoftTypography variant="caption" color={isMandatory ? "success" : "info"}>
                        {isMandatory ? "Mandatory" : "Optional"}
                      </SoftTypography>
                    </SoftBox>
                    <SoftBox
                      px={1}
                      py={0.25}
                      sx={{
                        borderRadius: "12px",
                        backgroundColor: service.service?.isActive !== false ? "#F1EDFF" : "#e0e0e0",
                      }}
                    >
                      <SoftTypography variant="caption" color={service.service?.isActive !== false ? "info" : "text"}>
                        {formatServiceType(service.service?.type)}
                      </SoftTypography>
                    </SoftBox>
                  </SoftBox>
                </SoftBox>
                <SoftButton
                  variant="text"
                  color="error"
                  size="small"
                  disabled={disabled}
                  onClick={() => handleRemoveService(serviceId)}
                >
                  <Icon>delete</Icon>
                </SoftButton>
              </SoftBox>

              <ServicePricingTiers
                pricingTiers={pricingTiers}
                onChange={(tiers) => updateServicePricing(serviceId, tiers)}
                currency={currency}
                disabled={disabled}
                serviceName={service.service?.name || serviceId}
              />
            </CardContent>
          </Card>
        );
      })}
    </SoftBox>
  );

  const mandatoryServices = currentServices.filter((service) => service.isMandatory);
  const optionalServices = currentServices.filter((service) => !service.isMandatory);

  return (
    <SoftBox>
      <SoftTypography variant="h5" fontWeight="medium" mb={1}>
        Extras
      </SoftTypography>
      <SoftTypography variant="body2" color="text.secondary" mb={3}>
        Attach included (mandatory) and optional extras to this programme and set their price per duration.
      </SoftTypography>

      <SoftBox mb={3}>
        <SoftBox display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <SoftTypography variant="h6" fontWeight="medium">
            Included extras (mandatory)
          </SoftTypography>
          <SoftButton
            variant="outlined"
            color="info"
            size="small"
            onClick={() => openPicker("mandatory")}
            disabled={disabled || isLoading || availableMandatoryServices.length === 0}
          >
            + Add Mandatory
          </SoftButton>
        </SoftBox>
        {renderServiceList(mandatoryServices, true)}
      </SoftBox>

      <SoftBox>
        <SoftBox display="flex" alignItems="center" justifyContent="space-between" mb={2}>
          <SoftTypography variant="h6" fontWeight="medium">
            Optional extras
          </SoftTypography>
          <SoftButton
            variant="outlined"
            color="info"
            size="small"
            onClick={() => openPicker("optional")}
            disabled={disabled || isLoading || availableOptionalServices.length === 0}
          >
            + Add Optional
          </SoftButton>
        </SoftBox>
        {renderServiceList(optionalServices, false)}
      </SoftBox>

      <ServicePickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        services={
          pickerMode === "mandatory" ? availableMandatoryServices : availableOptionalServices
        }
        onAdd={handleAddService}
        title={pickerMode === "mandatory" ? "Add included extra" : "Add optional extra"}
        disabled={disabled}
      />
    </SoftBox>
  );
}

CourseServicesStep.propTypes = {
  formData: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  campusId: PropTypes.string,
  isEditMode: PropTypes.bool,
};

export default CourseServicesStep;
