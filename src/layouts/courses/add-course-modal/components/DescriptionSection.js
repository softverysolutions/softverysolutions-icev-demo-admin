import PropTypes from "prop-types";
import { IconButton, Grid } from "@mui/material";
import Icon from "@mui/material/Icon";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftButton from "components/SoftButton";
import SoftInput from "components/SoftInput";
// import RichTextEditor from "components/RichTextEditor";
import SoftEditor from "components/SoftEditor";

function DescriptionSection({
  formData,
  onInputChange,
  disabled = false,
  onCancel,
  onNext,
  showButtons = false,
  isEditMode = false,
}) {
  return (
    <Grid item xs={12}>
      {/* Program Description (optional) - commented out, using Project Description only
      <SoftBox mb={1} ml={0.5} lineHeight={0} display="inline-block">
        <SoftTypography component="label" variant="caption" fontWeight="bold">
          Program Description&nbsp;&nbsp;
          <SoftTypography variant="caption" fontWeight="regular" color="text">
            (optional)
          </SoftTypography>
        </SoftTypography>
      </SoftBox>
      <RichTextEditor
        value={formData.description || ""}
        onChange={(html) => onInputChange("description", html)}
        placeholder="Enter program description..."
        disabled={disabled}
        minHeight={120}
      />
      */}

      <SoftBox mb={1} ml={0.5} lineHeight={0} display="inline-block">
        <SoftTypography component="label" variant="caption" fontWeight="bold">
          Project Description
        </SoftTypography>
      </SoftBox>

      <SoftBox dir="ltr" sx={{ direction: "ltr", textAlign: "left" }}>
        <SoftEditor
          value={formData.description || ""}
          onChange={(html) => onInputChange("description", html)}
          disabled={disabled}
        />
      </SoftBox>

      <SoftBox mt={3}>
        <SoftTypography
          component="label"
          variant="caption"
          fontWeight="bold"
          mb={1}
          display="block"
        >
          Programme Highlights
          <SoftTypography variant="caption" fontWeight="regular" color="text">
            &nbsp;&nbsp;(optional)
          </SoftTypography>
        </SoftTypography>
        {(formData.courseHighlights || []).map((highlight, index) => (
          <SoftBox key={index} display="flex" gap={1} mb={1} alignItems="flex-start">
            <SoftInput
              placeholder="Enter highlight text..."
              value={highlight.text || ""}
              onChange={(e) => {
                const newHighlights = [...(formData.courseHighlights || [])];
                newHighlights[index] = { text: e.target.value };
                onInputChange("courseHighlights", newHighlights);
              }}
              disabled={disabled}
              fullWidth
            />
            <IconButton
              onClick={() => {
                const newHighlights = (formData.courseHighlights || []).filter(
                  (_, i) => i !== index
                );
                onInputChange("courseHighlights", newHighlights);
              }}
              disabled={disabled || (formData.courseHighlights || []).length <= 1}
              size="small"
              sx={{ mt: 0.5 }}
            >
              <Icon fontSize="small">delete</Icon>
            </IconButton>
          </SoftBox>
        ))}
        <SoftButton
          variant="outlined"
          color="info"
          size="small"
          onClick={() => {
            const newHighlights = [...(formData.courseHighlights || []), { text: "" }];
            onInputChange("courseHighlights", newHighlights);
          }}
          disabled={disabled}
          startIcon={<Icon>add</Icon>}
          sx={{ mt: 1 }}
        >
          Add Highlight
        </SoftButton>
      </SoftBox>

      {showButtons && !isEditMode && (
        <SoftBox mt={3} display="flex" justifyContent="flex-end" gap={2}>
          <SoftButton color="light" onClick={onCancel} disabled={disabled}>
            Cancel
          </SoftButton>
          <SoftButton variant="gradient" color="info" onClick={onNext} disabled={disabled}>
            Next
          </SoftButton>
        </SoftBox>
      )}
    </Grid>
  );
}

DescriptionSection.propTypes = {
  formData: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  onCancel: PropTypes.func,
  onNext: PropTypes.func,
  showButtons: PropTypes.bool,
  isEditMode: PropTypes.bool,
};

export default DescriptionSection;
