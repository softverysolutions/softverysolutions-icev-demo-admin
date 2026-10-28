import { useRef, useState } from "react";
import PropTypes from "prop-types";
import Grid from "@mui/material/Grid";
import Icon from "@mui/material/Icon";
import CircularProgress from "@mui/material/CircularProgress";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";

import { MediaService } from "services/mediaService";
import { formatImageUrl } from "utils/imageUtils";
import { SERVICE_DETAIL_LIMITS } from "../serviceDetailFields";
import { StringListField, multilineFieldStyle } from "./StringListField";

const COVER_TYPES = ["image/jpeg", "image/png", "image/webp"];
const COVER_MAX_BYTES = 5 * 1024 * 1024;

function FieldError({ message }) {
  if (!message) return null;
  return (
    <SoftTypography variant="caption" color="error" display="block" mt={0.5}>
      {message}
    </SoftTypography>
  );
}

FieldError.propTypes = { message: PropTypes.string };
FieldError.defaultProps = { message: "" };

function CharCount({ value, max }) {
  const length = String(value || "").length;
  return (
    <SoftTypography
      variant="caption"
      color={length > max ? "error" : "secondary"}
      display="block"
      textAlign="right"
    >
      {length}/{max}
    </SoftTypography>
  );
}

CharCount.propTypes = { value: PropTypes.string, max: PropTypes.number.isRequired };
CharCount.defaultProps = { value: "" };

/** "More details" layer content of an extra in the app. */
function ServiceDetailContentSection({ formData, onInputChange, errors, disabled }) {
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [coverError, setCoverError] = useState("");

  const handleCoverFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!COVER_TYPES.includes(file.type)) {
      setCoverError("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > COVER_MAX_BYTES) {
      setCoverError("The image must be 5 MB or smaller.");
      return;
    }
    setCoverError("");
    setUploading(true);
    try {
      const url = await MediaService.uploadServiceCoverImage(file, formData.name);
      onInputChange("coverImageUrl", url);
    } catch (error) {
      setCoverError(error?.message || "Failed to upload the image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Grid item xs={12}>
        <SoftBox mt={1}>
          <SoftTypography variant="h6" fontWeight="medium">
            Detail content (app)
          </SoftTypography>
          <SoftTypography variant="caption" color="text">
            Shown in the extra&apos;s &quot;More details&quot; layer of the app checkout. All fields
            are optional; the long description above is used as the description.
          </SoftTypography>
        </SoftBox>
      </Grid>

      <Grid item xs={12} md={5}>
        <SoftTypography component="label" variant="caption" fontWeight="bold">
          Cover photo
        </SoftTypography>
        <SoftBox
          mt={0.5}
          sx={{
            border: "1px dashed",
            borderColor: "grey.400",
            borderRadius: 2,
            overflow: "hidden",
            aspectRatio: "16 / 9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "grey.100",
          }}
        >
          {uploading ? (
            <CircularProgress size={24} />
          ) : formData.coverImageUrl ? (
            <SoftBox
              component="img"
              src={formatImageUrl(formData.coverImageUrl)}
              alt="Service cover"
              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <SoftBox textAlign="center" color="secondary">
              <Icon>image</Icon>
              <SoftTypography variant="caption" color="secondary" display="block">
                No cover photo
              </SoftTypography>
            </SoftBox>
          )}
        </SoftBox>
        {!disabled && (
          <SoftBox display="flex" gap={1} mt={1}>
            <input
              ref={fileInputRef}
              type="file"
              accept={COVER_TYPES.join(",")}
              hidden
              onChange={handleCoverFile}
            />
            <SoftButton
              size="small"
              variant="outlined"
              color="info"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              startIcon={<Icon fontSize="small">upload</Icon>}
            >
              {formData.coverImageUrl ? "Replace" : "Upload"}
            </SoftButton>
            {formData.coverImageUrl && (
              <SoftButton
                size="small"
                variant="text"
                color="error"
                disabled={uploading}
                onClick={() => onInputChange("coverImageUrl", "")}
                startIcon={<Icon fontSize="small">delete</Icon>}
              >
                Remove
              </SoftButton>
            )}
          </SoftBox>
        )}
        <FieldError message={coverError} />
      </Grid>

      <Grid item xs={12} md={7}>
        <SoftTypography component="label" variant="caption" fontWeight="bold">
          Highlight sentence
        </SoftTypography>
        <SoftInput
          placeholder="e.g. Pick-up at the airport on arrival day"
          value={formData.highlight || ""}
          onChange={(e) => onInputChange("highlight", e.target.value)}
          disabled={disabled}
          error={Boolean(errors.highlight)}
        />
        <CharCount value={formData.highlight} max={SERVICE_DETAIL_LIMITS.highlight} />
        <FieldError message={errors.highlight} />
        <SoftTypography variant="caption" color="text" display="block">
          Short text shown in the add-on row.
        </SoftTypography>

        <SoftBox mt={2}>
          <StringListField
            label="What is included"
            iconName="check_circle"
            iconColor="success"
            items={formData.includedItems || []}
            onChange={(items) => onInputChange("includedItems", items)}
            addButtonLabel="Add included item"
            placeholder="e.g. Board and wetsuit"
            disabled={disabled}
          />
          <FieldError message={errors.includedItems} />
        </SoftBox>
      </Grid>

      <Grid item xs={12} md={6}>
        <SoftTypography component="label" variant="caption" fontWeight="bold">
          Complementary information
        </SoftTypography>
        <textarea
          style={multilineFieldStyle(disabled)}
          placeholder="e.g. Send your flight number at least 7 days before arrival."
          value={formData.complementaryInfo || ""}
          onChange={(e) => onInputChange("complementaryInfo", e.target.value)}
          disabled={disabled}
        />
        <CharCount
          value={formData.complementaryInfo}
          max={SERVICE_DETAIL_LIMITS.complementaryInfo}
        />
        <FieldError message={errors.complementaryInfo} />
      </Grid>

      <Grid item xs={12} md={6}>
        <SoftTypography component="label" variant="caption" fontWeight="bold">
          Warning note
        </SoftTypography>
        <textarea
          style={multilineFieldStyle(disabled)}
          placeholder="e.g. Not available for arrivals after 22:00."
          value={formData.warningNote || ""}
          onChange={(e) => onInputChange("warningNote", e.target.value)}
          disabled={disabled}
        />
        <CharCount value={formData.warningNote} max={SERVICE_DETAIL_LIMITS.warningNote} />
        <FieldError message={errors.warningNote} />
        <SoftTypography variant="caption" color="text" display="block">
          Shown as the amber note.
        </SoftTypography>
      </Grid>
    </>
  );
}

ServiceDetailContentSection.propTypes = {
  formData: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  errors: PropTypes.object,
  disabled: PropTypes.bool,
};

ServiceDetailContentSection.defaultProps = {
  errors: {},
  disabled: false,
};

export default ServiceDetailContentSection;
