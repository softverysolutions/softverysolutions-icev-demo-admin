import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import { ICON_COLOR } from "./constants";

export function PriceCell({ value }) {
  return (
    <SoftBox display="flex" alignItems="center">
      <SoftTypography variant="body2" fontWeight="medium">
        {value}
      </SoftTypography>
    </SoftBox>
  );
}

PriceCell.propTypes = {
  value: PropTypes.string,
};

export function DescriptionCell({ value }) {
  const maxLength = 50;
  const truncatedText = value.length > maxLength ? `${value.substring(0, maxLength)}...` : value;
  const description = value.length > maxLength ? value : null;

  return (
    <Tooltip
      title={description}
      placement="bottom"
      componentsProps={{
        tooltip: {
          sx: {
            backgroundColor: "rgba(0, 0, 0, 0.2)",
            color: "#000",
            fontSize: "12px",
            maxWidth: "300px",
            padding: "8px 12px",
            borderRadius: "4px",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
            backdropFilter: "blur(4px)",
          },
        },
      }}
    >
      <div
        style={{
          cursor: "pointer",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          width: "100%",
          maxWidth: "100%",
        }}
      >
        <SoftTypography variant="body2">{truncatedText}</SoftTypography>
      </div>
    </Tooltip>
  );
}

DescriptionCell.propTypes = {
  value: PropTypes.string,
};

export function ActionsCell({
  row,
  onView,
  onEdit,
  onDelete,
  onPriceList,
  onDuplicate,
  onToggleStatus,
  isUpdating,
  hideRowMutations = false,
  entityType = "course",
}) {
  const getTooltipTitle = (action) => {
    let entity = "course";
    if (entityType === "service") {
      entity = "service";
    } else if (entityType === "accommodation") {
      entity = "accommodation";
    }
    return `${action} ${entity}`;
  };

  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (!isUpdating && onToggleStatus) {
      onToggleStatus(row);
    }
  };

  const isActive = row.isActive !== undefined ? row.isActive : true;

  return (
    <SoftBox display="flex" alignItems="center" justifyContent="center" gap={2}>
      {onToggleStatus && !hideRowMutations && (
        <FormControlLabel
          control={
            <Checkbox
              checked={isActive}
              onChange={handleCheckboxChange}
              disabled={isUpdating}
              size="small"
              onClick={(e) => e.stopPropagation()}
            />
          }
          label=""
          sx={{ margin: 0 }}
        />
      )}
      <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
        <Tooltip title={getTooltipTitle("View")} placement="top">
          <Icon
            sx={{ color: ICON_COLOR }}
            fontSize="medium"
            onClick={(e) => {
              e.stopPropagation();
              onView(row);
            }}
          >
            visibility
          </Icon>
        </Tooltip>
      </SoftTypography>
      {(entityType === "course" || entityType === "accommodation") && onDuplicate && !hideRowMutations && (
        <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
          <Tooltip title={getTooltipTitle("Duplicate")} placement="top">
            <Icon
              sx={{ color: ICON_COLOR }}
              fontSize="medium"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(row);
              }}
            >
              content_copy
            </Icon>
          </Tooltip>
        </SoftTypography>
      )}
      {!hideRowMutations && (
        <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
          <Tooltip title={getTooltipTitle("Edit")} placement="top">
            <Icon
              sx={{ color: ICON_COLOR }}
              fontSize="medium"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row);
              }}
            >
              edit
            </Icon>
          </Tooltip>
        </SoftTypography>
      )}
      {entityType === "course" && onPriceList && !hideRowMutations && (
        <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
          <Tooltip title="Manage Price Lists" placement="top">
            <Icon
              sx={{ color: ICON_COLOR }}
              fontSize="medium"
              onClick={(e) => {
                e.stopPropagation();
                onPriceList(row);
              }}
            >
              receipt_long
            </Icon>
          </Tooltip>
        </SoftTypography>
      )}
      {!hideRowMutations && (
        <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
          <Tooltip title={getTooltipTitle("Delete")} placement="left">
            <Icon
              sx={{ color: ICON_COLOR }}
              fontSize="medium"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row);
              }}
            >
              delete
            </Icon>
          </Tooltip>
        </SoftTypography>
      )}
    </SoftBox>
  );
}

ActionsCell.propTypes = {
  row: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onPriceList: PropTypes.func,
  onDuplicate: PropTypes.func,
  onToggleStatus: PropTypes.func,
  isUpdating: PropTypes.bool,
  hideRowMutations: PropTypes.bool,
  entityType: PropTypes.oneOf(["course", "service", "accommodation"]),
};
