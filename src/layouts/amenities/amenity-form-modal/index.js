import { useEffect, useState } from "react";
import PropTypes from "prop-types";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import CircularProgress from "@mui/material/CircularProgress";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";
import { AmenityService } from "services/amenityService";

const INITIAL_FORM = {
  name: "",
  iconUrl: "",
};

const ACCEPTED_ICON_TYPES = "image/png,image/jpeg,image/jpg,image/webp,image/svg+xml,.svg";

async function uploadAmenityIcon(file) {
  const { MediaService } = await import("services/mediaService");
  const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
  const key = `amenities/icons/${Date.now()}-${safeName}`;
  const contentType = file.type || "image/png";
  const presignedData = await MediaService.getPresignedUploadUrl(key, contentType, true);
  await MediaService.uploadFileToS3WithFallback(presignedData.url, file);
  return presignedData.publicUrl;
}

function AmenityFormModal({ open, onClose, mode, amenity, onSuccess }) {
  const isEdit = mode === "edit";
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  useEffect(() => {
    if (!open) return;

    if (!isEdit) {
      setFormData(INITIAL_FORM);
      setError("");
      return;
    }

    const load = async () => {
      if (!amenity?.id) return;
      setLoading(true);
      setError("");
      try {
        const full =
          amenity.iconUrl !== undefined || amenity.name
            ? amenity
            : await AmenityService.getAmenityById(amenity.id);
        setFormData({
          name: full.name || "",
          // Generated default icons (data URLs) are not editable; leave the field empty for them.
          iconUrl: String(full.iconUrl || "").startsWith("data:") ? "" : full.iconUrl || "",
        });
      } catch (err) {
        setError(err.message || "Failed to load facility.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, isEdit, amenity]);

  const handleSubmit = async () => {
    const name = String(formData.name || "").trim();
    if (!name) {
      setError("Facility name is required.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const payload = {
        name,
        iconUrl: String(formData.iconUrl || "").trim(),
      };
      if (isEdit && amenity?.id) {
        await AmenityService.updateAmenity(amenity.id, payload);
      } else {
        await AmenityService.createAmenity(payload);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(err.message || "Failed to save facility.");
    } finally {
      setSaving(false);
    }
  };

  const iconPreviewUrl = String(formData.iconUrl || "").trim();
  const isBusy = saving || loading || uploadingIcon;

  const handleIconFileChange = async (fileList) => {
    const file = fileList?.[0];
    if (!file) return;

    const isImage =
      file.type.startsWith("image/") || String(file.name || "").toLowerCase().endsWith(".svg");
    if (!isImage) {
      setError("Please upload a PNG, JPG, WEBP, or SVG file.");
      return;
    }

    try {
      setUploadingIcon(true);
      setError("");
      const publicUrl = await uploadAmenityIcon(file);
      setFormData((prev) => ({ ...prev, iconUrl: publicUrl }));
    } catch (err) {
      setError(err.message || "Failed to upload icon.");
    } finally {
      setUploadingIcon(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{isEdit ? "Edit facility" : "Add facility"}</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <SoftBox py={4} display="flex" justifyContent="center">
            <CircularProgress />
          </SoftBox>
        ) : (
          <SoftBox display="flex" flexDirection="column" gap={2} pt={1}>
            {error && (
              <SoftTypography variant="caption" color="error">
                {error}
              </SoftTypography>
            )}
            <SoftBox>
              <SoftTypography variant="caption" fontWeight="bold" mb={0.5} display="block">
                Facility name *
              </SoftTypography>
              <SoftInput
                placeholder="e.g. Swimming Pool"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                disabled={isBusy}
              />
            </SoftBox>
            <SoftBox>
              <SoftTypography variant="caption" fontWeight="bold" mb={0.5} display="block">
                Icon (optional)
              </SoftTypography>
              <SoftButton
                variant="outlined"
                color="dark"
                component="label"
                disabled={isBusy}
                startIcon={<Icon>upload</Icon>}
                sx={{ mb: 1.5, display: "inline-flex" }}
              >
                {uploadingIcon ? "Uploading..." : "Upload from computer"}
                <input
                  type="file"
                  hidden
                  accept={ACCEPTED_ICON_TYPES}
                  onChange={(e) => {
                    handleIconFileChange(e.target.files);
                    e.target.value = "";
                  }}
                />
              </SoftButton>
              <SoftTypography variant="caption" color="text" display="block" mb={0.75}>
                or paste a CDN link
              </SoftTypography>
              <SoftInput
                placeholder="https://cdn.example.com/icons/pool.svg"
                value={formData.iconUrl}
                onChange={(e) => setFormData((prev) => ({ ...prev, iconUrl: e.target.value }))}
                disabled={isBusy}
              />
              {iconPreviewUrl && (
                <SoftButton
                  variant="text"
                  color="secondary"
                  size="small"
                  sx={{ mt: 0.5 }}
                  disabled={isBusy}
                  onClick={() => setFormData((prev) => ({ ...prev, iconUrl: "" }))}
                >
                  Remove icon
                </SoftButton>
              )}
            </SoftBox>
            <SoftBox>
              <SoftTypography variant="caption" fontWeight="bold" mb={1} display="block">
                Preview
              </SoftTypography>
              <SoftBox
                width={64}
                height={64}
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
                bgcolor="grey.200"
                overflow="hidden"
              >
                {iconPreviewUrl ? (
                  <BoxImage src={iconPreviewUrl} alt="" />
                ) : (
                  <Icon color="action">image</Icon>
                )}
              </SoftBox>
            </SoftBox>
          </SoftBox>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <SoftButton variant="text" color="secondary" onClick={onClose} disabled={isBusy}>
          Cancel
        </SoftButton>
        <SoftButton variant="gradient" color="info" onClick={handleSubmit} disabled={isBusy}>
          {saving ? "Saving..." : "Save"}
        </SoftButton>
      </DialogActions>
    </Dialog>
  );
}

function BoxImage({ src, alt }) {
  return (
    <img
      src={src}
      alt={alt}
      style={{ width: "100%", height: "100%", objectFit: "contain" }}
      onError={(e) => {
        e.currentTarget.style.display = "none";
      }}
    />
  );
}

BoxImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string,
};

AmenityFormModal.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  mode: PropTypes.oneOf(["add", "edit"]).isRequired,
  amenity: PropTypes.object,
  onSuccess: PropTypes.func,
};

export default AmenityFormModal;
