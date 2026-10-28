import { useState } from "react";
import PropTypes from "prop-types";
import Icon from "@mui/material/Icon";
import Tooltip from "@mui/material/Tooltip";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

import SoftBox from "components/SoftBox";
import SoftTypography from "components/SoftTypography";

import { ICON_COLOR } from "./constants";

export function LogoCell({ value }) {
  const [imageError, setImageError] = useState(false);

  if (!value || imageError || (typeof value === "string" && value.startsWith("blob:"))) {
    return (
      <SoftBox
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="lg"
        shadow="md"
        width="60px"
        height="60px"
        bgcolor="grey.200"
        sx={{ border: "1px solid", borderColor: "grey.300" }}
      >
        <Icon sx={{ color: "grey.500", fontSize: "24px" }}>business</Icon>
      </SoftBox>
    );
  }

  return (
    <SoftBox
      component="img"
      src={value}
      alt="provider logo"
      borderRadius="lg"
      shadow="md"
      width="60px"
      height="60px"
      sx={{ objectFit: "cover" }}
      onError={() => setImageError(true)}
    />
  );
}

LogoCell.propTypes = {
  value: PropTypes.string,
};

export function ActionsCell({
  row,
  onView,
  onEdit,
  onDelete,
  onToggleStatus,
  isUpdating,
  hideRowMutations,
}) {
  const handleCheckboxChange = (e) => {
    e.stopPropagation();
    if (!isUpdating) {
      onToggleStatus(row);
    }
  };

  const isActive = row.isActive !== undefined ? row.isActive : true;

  return (
    <SoftBox display="flex" alignItems="center" justifyContent="center" gap={2}>
      {!hideRowMutations && (
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
        <Tooltip title="View provider" placement="top">
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
      {!hideRowMutations && (
        <>
          <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
            <Tooltip title="Edit provider" placement="top">
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
          <SoftTypography variant="body1" color="secondary" sx={{ cursor: "pointer", lineHeight: 0 }}>
            <Tooltip title="Delete provider" placement="left">
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
        </>
      )}
    </SoftBox>
  );
}

LogoCell.propTypes = {
  value: PropTypes.string,
};

ActionsCell.propTypes = {
  row: PropTypes.object.isRequired,
  onView: PropTypes.func.isRequired,
  onEdit: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  onToggleStatus: PropTypes.func.isRequired,
  isUpdating: PropTypes.bool,
  hideRowMutations: PropTypes.bool,
};
