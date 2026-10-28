import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import IconButton from "@mui/material/IconButton";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";
import SoftInput from "components/SoftInput";
import SoftButton from "components/SoftButton";

export const multilineFieldStyle = (disabled) => ({
  width: "100%",
  minHeight: "110px",
  padding: "12px 16px",
  border: "1px solid #E7E5F0",
  borderRadius: "8px",
  fontSize: "14px",
  fontFamily: "inherit",
  resize: "vertical",
  whiteSpace: "pre-wrap",
  backgroundColor: disabled ? "#F7F6FB" : "#ffffff",
  color: disabled ? "#6c757d" : "#495057",
});

export function StringListField({
  label,
  iconName,
  iconColor = "text",
  items = [],
  onChange,
  addButtonLabel,
  placeholder,
  disabled = false,
}) {
  const updateItem = (index, value) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const addItem = () => onChange([...items, ""]);

  const removeItem = (index) => onChange(items.filter((_, i) => i !== index));

  return (
    <SoftBox mb={2}>
      <SoftBox display="flex" alignItems="center" gap={0.75} mb={0.5}>
        <Icon fontSize="small" color={iconColor}>
          {iconName}
        </Icon>
        <SoftTypography component="label" variant="caption" fontWeight="bold">
          {label}
        </SoftTypography>
      </SoftBox>
      {items.length === 0 ? (
        <SoftBox
          p={2}
          borderRadius={2}
          border="1px solid"
          borderColor="grey.300"
          bgcolor="grey.50"
          mb={1}
        >
          <SoftTypography variant="caption" color="text.secondary">
            No items yet.
          </SoftTypography>
        </SoftBox>
      ) : (
        items.map((item, index) => (
          <SoftBox key={`${label}-${index}`} display="flex" alignItems="center" gap={1} mb={1}>
            <SoftInput
              size="small"
              placeholder={placeholder}
              value={item || ""}
              onChange={(e) => updateItem(index, e.target.value)}
              disabled={disabled}
              sx={{ flex: 1, minWidth: 0 }}
            />
            <IconButton
              size="small"
              color="error"
              disabled={disabled}
              onClick={() => removeItem(index)}
              aria-label={`Remove ${label} item`}
            >
              <Icon fontSize="small">delete</Icon>
            </IconButton>
          </SoftBox>
        ))
      )}
      <SoftButton
        variant="outlined"
        color="dark"
        size="small"
        disabled={disabled}
        onClick={addItem}
        startIcon={<Icon fontSize="small">add</Icon>}
      >
        {addButtonLabel}
      </SoftButton>
    </SoftBox>
  );
}

StringListField.propTypes = {
  label: PropTypes.string.isRequired,
  iconName: PropTypes.string.isRequired,
  iconColor: PropTypes.string,
  items: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  addButtonLabel: PropTypes.string.isRequired,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
};

