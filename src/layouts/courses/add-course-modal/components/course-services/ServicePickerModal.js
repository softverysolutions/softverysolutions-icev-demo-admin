import { useMemo, useState } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";

import { formatServiceType } from "utils/serviceTypeUtils";

function ServicePickerModal({ open, onClose, services, onAdd, title, disabled = false }) {
  const [search, setSearch] = useState("");

  const filteredServices = useMemo(() => {
    if (!search) return services;
    const lower = search.toLowerCase();
    return services.filter(
      (service) =>
        service.name?.toLowerCase().includes(lower) || service.type?.toLowerCase().includes(lower)
    );
  }, [services, search]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <SoftTypography variant="h6" fontWeight="medium">
          {title}
        </SoftTypography>
      </DialogTitle>
      <DialogContent>
        <SoftBox mb={2}>
          <SoftInput
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </SoftBox>

        <SoftBox display="flex" flexDirection="column" gap={1.5}>
          {filteredServices.length === 0 && (
            <SoftTypography variant="body2" color="text.secondary">
              No services found.
            </SoftTypography>
          )}
          {filteredServices.map((service) => (
            <SoftBox
              key={service.id}
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              px={2}
              py={1.5}
              sx={{
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "#fff",
              }}
            >
              <SoftBox display="flex" flexDirection="column" gap={0.5}>
                <SoftTypography variant="body2" fontWeight="medium">
                  {service.name}
                </SoftTypography>
                <SoftBox display="flex" alignItems="center" gap={1}>
                  <SoftTypography variant="caption" color="text.secondary">
                    {service.description ? service.description.slice(0, 60) : "No description"}
                  </SoftTypography>
                  <SoftBox
                    px={1}
                    py={0.25}
                    sx={{
                      borderRadius: "12px",
                      backgroundColor: service.isActive !== false ? "#F1EDFF" : "#e0e0e0",
                    }}
                  >
                    <SoftTypography variant="caption" color={service.isActive !== false ? "info" : "text"}>
                      {formatServiceType(service.type)}
                    </SoftTypography>
                  </SoftBox>
                </SoftBox>
              </SoftBox>
              <SoftButton
                variant="outlined"
                color="info"
                size="small"
                disabled={disabled}
                onClick={() => onAdd(service)}
              >
                Add
              </SoftButton>
            </SoftBox>
          ))}
        </SoftBox>
      </DialogContent>
      <DialogActions>
        <SoftButton color="light" onClick={onClose}>
          Close
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

ServicePickerModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  services: PropTypes.array.isRequired,
  onAdd: PropTypes.func.isRequired,
  title: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
};

export default ServicePickerModal;
