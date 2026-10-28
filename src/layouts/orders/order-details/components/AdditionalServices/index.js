import PropTypes from "prop-types";
import { useState, useEffect, useMemo } from "react";
import Card from "@mui/material/Card";
import Icon from "@mui/material/Icon";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import { formatMoney } from "services/currencyService";

const money = (amount, currency) => formatMoney(amount, currency || "EUR");

/** Only optional (extras) services are shown in this section; mandatory services are excluded. */
const getOptionalServices = (services) => {
  if (!services || !Array.isArray(services)) return [];
  return services.filter((s) => !s.isMandatory);
};

function AdditionalServices({ services, isEditMode = false, servicesOptions = [], isLoadingServices = false, onServicesChange, currency = "EUR" }) {
  const [selectedServices, setSelectedServices] = useState(new Set());
  const optionalServices = useMemo(() => getOptionalServices(services), [services]);
  const optionalServicesOptions = useMemo(
    () => (servicesOptions || []).filter((opt) => !opt.isMandatory),
    [servicesOptions]
  );

  useEffect(() => {
    if (services && services.length > 0) {
      const serviceIds = new Set(services.map((s) => s.id));
      setSelectedServices(serviceIds);
    }
  }, [services]);

  const handleServiceToggle = (serviceId, serviceName, serviceCost, isMandatory = false) => {
    if (isMandatory) return;
    const newSelected = new Set(selectedServices);
    if (newSelected.has(serviceId)) {
      newSelected.delete(serviceId);
    } else {
      newSelected.add(serviceId);
    }
    setSelectedServices(newSelected);

    const updatedServices = Array.from(newSelected).map((id) => {
      const existing = services?.find((s) => s.id === id);
      if (existing) {
        return existing;
      }
      const option = servicesOptions.find((s) => s.value === id);
      return {
        id: option?.value || id,
        name: option?.label || serviceName,
        cost: serviceCost || 0,
        currency: option?.currency,
        courseServiceId: option?.courseServiceId,
        isMandatory: Boolean(option?.isMandatory),
        createdAt: new Date().toISOString(),
      };
    });

    onServicesChange && onServicesChange(updatedServices);
  };

  const formatTotal = () => {
    const totals = new Map();
    optionalServices.forEach((service) => {
      const code = service.currency || currency;
      totals.set(code, (totals.get(code) || 0) + (service.cost || 0));
    });
    if (totals.size === 0) return money(0, currency);
    return [...totals].map(([code, sum]) => money(sum, code)).join(" + ");
  };

  return (
    <Card
      sx={{
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        overflow: "hidden",
      }}
    >
      <SoftBox p={3}>
        <SoftBox 
          display="flex" 
          justifyContent="space-between" 
          alignItems="center" 
          mb={3}
          sx={{
            paddingBottom: "16px",
            borderBottom: "2px solid #f5f5f5",
          }}
        >
          <SoftTypography 
            variant="h6" 
            fontWeight="600"
            sx={{
              fontSize: "18px",
              color: "#212121",
            }}
          >
            Additional Services / Extras
          </SoftTypography>
          <SoftTypography 
            variant="h6" 
            fontWeight="700"
            sx={{
              fontSize: "18px",
              color: "#0B7A5A",
              backgroundColor: "rgba(46, 125, 50, 0.08)",
              padding: "8px 16px",
              borderRadius: "8px",
            }}
          >
            Total: {formatTotal()}
          </SoftTypography>
        </SoftBox>

        {isLoadingServices ? (
          <SoftTypography variant="body2" color="text.secondary">
            Loading services...
          </SoftTypography>
        ) : (optionalServicesOptions.length > 0) || optionalServices.length > 0 ? (
          <SoftBox display="flex" flexDirection="column" gap={1.5}>
            {isEditMode && optionalServicesOptions.length > 0 ? (
              optionalServicesOptions.map((serviceOption) => {
                const isChecked = selectedServices.has(serviceOption.value);
                const service = services?.find((s) => s.id === serviceOption.value);
                const serviceCost = service?.cost ?? serviceOption.price ?? serviceOption.cost ?? 0;

                return (
                  <SoftBox
                    key={serviceOption.value}
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      padding: "8px 16px",
                      paddingLeft: "8px",
                      backgroundColor: isChecked ? "rgba(33, 150, 243, 0.08)" : "#ffffff",
                      borderRadius: "12px",
                      border: `2px solid ${isChecked ? "#6D4AFF" : "#e0e0e0"}`,
                      transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                      cursor: isEditMode ? "pointer" : "default",
                      boxShadow: isChecked 
                        ? "0 2px 8px rgba(33, 150, 243, 0.15)" 
                        : "0 1px 3px rgba(0, 0, 0, 0.05)",
                      "&:hover": isEditMode ? {
                        borderColor: isChecked ? "#6D4AFF" : "#bdbdbd",
                        boxShadow: isChecked 
                          ? "0 4px 12px rgba(33, 150, 243, 0.2)" 
                          : "0 2px 6px rgba(0, 0, 0, 0.1)",
                        transform: "translateY(-1px)",
                      } : {},
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={isChecked}
                          onChange={() => handleServiceToggle(serviceOption.value, serviceOption.label, serviceCost, serviceOption.isMandatory)}
                          disabled={!isEditMode || serviceOption.isMandatory}
                          color="primary"
                          sx={{
                            padding: "4px",
                            marginRight: "12px",
                            "& .MuiSvgIcon-root": {
                              fontSize: "24px",
                            },
                          }}
                        />
                      }
                      label={
                        <SoftBox display="flex" alignItems="center" gap={1} sx={{ flex: 1, minWidth: 0 }}>
                          <SoftTypography
                            variant="body2"
                            color="text"
                            fontWeight={isChecked ? "600" : "500"}
                            sx={{
                              fontSize: "14px",
                              lineHeight: "1.5",
                              color: isChecked ? "#6D4AFF" : "#424242",
                              wordBreak: "break-word",
                            }}
                          >
                            {serviceOption.label || ""}
                          </SoftTypography>
                        </SoftBox>
                      }
                      sx={{
                        margin: 0,
                        flex: 1,
                      }}
                    />
                    <SoftTypography 
                      variant="body2" 
                      color="success" 
                      fontWeight="bold"
                      sx={{
                        fontSize: "15px",
                        minWidth: "fit-content",
                        marginLeft: "16px",
                        color: isChecked ? "#0B7A5A" : "#12B886",
                      }}
                    >
                      {money(serviceCost, serviceOption.currency || service?.currency || currency)}
                    </SoftTypography>
                  </SoftBox>
                );
              })
            ) : (
              optionalServices.length > 0 ? (
                optionalServices.map((service) => {
                  const isChecked = selectedServices.has(service.id);
                  return (
                    <SoftBox
                      key={service.id}
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{
                        padding: "8px 16px",
                        paddingLeft: "8px",
                        backgroundColor: isChecked ? "rgba(33, 150, 243, 0.08)" : "#ffffff",
                        borderRadius: "12px",
                        border: `2px solid ${isChecked ? "#6D4AFF" : "#e0e0e0"}`,
                        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                        cursor: isEditMode ? "pointer" : "default",
                        boxShadow: isChecked 
                          ? "0 2px 8px rgba(33, 150, 243, 0.15)" 
                          : "0 1px 3px rgba(0, 0, 0, 0.05)",
                        "&:hover": isEditMode ? {
                          borderColor: isChecked ? "#6D4AFF" : "#bdbdbd",
                          boxShadow: isChecked 
                            ? "0 4px 12px rgba(33, 150, 243, 0.2)" 
                            : "0 2px 6px rgba(0, 0, 0, 0.1)",
                          transform: "translateY(-1px)",
                        } : {},
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={true}
                            disabled={true}
                            color="primary"
                            sx={{
                              padding: "4px",
                              marginRight: "12px",
                              "& .MuiSvgIcon-root": {
                                fontSize: "24px",
                              },
                            }}
                          />
                        }
                        label={
                          <SoftTypography
                            variant="body2"
                            color="text"
                            fontWeight={isChecked ? "600" : "500"}
                            sx={{
                              fontSize: "14px",
                              lineHeight: "1.5",
                              color: isChecked ? "#6D4AFF" : "#424242",
                              wordBreak: "break-word",
                            }}
                          >
                            {service.name || "Unknown Service"}
                          </SoftTypography>
                        }
                        sx={{
                          margin: 0,
                          flex: 1,
                        }}
                      />
                      <SoftTypography 
                        variant="body2" 
                        color="success" 
                        fontWeight="bold"
                        sx={{
                          fontSize: "15px",
                          minWidth: "fit-content",
                          marginLeft: "16px",
                          color: isChecked ? "#0B7A5A" : "#12B886",
                        }}
                      >
                        {money(service.cost || 0, service.currency || currency)}
                      </SoftTypography>
                    </SoftBox>
                  );
                })
              ) : (
                <SoftBox
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  sx={{
                    padding: "24px",
                    backgroundColor: "#F7F6FB",
                    borderRadius: "8px",
                    border: "1px dashed #dee2e6",
                  }}
                >
                  <SoftTypography variant="body2" color="text.secondary">
                    No additional services available
                  </SoftTypography>
                </SoftBox>
              )
            )}
          </SoftBox>
        ) : (
          <SoftBox
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              padding: "24px",
              backgroundColor: "#F7F6FB",
              borderRadius: "8px",
              border: "1px dashed #dee2e6",
            }}
          >
            <SoftTypography variant="body2" color="text.secondary">
              No additional services available
            </SoftTypography>
          </SoftBox>
        )}
      </SoftBox>
    </Card>
  );
}

AdditionalServices.propTypes = {
  services: PropTypes.array.isRequired,
  isEditMode: PropTypes.bool,
  servicesOptions: PropTypes.array,
  isLoadingServices: PropTypes.bool,
  onServicesChange: PropTypes.func,
  currency: PropTypes.string,
};

export default AdditionalServices;
